import { Router } from 'express'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { AuthRequest, requireRole, requirePermission } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { 
  createProductSchema, updateProductSchema, createVariantSchema, updateVariantSchema, restockSchema,
  createCategorySchema, updateCategorySchema,
  createBrandSchema, updateBrandSchema,
  createSaleSchema,
  updateSettingsSchema,
  paginationSchema, productFilterSchema,
} from '../validators'
import { checkAndCreateStockAlerts, getLowStockVariants, getOutOfStockVariants, getUnreadAlertsCount } from '../services/stockAlerts'
import { createBackup, listBackups, deleteBackup, getBackupStats } from '../services/backup'
import { testEmailConnection } from '../services/email'

const router = Router()

// All admin routes require authentication
// Dashboard
router.get('/dashboard/stats', asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalProducts,
    totalVariants,
    totalStockValue,
    todaysSales,
    lowStockCount,
    outOfStockCount,
    unreadAlerts,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.aggregate({
      where: { isActive: true },
      _sum: { quantity: true },
    }),
    prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: 'COMPLETED',
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.productVariant.count({
      where: {
        isActive: true,
        quantity: { gt: 0, lte: prisma.productVariant.fields.minStockLevel },
      },
    }),
    prisma.productVariant.count({
      where: { isActive: true, quantity: 0 },
    }),
    getUnreadAlertsCount(),
  ])

  // Recent transactions
  const recentSales = await prisma.sale.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
  })

  res.json({
    totalProducts,
    totalVariants,
    totalStockValue: totalStockValue._sum.quantity || 0,
    todaysSales: {
      count: todaysSales._count,
      revenue: Number(todaysSales._sum.total || 0),
    },
    lowStockCount,
    outOfStockCount,
    unreadAlerts,
    recentSales,
  })
}))

router.get('/dashboard/low-stock', asyncHandler(async (req, res) => {
  const variants = await getLowStockVariants()
  res.json(variants)
}))

router.get('/dashboard/out-of-stock', asyncHandler(async (req, res) => {
  const variants = await getOutOfStockVariants()
  res.json(variants)
}))

router.get('/dashboard/recent-sales', asyncHandler(async (req, res) => {
  const sales = await prisma.sale.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
  })
  res.json(sales)
}))

router.get('/dashboard/alerts', asyncHandler(async (req, res) => {
  const alerts = await prisma.stockAlert.findMany({
    where: { isRead: false },
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json(alerts)
}))

router.put('/dashboard/alerts/:id/read', asyncHandler(async (req, res) => {
  await prisma.stockAlert.update({
    where: { id: req.params.id },
    data: { isRead: true },
  })
  res.json({ success: true })
}))

router.put('/dashboard/alerts/read-all', asyncHandler(async (req, res) => {
  await prisma.stockAlert.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  })
  res.json({ success: true })
}))

// Products
router.get('/products', validate(productFilterSchema), asyncHandler(async (req, res) => {
  const { page, limit, search, categoryId, brandId, isNewArrival, isActive, sortBy, sortOrder } = req.query

  const where: Prisma.ProductWhereInput = {}
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { slug: { contains: search as string, mode: 'insensitive' } },
    ]
  }
  if (categoryId) where.categoryId = categoryId as string
  if (brandId) where.brandId = brandId as string
  if (isNewArrival !== undefined) where.isNewArrival = isNewArrival === 'true'
  if (isActive !== undefined) where.isActive = isActive === 'true'

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: { where: { isActive: true }, select: { quantity: true, salePrice: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Calculate total stock and value per product
  const productsWithStock = products.map(p => ({
    ...p,
    totalStock: p.variants.reduce((sum, v) => sum + v.quantity, 0),
    minPrice: p.variants.length > 0 ? Math.min(...p.variants.map(v => Number(v.salePrice))) : 0,
    maxPrice: p.variants.length > 0 ? Math.max(...p.variants.map(v => Number(v.salePrice))) : 0,
  }))

  res.json({
    data: productsWithStock,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  })
}))

