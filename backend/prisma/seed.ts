import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create owner user
  const passwordHash = await bcrypt.hash('admin123', 12)
  
  const owner = await prisma.user.upsert({
    where: { email: 'owner@boutique.com' },
    update: {},
    create: {
      email: 'owner@boutique.com',
      passwordHash,
      name: 'Shop Owner',
      role: 'OWNER',
      permissions: { all: true },
    },
  })

  console.log('✅ Created owner:', owner.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mens-clothing' },
      update: {},
      create: { name: "Men's Clothing", slug: 'mens-clothing', description: 'Fashion for men', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'womens-clothing' },
      update: {},
      create: { name: "Women's Clothing", slug: 'womens-clothing', description: 'Fashion for women', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'shoes' },
      update: {},
      create: { name: 'Shoes', slug: 'shoes', description: 'Original branded shoes', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'trousers' },
      update: {},
      create: { name: 'Trousers', slug: 'trousers', description: 'Branded trousers', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'tshirts' },
      update: {},
      create: { name: 'T-Shirts', slug: 'tshirts', description: 'Casual and branded t-shirts', sortOrder: 5 },
    }),
    prisma.category.upsert({
      where: { slug: 'jackets' },
      update: {},
      create: { name: 'Jackets', slug: 'jackets', description: 'Stylish jackets', sortOrder: 6 },
    }),
    prisma.category.upsert({
      where: { slug: 'cosmetics' },
      update: {},
      create: { name: "Women's Cosmetics", slug: 'cosmetics', description: 'Beauty and cosmetic products', sortOrder: 7 },
    }),
  ])

  console.log('✅ Created categories')

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'nike' },
      update: {},
      create: { name: 'Nike', slug: 'nike', description: 'Just Do It' },
    }),
    prisma.brand.upsert({
      where: { slug: 'adidas' },
      update: {},
      create: { name: 'Adidas', slug: 'adidas', description: 'Impossible is Nothing' },
    }),
    prisma.brand.upsert({
      where: { slug: 'zara' },
      update: {},
      create: { name: 'Zara', slug: 'zara', description: 'Fast fashion' },
    }),
    prisma.brand.upsert({
      where: { slug: 'hm' },
      update: {},
      create: { name: 'H&M', slug: 'hm', description: 'Fashion and quality at the best price' },
    }),
    prisma.brand.upsert({
      where: { slug: 'levis' },
      update: {},
      create: { name: "Levi's", slug: 'levis', description: 'Original jeans since 1853' },
    }),
    prisma.brand.upsert({
      where: { slug: 'mac' },
      update: {},
      create: { name: 'MAC Cosmetics', slug: 'mac', description: 'Professional makeup' },
    }),
    prisma.brand.upsert({
      where: { slug: 'loreal' },
      update: {},
      create: { name: "L'Oréal Paris", slug: 'loreal', description: "Because you're worth it" },
    }),
  ])

  console.log('✅ Created brands')

  // Create sample products
  const mensCategory = categories.find(c => c.slug === 'mens-clothing')!
  const womensCategory = categories.find(c => c.slug === 'womens-clothing')!
  const shoesCategory = categories.find(c => c.slug === 'shoes')!
  const trousersCategory = categories.find(c => c.slug === 'trousers')!
  const tshirtsCategory = categories.find(c => c.slug === 'tshirts')!
  const jacketsCategory = categories.find(c => c.slug === 'jackets')!
  const cosmeticsCategory = categories.find(c => c.slug === 'cosmetics')!

  const nike = brands.find(b => b.slug === 'nike')!
  const adidas = brands.find(b => b.slug === 'adidas')!
  const zara = brands.find(b => b.slug === 'zara')!
  const levis = brands.find(b => b.slug === 'levis')!
  const mac = brands.find(b => b.slug === 'mac')!
  const loreal = brands.find(b => b.slug === 'loreal')!

  // Men's Nike T-Shirt
  await prisma.product.upsert({
    where: { slug: 'nike-mens-dri-fit-tshirt' },
    update: {},
    create: {
      name: "Nike Men's Dri-FIT T-Shirt",
      slug: 'nike-mens-dri-fit-tshirt',
      description: 'Stay dry and comfortable during your workout with this moisture-wicking Dri-FIT t-shirt.',
      categoryId: mensCategory.id,
      brandId: nike.id,
      creatorId: owner.id,
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          { size: 'S', color: 'Black', sku: 'NK-M-TS-BLK-S', purchasePrice: 15.00, salePrice: 29.99, quantity: 25, minStockLevel: 5 },
          { size: 'M', color: 'Black', sku: 'NK-M-TS-BLK-M', purchasePrice: 15.00, salePrice: 29.99, quantity: 30, minStockLevel: 5 },
          { size: 'L', color: 'Black', sku: 'NK-M-TS-BLK-L', purchasePrice: 15.00, salePrice: 29.99, quantity: 20, minStockLevel: 5 },
          { size: 'XL', color: 'Black', sku: 'NK-M-TS-BLK-XL', purchasePrice: 15.00, salePrice: 29.99, quantity: 15, minStockLevel: 5 },
          { size: 'S', color: 'White', sku: 'NK-M-TS-WHT-S', purchasePrice: 15.00, salePrice: 29.99, quantity: 20, minStockLevel: 5 },
          { size: 'M', color: 'White', sku: 'NK-M-TS-WHT-M', purchasePrice: 15.00, salePrice: 29.99, quantity: 25, minStockLevel: 5 },
          { size: 'L', color: 'White', sku: 'NK-M-TS-WHT-L', purchasePrice: 15.00, salePrice: 29.99, quantity: 18, minStockLevel: 5 },
          { size: 'XL', color: 'White', sku: 'NK-M-TS-WHT-XL', purchasePrice: 15.00, salePrice: 29.99, quantity: 10, minStockLevel: 5 },
        ],
      },
    },
  })

  // Women's Zara Jacket
  await prisma.product.upsert({
    where: { slug: 'zara-womens-trench-coat' },
    update: {},
    create: {
      name: "Zara Women's Trench Coat",
      slug: 'zara-womens-trench-coat',
      description: 'Classic trench coat with belt detail. Perfect for transitional weather.',
      categoryId: womensCategory.id,
      brandId: zara.id,
      creatorId: owner.id,
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          { size: 'XS', color: 'Beige', sku: 'ZR-W-TC-BEG-XS', purchasePrice: 45.00, salePrice: 89.99, quantity: 8, minStockLevel: 3 },
          { size: 'S', color: 'Beige', sku: 'ZR-W-TC-BEG-S', purchasePrice: 45.00, salePrice: 89.99, quantity: 12, minStockLevel: 3 },
          { size: 'M', color: 'Beige', sku: 'ZR-W-TC-BEG-M', purchasePrice: 45.00, salePrice: 89.99, quantity: 10, minStockLevel: 3 },
          { size: 'L', color: 'Beige', sku: 'ZR-W-TC-BEG-L', purchasePrice: 45.00, salePrice: 89.99, quantity: 5, minStockLevel: 3 },
          { size: 'XS', color: 'Black', sku: 'ZR-W-TC-BLK-XS', purchasePrice: 45.00, salePrice: 89.99, quantity: 6, minStockLevel: 3 },
          { size: 'S', color: 'Black', sku: 'ZR-W-TC-BLK-S', purchasePrice: 45.00, salePrice: 89.99, quantity: 0, minStockLevel: 3 }, // Out of stock
          { size: 'M', color: 'Black', sku: 'ZR-W-TC-BLK-M', purchasePrice: 45.00, salePrice: 89.99, quantity: 8, minStockLevel: 3 },
        ],
      },
    },
  })

  // Nike Air Max Shoes
  await prisma.product.upsert({
    where: { slug: 'nike-air-max-270' },
    update: {},
    create: {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'The Nike Air Max 270 delivers visible cushioning under every step with a large Max Air heel unit.',
      categoryId: shoesCategory.id,
      brandId: nike.id,
      creatorId: owner.id,
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          { size: '39', color: 'Black/White', sku: 'NK-AM270-BLK-39', purchasePrice: 80.00, salePrice: 149.99, quantity: 10, minStockLevel: 3 },
          { size: '40', color: 'Black/White', sku: 'NK-AM270-BLK-40', purchasePrice: 80.00, salePrice: 149.99, quantity: 15, minStockLevel: 3 },
          { size: '41', color: 'Black/White', sku: 'NK-AM270-BLK-41', purchasePrice: 80.00, salePrice: 149.99, quantity: 12, minStockLevel: 3 },
          { size: '42', color: 'Black/White', sku: 'NK-AM270-BLK-42', purchasePrice: 80.00, salePrice: 149.99, quantity: 0, minStockLevel: 3 }, // Out of stock
          { size: '43', color: 'Black/White', sku: 'NK-AM270-BLK-43', purchasePrice: 80.00, salePrice: 149.99, quantity: 8, minStockLevel: 3 },
          { size: '39', color: 'Red/Black', sku: 'NK-AM270-RED-39', purchasePrice: 80.00, salePrice: 149.99, quantity: 5, minStockLevel: 3 },
          { size: '40', color: 'Red/Black', sku: 'NK-AM270-RED-40', purchasePrice: 80.00, salePrice: 149.99, quantity: 7, minStockLevel: 3 },
          { size: '41', color: 'Red/Black', sku: 'NK-AM270-RED-41', purchasePrice: 80.00, salePrice: 149.99, quantity: 4, minStockLevel: 3 }, // Low stock
        ],
      },
    },
  })

  // Levi's 501 Jeans
  await prisma.product.upsert({
    where: { slug: 'levis-501-original-fit' },
    update: {},
    create: {
      name: "Levi's 501 Original Fit Jeans",
      slug: 'levis-501-original-fit',
      description: 'The original blue jean since 1873. A straight fit with a signature button fly.',
      categoryId: trousersCategory.id,
      brandId: levis.id,
      creatorId: owner.id,
      isNewArrival: false,
      isActive: true,
      variants: {
        create: [
          { size: '30/32', color: 'Blue', sku: 'LV-501-BLU-30-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 20, minStockLevel: 5 },
          { size: '32/32', color: 'Blue', sku: 'LV-501-BLU-32-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 25, minStockLevel: 5 },
          { size: '34/32', color: 'Blue', sku: 'LV-501-BLU-34-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 18, minStockLevel: 5 },
          { size: '36/32', color: 'Blue', sku: 'LV-501-BLU-36-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 12, minStockLevel: 5 },
          { size: '30/32', color: 'Black', sku: 'LV-501-BLK-30-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 15, minStockLevel: 5 },
          { size: '32/32', color: 'Black', sku: 'LV-501-BLK-32-32', purchasePrice: 35.00, salePrice: 69.99, quantity: 3, minStockLevel: 5 }, // Low stock
        ],
      },
    },
  })

  // MAC Lipstick
  await prisma.product.upsert({
    where: { slug: 'mac-retro-matte-lipstick' },
    update: {},
    create: {
      name: 'MAC Retro Matte Lipstick',
      slug: 'mac-retro-matte-lipstick',
      description: 'High-pigment, matte finish lipstick with 8-hour wear. Iconic shades.',
      categoryId: cosmeticsCategory.id,
      brandId: mac.id,
      creatorId: owner.id,
      isNewArrival: true,
      isActive: true,
      variants: {
        create: [
          { size: 'Standard', color: 'Ruby Woo', sku: 'MAC-RML-RW', purchasePrice: 12.00, salePrice: 22.00, quantity: 30, minStockLevel: 10 },
          { size: 'Standard', color: 'Velvet Teddy', sku: 'MAC-RML-VT', purchasePrice: 12.00, salePrice: 22.00, quantity: 25, minStockLevel: 10 },
          { size: 'Standard', color: 'Chili', sku: 'MAC-RML-CHI', purchasePrice: 12.00, salePrice: 22.00, quantity: 20, minStockLevel: 10 },
          { size: 'Standard', color: 'Dangerous', sku: 'MAC-RML-DNG', purchasePrice: 12.00, salePrice: 22.00, quantity: 0, minStockLevel: 10 }, // Out of stock
        ],
      },
    },
  })

  // L'Oréal Foundation
  await prisma.product.upsert({
    where: { slug: 'loreal-infallible-foundation' },
    update: {},
    create: {
      name: "L'Oréal Infallible 24H Fresh Wear Foundation",
      slug: 'loreal-infallible-foundation',
      description: 'Lightweight, full coverage foundation that stays fresh for 24 hours. Transfer-proof.',
      categoryId: cosmeticsCategory.id,
      brandId: loreal.id,
      creatorId: owner.id,
      isNewArrival: false,
      isActive: true,
      variants: {
        create: [
          { size: '30ml', color: 'Porcelain', sku: 'LOR-INF-POR', purchasePrice: 8.00, salePrice: 14.99, quantity: 15, minStockLevel: 5 },
          { size: '30ml', color: 'Ivory', sku: 'LOR-INF-IVO', purchasePrice: 8.00, salePrice: 14.99, quantity: 20, minStockLevel: 5 },
          { size: '30ml', color: 'Nude', sku: 'LOR-INF-NUD', purchasePrice: 8.00, salePrice: 14.99, quantity: 18, minStockLevel: 5 },
          { size: '30ml', color: 'Sand', sku: 'LOR-INF-SND', purchasePrice: 8.00, salePrice: 14.99, quantity: 12, minStockLevel: 5 },
        ],
      },
    },
  })

  // Adidas Hoodie
  await prisma.product.upsert({
    where: { slug: 'adidas-essentials-hoodie' },
    update: {},
    create: {
      name: 'Adidas Essentials Fleece Hoodie',
      slug: 'adidas-essentials-hoodie',
      description: 'Soft fleece hoodie with iconic 3-Stripes. Perfect for everyday comfort.',
      categoryId: mensCategory.id,
      brandId: adidas.id,
      creatorId: owner.id,
      isNewArrival: false,
      isActive: true,
      variants: {
        create: [
          { size: 'S', color: 'Grey', sku: 'AD-EH-GRY-S', purchasePrice: 25.00, salePrice: 49.99, quantity: 20, minStockLevel: 5 },
          { size: 'M', color: 'Grey', sku: 'AD-EH-GRY-M', purchasePrice: 25.00, salePrice: 49.99, quantity: 25, minStockLevel: 5 },
          { size: 'L', color: 'Grey', sku: 'AD-EH-GRY-L', purchasePrice: 25.00, salePrice: 49.99, quantity: 15, minStockLevel: 5 },
          { size: 'XL', color: 'Grey', sku: 'AD-EH-GRY-XL', purchasePrice: 25.00, salePrice: 49.99, quantity: 10, minStockLevel: 5 },
          { size: 'S', color: 'Navy', sku: 'AD-EH-NVY-S', purchasePrice: 25.00, salePrice: 49.99, quantity: 18, minStockLevel: 5 },
          { size: 'M', color: 'Navy', sku: 'AD-EH-NVY-M', purchasePrice: 25.00, salePrice: 49.99, quantity: 22, minStockLevel: 5 },
        ],
      },
    },
  })

  console.log('✅ Created sample products')

  // Create default settings
  const defaultSettings = [
    { key: 'shopName', value: 'Style Boutique', description: 'Shop name displayed to customers' },
    { key: 'shopEmail', value: 'hello@styleboutique.com', description: 'Contact email for customers' },
    { key: 'shopPhone', value: '+1 (555) 123-4567', description: 'Contact phone number' },
    { key: 'shopAddress', value: '123 Fashion Street, Style City, SC 12345', description: 'Physical shop address' },
    { key: 'currency', value: 'USD', description: 'Currency code' },
    { key: 'taxRate', value: '0', description: 'Tax rate percentage' },
    { key: 'lowStockThreshold', value: '5', description: 'Default low stock threshold' },
    { key: 'alertEmails', value: '["owner@boutique.com"]', description: 'Email addresses for stock alerts' },
  ]

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ Created default settings')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
