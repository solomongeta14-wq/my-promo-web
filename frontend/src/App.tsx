import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminLayout } from './components/admin/AdminLayout'
import { ShopLayout } from './components/shop/ShopLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'
import Categories from './pages/admin/Categories'
import Brands from './pages/admin/Brands'
import Sales from './pages/admin/Sales'
import Reports from './pages/admin/Reports'
import Users from './pages/admin/Users'
import Settings from './pages/admin/Settings'
import ActivityLogs from './pages/admin/ActivityLogs'
import Backups from './pages/admin/Backups'
import Home from './pages/shop/Home'
import Shop from './pages/shop/Shop'
import ProductDetail from './pages/shop/ProductDetail'
import CategoryPage from './pages/shop/CategoryPage'
import BrandPage from './pages/shop/BrandPage'
import NewArrivals from './pages/shop/NewArrivals'
import Contact from './pages/shop/Contact'

function AdminRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />

  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="brands" element={<Brands />} />
        <Route path="sales" element={<Sales />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="backups" element={<Backups />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  )
}

function ShopRoutes() {
  return (
    <ShopLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="brand/:slug" element={<BrandPage />} />
        <Route path="new-arrivals" element={<NewArrivals />} />
        <Route path="contact" element={<Contact />} />
      </Routes>
    </ShopLayout>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/admin/login" element={user ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/*" element={<ShopRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}