router.post('/products', validate(createProductSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { variants, ...productData } = req.body

  const product = await prisma.product.create({
    data: {
      ...productData,
      creatorId: req.user!.id,
      variants: variants ? {
        create: variants.map((v: any) => ({
          ...v,
          purchasePrice: new Prisma.Decimal(v.purchasePrice),
          salePrice: new Prisma.Decimal(v.salePrice),
        })),
      } : undefined,
    },
    include: {
      category: true,
      brand: true,
      variants: true,
      images: true,
    },
  })

  // Check stock alerts for new variants
  if (variants) {
    for (const variant of product.variants) {
      await checkAndCreateStockAlerts(variant.id)
    }
  }

  res.status(201).json(product)
}))

router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true }, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
    },
  })

  if (!product) throw new AppError(404, 'Product not found')
  res.json(product)
}))

router.put('/products/:id', validate(updateProductSchema), asyncHandler(async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
    include: { category: true, brand: true, variants: true, images: true },
  })
  res.json(product)
}))

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } })
  res.json({ message: 'Product deleted' })
}))

router.put('/products/:id/publish', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) throw new AppError(404, 'Product not found')

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { isNewArrival: !product.isNewArrival },
  })
  res.json(updated)
}))

// Product images
router.post('/products/:id/images', asyncHandler(async (req, res) => {
  const { url, altText, isPrimary } = req.body
  
  if (isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId: req.params.id, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const image = await prisma.productImage.create({
    data: {
      productId: req.params.id,
      url,
      altText,
      isPrimary: isPrimary || false,
      sortOrder: await prisma.productImage.count({ where: { productId: req.params.id } }),
    },
  })
  res.status(201).json(image)
}))

router.delete('/products/:id/images/:imageId', asyncHandler(async (req, res) => {
  await prisma.productImage.delete({ where: { id: req.params.imageId } })
  res.json({ message: 'Image deleted' })
}))

// Product variants
router.post('/products/:id/variants', validate(createVariantSchema), asyncHandler(async (req, res) => {
  const variant = await prisma.productVariant.create({
    data: {
      productId: req.params.id,
      ...req.body,
      purchasePrice: new Prisma.Decimal(req.body.purchasePrice),
      salePrice: new Prisma.Decimal(req.body.salePrice),
    },
  })

  await checkAndCreateStockAlerts(variant.id)
  res.status(201).json(variant)
}))

router.put('/products/variants/:variantId', validate(updateVariantSchema), asyncHandler(async (req, res) => {
  const { quantity, minStockLevel, purchasePrice, salePrice, ...data } = req.body

  const updateData: any = { ...data }
  if (quantity !== undefined) updateData.quantity = quantity
  if (minStockLevel !== undefined) updateData.minStockLevel = minStockLevel
  if (purchasePrice !== undefined) updateData.purchasePrice = new Prisma.Decimal(purchasePrice)
  if (salePrice !== undefined) updateData.salePrice = new Prisma.Decimal(salePrice)

  const variant = await prisma.productVariant.update({
    where: { id: req.params.variantId },
    data: updateData,
  })

  await checkAndCreateStockAlerts(variant.id)
  res.json(variant)
}))

router.delete('/products/variants/:variantId', asyncHandler(async (req, res) => {
  await prisma.productVariant.delete({ where: { id: req.params.variantId } })
  res.json({ message: 'Variant deleted' })
}))

router.post('/products/:id/restock', validate(restockSchema), asyncHandler(async (req, res) => {
  const { variantId, quantity } = req.body

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { quantity: { increment: quantity } },
  })

  await checkAndCreateStockAlerts(variantId)
  res.json(variant)
}))

// Categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  res.json(categories)
}))

router.post('/categories', validate(createCategorySchema), asyncHandler(async (req, res) => {
  const category = await prisma.category.create({ data: req.body })
  res.status(201).json(category)
}))

router.put('/categories/:id', validate(updateCategorySchema), asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(category)
}))

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } })
  res.json({ message: 'Category deleted' })
}))

// Brands
router.get('/brands', asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  res.json(brands)
}))

router.post('/brands', validate(createBrandSchema), asyncHandler(async (req, res) => {
  const brand = await prisma.brand.create({ data: req.body })
  res.status(201).json(brand)
}))

