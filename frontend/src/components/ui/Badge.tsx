import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-neutral-100 text-neutral-800',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  }

  return (
    <span className={clsx('inline-flex items-center rounded-full font-medium', variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  )
}

interface StockBadgeProps {
  quantity: number
  minStockLevel: number
  showQuantity?: boolean
}

export function StockBadge({ quantity, minStockLevel, showQuantity = true }: StockBadgeProps) {
  if (quantity === 0) {
    return <Badge variant="danger">Out of Stock</Badge>
  }
  if (quantity <= minStockLevel) {
    return <Badge variant="warning">Low Stock {showQuantity && `(${quantity})`}</Badge>
  }
  return <Badge variant="success">In Stock {showQuantity && `(${quantity})`}</Badge>
}

interface PriceDisplayProps {
  price: number
  currency?: string
  showCurrency?: boolean
  className?: string
}

export function PriceDisplay({ price, currency = 'USD', showCurrency = true, className }: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: showCurrency ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: 2,
  }).format(price)

  return <span className={clsx('font-medium', className)}>{formatted}</span>
}

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div
      className={clsx(
        'rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium',
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

import React from 'react'