# Clothing Boutique Management System - Specification

## Project Overview
A full-stack web application for managing a clothing boutique with two interfaces:
- **Admin Dashboard**: Private interface for shop management
- **Customer Shop**: Public-facing online store

## Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Email**: Nodemailer (SMTP)
- **Styling**: Tailwind CSS

## Database Schema

### Users & Authentication
- `User`: id, email, passwordHash, name, role (OWNER/STAFF), permissions, createdAt, updatedAt
- `Session`: id, userId, token, expiresAt, createdAt

### Products & Inventory
- `Category`: id, name, slug, description, isActive, createdAt
- `Brand`: id, name, slug, logoUrl, description, isActive, createdAt
- `Product`: id, name, slug, description, categoryId, brandId, isNewArrival, isActive, createdAt, updatedAt
- `ProductImage`: id, productId, url, altText, sortOrder, isPrimary
- `ProductVariant`: id, productId, size, color, sku, purchasePrice, salePrice, quantity, minStockLevel, isActive
- `StockAlert`: id, variantId, type (LOW_STOCK/OUT_OF_STOCK), message, isRead, createdAt

### Sales & Transactions
- `Sale`: id, saleNumber, customerName, customerEmail, customerPhone, subtotal, tax, discount, total, paymentMethod, status, notes, createdAt
- `SaleItem`: id, saleId, variantId, quantity, unitPrice, totalPrice
- `PurchaseOrder`: id, orderNumber, supplierName, supplierContact, expectedDate, status, totalCost, createdAt
- `PurchaseOrderItem`: id, purchaseOrderId, variantId, quantity, unitCost, totalCost

