import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { prisma } from '../config/prisma'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
    permissions: Record<string, boolean>
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new AppError(401, 'Authentication required')
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string
      email: string
      name: string
      role: string
      permissions: Record<string, boolean>
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive')
    }

    req.user = { ...user, permissions: (user.permissions ?? {}) as Record<string, boolean> }
    next()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Invalid or expired token')
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions')
    }
    next()
  }
}

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions[permission]) {
      throw new AppError(403, `Permission required: ${permission}`)
    }
    next()
  }
}