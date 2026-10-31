import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Search, Heart, Truck, RotateCcw, Star, Shield } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'New Arrivals', href: '/new-arrivals' },
  { name: 'Men', href: '/category/mens-clothing' },
  { name: 'Women', href: '/category/womens-clothing' },
  { name: 'Shoes', href: '/category/shoes' },
  { name: 'Accessories', href: '/category/trousers' },
  { name: 'Cosmetics', href: '/category/cosmetics' },
]

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Star, title: 'Quality Guaranteed', desc: 'Authentic products only' },
]

import { ReactNode } from 'react'
export function ShopLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
    }
  }

  // We need to import navigate
  // For now, we'll handle this in the component that uses it

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Announcement bar */}
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        Free shipping on orders over $100. New arrivals every week!
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-sm">
          <div className="flex items-center gap-6">
            <span className="text-neutral-600">📞 +1 (555) 123-4567</span>
            <span className="text-neutral-600">✉️ hello@styleboutique.com</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="text-neutral-600 hover:text-primary-600 transition-colors">Contact Us</Link>
            <Link to="/admin/login" className="text-neutral-600 hover:text-primary-600 transition-colors">Admin Login</Link>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between px-4 py-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Style Boutique Home">
            <span className="text-2xl font-display font-bold text-primary-600">Style Boutique</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center" aria-label="Main navigation">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-primary-600'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link to="#" className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-colors" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link to="#" className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-colors" aria-label="Shopping cart">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-white text-xs font-medium flex items-center justify-center">0</span>
            </Link>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200 animate-slide-down">
            <nav className="flex flex-col gap-2 px-4" aria-label="Mobile navigation">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-600'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/contact"
                className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </nav>
          </div>
        )}

        {/* Search overlay */}
        {searchOpen && (
          <div className="md:hidden px-4 py-4 border-t border-neutral-200 animate-slide-down">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            </form>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="text-2xl font-display font-bold text-primary-400">Style Boutique</Link>
              <p className="mt-4 text-neutral-400 max-w-xs">
                Your destination for premium fashion. Discover the latest trends in men's and women's clothing, shoes, and cosmetics.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Shop</h3>
              <ul className="space-y-2">
                {navigation.map(item => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-neutral-400 hover:text-white transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/contact" className="text-neutral-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="#" className="text-neutral-400 hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="#" className="text-neutral-400 hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link to="#" className="text-neutral-400 hover:text-white transition-colors">Returns</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Features</h3>
              <ul className="space-y-2">
                {features.map(f => (
                  <li key={f.title}><span className="text-neutral-400">{f.title}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Style Boutique. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}