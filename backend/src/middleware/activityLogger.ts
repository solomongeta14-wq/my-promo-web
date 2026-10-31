import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from './auth'

export const activityLogger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime
      const userId = req.user?.id
      const method = req.method
      const path = req.path
      const statusCode = res.statusCode
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'

      // Only log write operations and errors
      const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || statusCode >= 400

      if (shouldLog && userId) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: `${method} ${path}`,
            entityType: extractEntityType(path),
            entityId: extractEntityId(path, req.params),
            details: {
              method,
              path,
              statusCode,
              duration,
              query: req.query,
              body: sanitizeBody(req.body),
            } as any,
            ipAddress,
            userAgent,
          },
        })
      }
    } catch (error) {
      console.error('Activity log error:', error)
    }
  })

  next()
}

function extractEntityType(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'admin' && parts[1]) {
    return parts[1].replace(/s$/, '') // products -> product
  }
  return 'unknown'
}

function extractEntityId(path: string, params: Record<string, string>): string | null {
  const idParam = Object.keys(params).find(k => k.endsWith('Id') || k === 'id')
  return idParam ? params[idParam] : null
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  const sanitized = { ...body } as Record<string, unknown>
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key']
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }
  return sanitized
}