router.put('/brands/:id', validate(updateBrandSchema), asyncHandler(async (req, res) => {
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(brand)
}))

router.delete('/brands/:id', asyncHandler(async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } })
  res.json({ message: 'Brand deleted' })
}))

// Sales
router.get('/sales', validate(paginationSchema), asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder, status, startDate, endDate } = req.query

  const where: Prisma.SaleWhereInput = {}
  if (status) where.status = status as 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED'
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate as string)
    if (endDate) where.createdAt.lte = new Date(endDate as string)
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [(sortBy as string) || 'createdAt']: sortOrder || 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
        user: { select: { name: true } },
      },
    }),
    prisma.sale.count({ where }),
  ])

  res.json({
    data: sales,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
}))

router.get('/sales/:id', asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true, slug: true } } },
          },
        },
      },
      user: { select: { name: true, email: true } },
    },
  })
  if (!sale) throw new AppError(404, 'Sale not found')
  res.json(sale)
}))

router.post('/sales', validate(createSaleSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { items, ...saleData } = req.body

  // Calculate totals and validate stock
  let subtotal = 0
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } })
    if (!variant) throw new AppError(404, `Variant ${item.variantId} not found`)
    if (variant.quantity < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${variant.productId}`)
    }
    subtotal += Number(variant.salePrice) * item.quantity
  }

  const tax = 0 // Could be configured
  const discount = 0
  const total = subtotal + tax - discount

  const saleNumber = `SALE-${Date.now()}`

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        saleNumber,
        userId: req.user!.id,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),
        ...saleData,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(0), // Will be set below
            totalPrice: new Prisma.Decimal(0),
          })),
        },
      },
      include: { items: true },
    })

    // Update variant quantities and set prices
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
      const unitPrice = Number(variant!.salePrice)
      const totalPrice = unitPrice * item.quantity

      await tx.saleItem.update({
        where: { id: newSale.items[i].id },
        data: { unitPrice: new Prisma.Decimal(unitPrice), totalPrice: new Prisma.Decimal(totalPrice) },
      })

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      })

      await checkAndCreateStockAlerts(item.variantId)
    }

    return newSale
  })

  res.status(201).json(sale)
}))

// Reports
router.get('/reports/daily', asyncHandler(async (req, res) => {
  const { date } = req.query
  const targetDate = date ? new Date(date as string) : new Date()
  const start = new Date(targetDate.setHours(0, 0, 0, 0))
  const end = new Date(targetDate.setHours(23, 59, 59, 999))

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
    include: { items: { include: { variant: { include: { product: true } } } } },
  })

  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const profit = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const profit = (Number(item.unitPrice) - Number(item.variant.purchasePrice)) * item.quantity
      return itemSum + profit
    }, 0)
  }, 0)

  res.json({ date: start, revenue, profit, salesCount: sales.length, sales })
}))

router.get('/reports/weekly', asyncHandler(async (req, res) => {
  const { weekStart } = req.query
  const start = weekStart ? new Date(weekStart as string) : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
    include: { items: { include: { variant: { include: { product: true } } } } },
  })

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(day.getDate() + i)
    const daySales = sales.filter(s => 
      s.createdAt >= new Date(day.setHours(0,0,0,0)) && 
      s.createdAt <= new Date(day.setHours(23,59,59,999))
    )
    return {
      date: day.toISOString().split('T')[0],
      revenue: daySales.reduce((sum, s) => sum + Number(s.total), 0),
      count: daySales.length,
    }
  })

  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const profit = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const profit = (Number(item.unitPrice) - Number(item.variant.purchasePrice)) * item.quantity
      return itemSum + profit
    }, 0)
  }, 0)

  res.json({ weekStart: start, weekEnd: end, revenue, profit, salesCount: sales.length, daily: dailyData })
}))

router.get('/reports/monthly', asyncHandler(async (req, res) => {
  const { month } = req.query
  const start = month ? new Date(month as string) : new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setHours(23, 59, 59, 999)

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
    include: { items: { include: { variant: { include: { product: true } } } } },
  })

  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const profit = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const profit = (Number(item.unitPrice) - Number(item.variant.purchasePrice)) * item.quantity
      return itemSum + profit
    }, 0)
  }, 0)

  res.json({ month: start, revenue, profit, salesCount: sales.length })
}))

router.get('/reports/top-products', asyncHandler(async (req, res) => {
  const { limit = 10, startDate, endDate } = req.query

  const where: Prisma.SaleItemWhereInput = {}
  const saleFilter: any = { status: 'COMPLETED' }
  if (startDate || endDate) {
    saleFilter.createdAt = {}
    if (startDate) saleFilter.createdAt.gte = new Date(startDate as string)
    if (endDate) saleFilter.createdAt.lte = new Date(endDate as string)
  }
  where.sale = saleFilter

  const topProducts = await prisma.saleItem.groupBy({
    by: ['variantId'],
    where,
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: Number(limit),
  })

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: topProducts.map(p => p.variantId) } },
    include: { product: { include: { category: true, brand: true } } },
  })

  const result = topProducts.map(tp => {
    const variant = variants.find(v => v.id === tp.variantId)
    return {
      variant,
      quantitySold: tp._sum.quantity,
      revenue: Number(tp._sum.totalPrice),
    }
  })

  res.json(result)
}))

router.get('/reports/revenue', asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query

  const where: Prisma.SaleWhereInput = { status: 'COMPLETED' }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate as string)
    if (endDate) where.createdAt.lte = new Date(endDate as string)
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { items: { include: { variant: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const grouped: Record<string, { revenue: number; profit: number; count: number }> = {}

  for (const sale of sales) {
    let key: string
    const date = new Date(sale.createdAt)
    if (groupBy === 'day') key = date.toISOString().split('T')[0]
    else if (groupBy === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, count: 0 }
    grouped[key].revenue += Number(sale.total)
    grouped[key].count += 1
    for (const item of sale.items) {
      grouped[key].profit += (Number(item.unitPrice) - Number(item.variant.purchasePrice)) * item.quantity
    }
  }

  res.json(Object.entries(grouped).map(([period, data]) => ({ period, ...data })))
}))

// Users (owner only)
router.get('/users', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, permissions: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
}))

router.post('/users', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { email, password, name, role = 'STAFF', permissions } = req.body
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role, permissions: permissions || {} },
    select: { id: true, email: true, name: true, role: true, permissions: true, isActive: true, createdAt: true },
  })
  res.status(201).json(user)
}))

router.put('/users/:id', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const { name, role, permissions, isActive } = req.body
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, role, permissions, isActive },
    select: { id: true, email: true, name: true, role: true, permissions: true, isActive: true },
  })
  res.json(user)
}))

router.delete('/users/:id', requireRole('OWNER'), asyncHandler(async (req: AuthRequest, res) => {
  if (req.params.id === req.user!.id) throw new AppError(400, 'Cannot delete yourself')
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ message: 'User deleted' })
}))

// Activity logs
router.get('/activity-logs', validate(paginationSchema), asyncHandler(async (req, res) => {
  const { page, limit, userId, entityType, startDate, endDate } = req.query

  const where: Prisma.ActivityLogWhereInput = {}
  if (userId) where.userId = userId as string
  if (entityType) where.entityType = entityType as string
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate as string)
    if (endDate) where.createdAt.lte = new Date(endDate as string)
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ])

  res.json({ data: logs, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
}))

// Settings
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await prisma.settings.findMany()
  res.json(Object.fromEntries(settings.map(s => [s.key, s.value])))
}))

router.put('/settings', validate(updateSettingsSchema), asyncHandler(async (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }
  res.json({ message: 'Settings updated' })
}))

// Backups
router.get('/backups', asyncHandler(async (req, res) => {
  const [backups, stats] = await Promise.all([listBackups(), getBackupStats()])
  res.json({ backups, stats })
}))

router.post('/backup', asyncHandler(async (req, res) => {
  const backup = await createBackup()
  res.status(201).json(backup)
}))

router.delete('/backups/:id', asyncHandler(async (req, res) => {
  await deleteBackup(req.params.id)
  res.json({ message: 'Backup deleted' })
}))

// Email test
router.post('/test-email', asyncHandler(async (req, res) => {
  const result = await testEmailConnection()
  res.json(result)
}))

export default router