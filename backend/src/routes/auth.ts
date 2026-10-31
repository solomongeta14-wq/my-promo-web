import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { config } from '../config'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { loginSchema, registerSchema, changePasswordSchema } from '../validators'

const router = Router()

// Login
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid credentials')
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new AppError(401, 'Invalid credentials')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  // Generate token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  )

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
  })
}))

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out successfully' })
})

// Register (owner only - for initial setup)
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, name, role = 'STAFF' } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new AppError(409, 'Email already registered')
  }

  // Check if this is the first user (make them owner)
  const userCount = await prisma.user.count()
  const userRole = userCount === 0 ? 'OWNER' : role

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: userRole as 'OWNER' | 'STAFF',
      permissions: userRole === 'OWNER' ? { all: true } : { products: true, sales: true },
    },
  })

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  )

  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  })

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
  })
}))

// Get current user
router.get('/me', asyncHandler(async (req: AuthRequest, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    throw new AppError(401, 'Not authenticated')
  }

  const decoded = jwt.verify(token, config.jwt.secret) as { id: string }
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true, permissions: true, isActive: true },
  })

  if (!user || !user.isActive) {
    throw new AppError(401, 'User not found')
  }

  res.json({ user })
}))

// Change password
router.put('/change-password', validate(changePasswordSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user!.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) throw new AppError(401, 'Current password is incorrect')

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  res.json({ message: 'Password changed successfully' })
}))

export default router