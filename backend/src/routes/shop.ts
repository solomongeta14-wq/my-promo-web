import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validate } from '../middleware/validate'
import { productFilterSchema, contactSchema, inquirySchema } from '../validators'

const router = Router()

// Public product listing
router.get('/products', validate(productFilterSchema), asyncHandler(async (req, res) => {
  const { page, limit, search, categoryId, brandId, isNewArrival, minPrice, maxPrice, sortBy, sortOrder } = req.query

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ]
  }
  if (categoryId) where.categoryId = categoryId as string
  if (brandId) where.brandId = brandId as string
  if (isNewArrival === 'true') where.isNewArrival = true

  // Price filtering requires joining variants
  const priceFilter = minPrice || maxPrice
    ? {
        some: {
          isActive: true,
          salePrice: {
            ...(minPrice ? { gte: new Prisma.Decimal(minPrice as string) } : {}),
            ...(maxPrice ? { lte: new Prisma.Decimal(maxPrice as string) } : {}),
          },
        },
      }
    : undefined

  if (priceFilter) where.variants = priceFilter

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: {
          where: { isActive: true },
          select: { id: true, size: true, color: true, salePrice: true, quantity: true, minStockLevel: true },
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Transform for customer view
  const productsWithAvailability = products.map(p => {
    const variants = p.variants.map(v => ({
      ...v,
      salePrice: Number(v.salePrice),
      isOutOfStock: v.quantity === 0,
      isLowStock: v.quantity > 0 && v.quantity <= v.minStockLevel,
      availability: v.quantity === 0 ? 'OUT_OF_STOCK' : v.quantity <= v.minStockLevel ? 'LOW_STOCK' : 'IN_STOCK',
    }))

    const inStockVariants = variants.filter(v => v.quantity > 0)
    const minPriceVal = inStockVariants.length > 0 ? Math.min(...inStockVariants.map(v => v.salePrice)) : 0
    const maxPriceVal = inStockVariants.length > 0 ? Math.max(...inStockVariants.map(v => v.salePrice)) : 0

    return {
      ...p,
      images: p.images,
      variants,
      priceRange: { min: minPriceVal, max: maxPriceVal },
      hasStock: inStockVariants.length > 0,
    }
  })

  res.json({
    data: productsWithAvailability,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  })
}))

// Product detail
router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        where: { isActive: true },
        select: { id: true, size: true, color: true, sku: true, salePrice: true, quantity: true, minStockLevel: true },
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      },
    },
  })

  if (!product) throw new AppError(404, 'Product not found')

  const variants = product.variants.map(v => ({
    ...v,
    salePrice: Number(v.salePrice),
    isOutOfStock: v.quantity === 0,
    isLowStock: v.quantity > 0 && v.quantity <= v.minStockLevel,
    availability: v.quantity === 0 ? 'OUT_OF_STOCK' : v.quantity <= v.minStockLevel ? 'LOW_STOCK' : 'IN_STOCK',
  }))

  const inStockVariants = variants.filter(v => v.quantity > 0)
  const minPrice = inStockVariants.length > 0 ? Math.min(...inStockVariants.map(v => v.salePrice)) : 0
  const maxPrice = inStockVariants.length > 0 ? Math.max(...inStockVariants.map(v => v.salePrice)) : 0

  res.json({
    ...product,
    variants,
    priceRange: { min: minPrice, max: maxPrice },
    hasStock: inStockVariants.length > 0,
  })
}))

// Categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  })
  res.json(categories)
}))

// Brands
router.get('/brands', asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  })
  res.json(brands)
}))

// New arrivals
router.get('/new-arrivals', asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query
  const products = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: {
        where: { isActive: true },
        select: { salePrice: true, quantity: true },
      },
    },
  })

  const transformed = products.map(p => {
    const inStockVariants = p.variants.filter(v => v.quantity > 0)
    const minPrice = inStockVariants.length > 0 ? Math.min(...inStockVariants.map(v => Number(v.salePrice))) : 0
    const maxPrice = inStockVariants.length > 0 ? Math.max(...inStockVariants.map(v => Number(v.salePrice))) : 0
    return {
      ...p,
      priceRange: { min: minPrice, max: maxPrice },
      hasStock: inStockVariants.length > 0,
    }
  })

  res.json(transformed)
}))

// Contact form
router.post('/contact', validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body

  // In a real app, you'd send an email or save to database
  console.log('Contact form submission:', { name, email, phone, subject, message })

  res.json({ message: 'Message sent successfully' })
}))

// Product inquiry
router.post('/inquiry/:productId', validate(inquirySchema), asyncHandler(async (req, res) => {
  const { productId } = req.params
  const { name, email, phone, variantId, quantity, message } = req.body

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { variants: true },
  })

  if (!product) throw new AppError(404, 'Product not found')

  let variantInfo = ''
  if (variantId) {
    const variant = product.variants.find(v => v.id === variantId)
    if (variant) {
      variantInfo = `\nVariant: ${variant.size} / ${variant.color} (SKU: ${variant.sku})`
    }
  }

  // In a real app, send email to shop owner
  console.log('Product inquiry:', { product: product.name, name, email, phone, variantInfo, quantity, message })

  res.json({ message: 'Inquiry sent successfully' })
}))

export default router