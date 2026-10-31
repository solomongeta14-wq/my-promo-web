import nodemailer from 'nodemailer'
import { config } from '../config'
import { prisma } from '../config/prisma'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter && config.email.host && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    })
  }
  return transporter
}

export async function sendEmail(to: string | string[], subject: string, html: string, text?: string) {
  const transport = getTransporter()
  if (!transport) {
    console.warn('Email not configured, skipping send')
    return { success: false, reason: 'Email not configured' }
  }

  const recipients = Array.isArray(to) ? to.join(', ') : to

  try {
    const info = await transport.sendMail({
      from: config.email.from,
      to: recipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, reason: (error as Error).message }
  }
}

export async function sendStockAlertEmail(
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK',
  productName: string,
  variant: { size: string; color: string; sku: string },
  quantity: number,
  minStockLevel: number
) {
  const settings = await prisma.settings.findMany({
    where: { key: { in: ['alertEmails', 'shopName'] } },
  })

  const alertEmails = settings.find(s => s.key === 'alertEmails')?.value
  const shopName = settings.find(s => s.key === 'shopName')?.value || 'Boutique Shop'

  if (!alertEmails) {
    console.log('No alert emails configured')
    return
  }

  const emails = JSON.parse(alertEmails) as string[]
  const isLowStock = alertType === 'LOW_STOCK'

  const subject = `${isLowStock ? '⚠️ Low Stock Alert' : '🚨 Out of Stock Alert'} - ${shopName}`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isLowStock ? '#f59e0b' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${isLowStock ? '⚠️ Low Stock Alert' : '🚨 Out of Stock Alert'}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${isLowStock 
            ? `The following product variant has reached its minimum stock level (${minStockLevel}).` 
            : `The following product variant is now out of stock.`}</p>
          
          <div class="details">
            <div class="detail-row"><span class="label">Product:</span><span class="value">${productName}</span></div>
            <div class="detail-row"><span class="label">Size:</span><span class="value">${variant.size}</span></div>
            <div class="detail-row"><span class="label">Color:</span><span class="value">${variant.color}</span></div>
            <div class="detail-row"><span class="label">SKU:</span><span class="value">${variant.sku}</span></div>
            <div class="detail-row"><span class="label">Current Quantity:</span><span class="value">${quantity}</span></div>
            <div class="detail-row"><span class="label">Min Stock Level:</span><span class="value">${minStockLevel}</span></div>
          </div>

          <p>Please restock this item as soon as possible.</p>
          <p>Best regards,<br>${shopName} Management System</p>
        </div>
        <div class="footer">
          This is an automated message from your boutique management system.
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(emails, subject, html)
}

export async function testEmailConnection() {
  const transport = getTransporter()
  if (!transport) return { success: false, reason: 'Email not configured' }
  
  try {
    await transport.verify()
    return { success: true }
  } catch (error) {
    return { success: false, reason: (error as Error).message }
  }
}