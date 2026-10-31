export interface User {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'STAFF'
  permissions: Record<string, boolean>
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  _count?: { products: number }
}

export interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  _count?: { products: number }
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
  createdAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  size: string
  color: string
  sku: string
  purchasePrice: number
  salePrice: number
  quantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  isOutOfStock?: boolean
  isLowStock?: boolean
  availability?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  categoryId: string
  brandId: string
  creatorId: string
  isNewArrival: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: Category
  brand?: Brand
  images?: ProductImage[]
  variants?: ProductVariant[]
  totalStock?: number
  minPrice?: number
  maxPrice?: number
  priceRange?: { min: number; max: number }
  hasStock?: boolean
}

export interface Sale {
  id: string
  saleNumber: string
  userId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string | null
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  notes: string | null
  createdAt: string
  updatedAt: string
  items?: SaleItem[]
  user?: { name: string; email: string }
}

export interface SaleItem {
  id: string
  saleId: string
  variantId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variant?: ProductVariant & { product: { name: string; slug: string } }
}

export interface StockAlert {
  id: string
  variantId: string
  type: 'LOW_STOCK' | 'OUT_OF_STOCK'
  message: string
  isRead: boolean
  createdAt: string
  variant?: ProductVariant & { product: { name: string; slug: string } }
}

export interface DashboardStats {
  totalProducts: number
  totalVariants: number
  totalStockValue: number
  todaysSales: { count: number; revenue: number }
  lowStockCount: number
  outOfStockCount: number
  unreadAlerts: number
  recentSales: Sale[]
}

export interface ActivityLog {
  id: string
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: { name: string; email: string }
}

export interface Settings {
  shopName: string
  shopEmail: string
  shopPhone: string
  shopAddress: string
  currency: string
  taxRate: number
  lowStockThreshold: number
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  alertEmails: string[]
}

export interface Backup {
  id: string
  filename: string
  size: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReportDaily {
  date: string
  revenue: number
  profit: number
  salesCount: number
  sales: Sale[]
}

export interface ReportWeekly {
  weekStart: string
  weekEnd: string
  revenue: number
  profit: number
  salesCount: number
  daily: { date: string; revenue: number; count: number }[]
}

export interface ReportMonthly {
  month: string
  revenue: number
  profit: number
  salesCount: number
}

export interface TopProduct {
  variant: ProductVariant & { product: Product }
  quantitySold: number
  revenue: number
}

export interface RevenueData {
  period: string
  revenue: number
  profit: number
  count: number
}