### System
- `ActivityLog`: id, userId, action, entityType, entityId, details, ipAddress, userAgent, createdAt
- `Settings`: id, key, value, description
- `Backup`: id, filename, size, status, createdAt

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- POST `/api/auth/register` - Register (owner only)
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/change-password` - Change password

### Admin - Dashboard
- GET `/api/admin/dashboard/stats` - Overview stats
- GET `/api/admin/dashboard/low-stock` - Low stock items
- GET `/api/admin/dashboard/out-of-stock` - Out of stock items
- GET `/api/admin/dashboard/recent-sales` - Recent transactions
- GET `/api/admin/dashboard/alerts` - Unread stock alerts

### Admin - Products
- GET `/api/admin/products` - List products (paginated, filtered)
- POST `/api/admin/products` - Create product
- GET `/api/admin/products/:id` - Get product details
- PUT `/api/admin/products/:id` - Update product
- DELETE `/api/admin/products/:id` - Delete product
- POST `/api/admin/products/:id/images` - Upload images
- DELETE `/api/admin/products/:id/images/:imageId` - Delete image
- PUT `/api/admin/products/:id/variants` - Update variants (bulk)
- POST `/api/admin/products/:id/variants` - Add variant
- PUT `/api/admin/products/variants/:variantId` - Update variant
- DELETE `/api/admin/products/variants/:variantId` - Delete variant
- POST `/api/admin/products/:id/restock` - Restock variant
- PUT `/api/admin/products/:id/publish` - Toggle new arrival

### Admin - Categories & Brands
- GET `/api/admin/categories` - List categories
- POST `/api/admin/categories` - Create category
- PUT `/api/admin/categories/:id` - Update category
- DELETE `/api/admin/categories/:id` - Delete category
- GET `/api/admin/brands` - List brands
- POST `/api/admin/brands` - Create brand
- PUT `/api/admin/brands/:id` - Update brand
- DELETE `/api/admin/brands/:id` - Delete brand

### Admin - Sales & Reports
- GET `/api/admin/sales` - List sales (paginated, filtered)
- GET `/api/admin/sales/:id` - Get sale details
- POST `/api/admin/sales` - Create sale (POS)
- GET `/api/admin/reports/daily` - Daily report
- GET `/api/admin/reports/weekly` - Weekly report
- GET `/api/admin/reports/monthly` - Monthly report
- GET `/api/admin/reports/top-products` - Top selling products
- GET `/api/admin/reports/revenue` - Revenue/profit report

### Admin - Users & Settings
- GET `/api/admin/users` - List users
- POST `/api/admin/users` - Create user
- PUT `/api/admin/users/:id` - Update user
- DELETE `/api/admin/users/:id` - Delete user
- GET `/api/admin/activity-logs` - Activity logs
- GET `/api/admin/settings` - Get settings
- PUT `/api/admin/settings` - Update settings
- POST `/api/admin/backup` - Create backup
- GET `/api/admin/backups` - List backups

### Customer - Shop
- GET `/api/shop/products` - List products (paginated, filtered, search)
- GET `/api/shop/products/:id` - Get product details with variants
- GET `/api/shop/categories` - List active categories
- GET `/api/shop/brands` - List active brands
- GET `/api/shop/new-arrivals` - New arrival products
- POST `/api/shop/contact` - Contact form submission
- POST `/api/shop/inquiry` - Product inquiry/order request

## Business Rules

### Stock Management
1. Each product variant (size + color combination) has independent stock
2. `minStockLevel` configurable per variant (default: 5)
3. When quantity <= minStockLevel → create LOW_STOCK alert
4. When quantity = 0 → create OUT_OF_STOCK alert, hide from customer shop
5. When restocked (quantity > 0) → resolve OUT_OF_STOCK, update availability
6. When restocked (quantity > minStockLevel) → resolve LOW_STOCK

### Product Visibility
- Customer shop only shows `isActive = true` products
- Variants with quantity = 0 shown as "Out of Stock" (not purchasable)
- Variants with quantity > 0 but <= minStockLevel shown with "Low Stock" badge
- New arrivals highlighted in dedicated section

### Sales & Profit
- Profit = (salePrice - purchasePrice) * quantity per variant
- Revenue = salePrice * quantity
- Reports aggregate by day/week/month

### Security
- JWT tokens with 24h expiry
- Passwords hashed with bcrypt (12 rounds)
- Role-based access: OWNER (full), STAFF (limited)
- Activity logging for all admin actions
- Rate limiting on auth endpoints
- Input validation on all endpoints

### Email Notifications
- SMTP configuration in settings
- Send on: LOW_STOCK, OUT_OF_STOCK alerts
- Template with product name, variant details, current quantity
- Configurable recipients (owner email)

## Frontend Structure

### Admin Dashboard Pages
- `/admin/login` - Login page
- `/admin/dashboard` - Overview with stats, alerts, recent sales
- `/admin/products` - Product list with search/filter
- `/admin/products/new` - Create product
- `/admin/products/:id/edit` - Edit product
- `/admin/categories` - Category management
- `/admin/brands` - Brand management
- `/admin/sales` - Sales list and POS
- `/admin/reports` - Reports (daily, weekly, monthly, top products)
- `/admin/users` - User management (owner only)
- `/admin/settings` - System settings
- `/admin/activity-logs` - Activity history
- `/admin/backups` - Database backups

### Customer Shop Pages
- `/` - Homepage with featured/new arrivals
- `/shop` - Product listing with filters
- `/product/:id` - Product detail page
- `/category/:slug` - Category products
- `/brand/:slug` - Brand products
- `/new-arrivals` - New arrivals page
- `/contact` - Contact form
- `/inquiry/:productId` - Product inquiry modal

## UI/UX Requirements
- Responsive design (mobile-first)
- Clean, modern fashion boutique aesthetic
- Admin: Data-dense tables, quick actions, toast notifications
- Customer: Visual product cards, smooth filtering, image gallery
- Loading states, error handling, empty states
- Accessible (WCAG AA)

## Configuration
Environment variables:
- DATABASE_URL
- JWT_SECRET
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
- FRONTEND_URL
- BACKUP_DIR