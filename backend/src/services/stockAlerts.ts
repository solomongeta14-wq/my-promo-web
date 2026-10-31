import { prisma } from '../config/prisma'
import { sendStockAlertEmail } from './email'

export async function checkAndCreateStockAlerts(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  })

  if (!variant) return

  const { quantity, minStockLevel, product } = variant

  // Check for existing unread alerts
  const existingAlert = await prisma.stockAlert.findFirst({
    where: {
      variantId,
      isRead: false,
    },
  })

  // Determine alert type needed
  let alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | null = null
  let message = ''

  if (quantity === 0) {
    alertType = 'OUT_OF_STOCK'
    message = `${product.name} (${variant.size}/${variant.color}) is out of stock`
  } else if (quantity <= minStockLevel) {
    alertType = 'LOW_STOCK'
    message = `${product.name} (${variant.size}/${variant.color}) is low on stock (${quantity} remaining, minimum: ${minStockLevel})`
  }

  // If we need an alert and don't have one, create it
  if (alertType && !existingAlert) {
    const alert = await prisma.stockAlert.create({
      data: {
        variantId,
        type: alertType,
        message,
      },
    })

    // Send email notification
    await sendStockAlertEmail(
      alertType,
      product.name,
      { size: variant.size, color: variant.color, sku: variant.sku },
      quantity,
      minStockLevel
    )

    return alert
  }

  // If stock is restored, mark existing alerts as read
  if (quantity > 0 && existingAlert) {
    await prisma.stockAlert.updateMany({
      where: {
        variantId,
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  // If was out of stock but now has stock, resolve OUT_OF_STOCK alerts
  if (quantity > 0) {
    await prisma.stockAlert.updateMany({
      where: {
        variantId,
        type: 'OUT_OF_STOCK',
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  // If was low stock but now above threshold, resolve LOW_STOCK alerts
  if (quantity > minStockLevel) {
    await prisma.stockAlert.updateMany({
      where: {
        variantId,
        type: 'LOW_STOCK',
        isRead: false,
      },
      data: { isRead: true },
    })
  }

  return null
}

export async function getUnreadAlertsCount() {
  return prisma.stockAlert.count({
    where: { isRead: false },
  })
}

export async function markAlertsRead(alertIds: string[]) {
  return prisma.stockAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { isRead: true },
  })
}

export async function getLowStockVariants() {
  return prisma.productVariant.findMany({
    where: {
      isActive: true,
      quantity: {
        lte: prisma.productVariant.fields.minStockLevel,
        gt: 0,
      },
    },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { quantity: 'asc' },
  })
}

export async function getOutOfStockVariants() {
  return prisma.productVariant.findMany({
    where: {
      isActive: true,
      quantity: 0,
    },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}