import { z } from 'zod'

// Auth validators
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
})

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['OWNER', 'STAFF']).optional(),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
})

// Product validators
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().optional(),
    categoryId: z.string().cuid('Invalid category ID'),
    brandId: z.string().cuid('Invalid brand ID'),
    isNewArrival: z.boolean().optional(),
    isActive: z.boolean().optional(),
    variants: z.array(z.object({
      size: z.string().min(1, 'Size is required'),
      color: z.string().min(1, 'Color is required'),
      sku: z.string().min(3, 'SKU must be at least 3 characters'),
      purchasePrice: z.number().positive('Purchase price must be positive'),
      salePrice: z.number().positive('Sale price must be positive'),
      quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
      minStockLevel: z.number().int().min(0).default(5),
      isActive: z.boolean().optional(),
    })).optional(),
  }),
})

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    categoryId: z.string().cuid().optional(),
    brandId: z.string().cuid().optional(),
    isNewArrival: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
})

export const createVariantSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid product ID'),
  }),
  body: z.object({
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required'),
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    salePrice: z.number().positive('Sale price must be positive'),
    quantity: z.number().int().min(0).default(0),
    minStockLevel: z.number().int().min(0).default(5),
    isActive: z.boolean().optional(),
  }),
})

export const updateVariantSchema = z.object({
  params: z.object({
    variantId: z.string().cuid('Invalid variant ID'),
  }),
  body: z.object({
    size: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    sku: z.string().min(3).optional(),
    purchasePrice: z.number().positive().optional(),
    salePrice: z.number().positive().optional(),
    quantity: z.number().int().min(0).optional(),
    minStockLevel: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
})

export const restockSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid product ID'),
  }),
  body: z.object({
    variantId: z.string().cuid('Invalid variant ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
  }),
})

// Category validators
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
})

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
})

// Brand validators
export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    logoUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
})

export const updateBrandSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
})

// Sale validators
export const createSaleSchema = z.object({
  body: z.object({
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerPhone: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
      variantId: z.string().cuid('Invalid variant ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })).min(1, 'At least one item required'),
  }),
})

// Shop validators
export const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
  }),
})

export const inquirySchema = z.object({
  params: z.object({
    productId: z.string().cuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    variantId: z.string().cuid().optional(),
    quantity: z.number().int().positive().optional(),
    message: z.string().optional(),
  }),
})

// Settings validators
export const updateSettingsSchema = z.object({
  body: z.object({
    shopName: z.string().optional(),
    shopEmail: z.string().email().optional(),
    shopPhone: z.string().optional(),
    shopAddress: z.string().optional(),
    currency: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    smtpFrom: z.string().email().optional(),
    alertEmails: z.array(z.string().email()).optional(),
  }),
})

// Pagination validator
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
})

// Product filter validator
export const productFilterSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    categoryId: z.string().cuid().optional(),
    brandId: z.string().cuid().optional(),
    isNewArrival: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sortBy: z.enum(['name', 'createdAt', 'salePrice', 'quantity']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
})