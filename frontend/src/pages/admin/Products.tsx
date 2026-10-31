import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../utils/api'
import { Product } from '../../types'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Plus, Filter, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([])
  const [brands, setBrands] = useState<Array<{id: string; name: string}>>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    brandId: searchParams.get('brandId') || '',
    isNewArrival: searchParams.get('isNewArrival') || '',
    isActive: searchParams.get('isActive') || '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })

  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadBrands()
  }, [page, limit, filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      })
      const res = await adminApi.getProducts(Object.fromEntries(params))
      setProducts(res.data.data)
      setPagination(res.data.pagination)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories()
      setCategories(res.data)
    } catch {}
  }

  const loadBrands = async () => {
    try {
      const res = await adminApi.getBrands()
      setBrands(res.data)
    } catch {}
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => v && params.set(k, v))
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const handleDelete = async () => {
    if (!deleteModal.product) return
    try {
      await adminApi.deleteProduct(deleteModal.product.id)
      toast.success('Product deleted')
      setDeleteModal({ open: false, product: null })
      loadProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const getAvailabilityBadge = (product: Product) => {
    if (!product.hasStock) return <Badge variant="danger">Out of Stock</Badge>
    const lowStockVariants = product.variants?.filter(v => v.isLowStock).length || 0
    if (lowStockVariants > 0) return <Badge variant="warning">Low Stock ({lowStockVariants})</Badge>
    return <Badge variant="success">In Stock</Badge>
  }

  const columns = [
    { key: 'image', header: '', render: (p: Product) => (
      <img src={p.images?.[0]?.url || 'https://via.placeholder.com/60'} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
    )},
    { key: 'name', header: 'Product', render: (p: Product) => (
      <div>
        <Link to={`/admin/products/${p.id}/edit`} className="font-medium text-neutral-900 hover:text-primary-600">{p.name}</Link>
        <p className="text-sm text-neutral-500">{p.category?.name} / {p.brand?.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {p.isNewArrival && <Badge variant="info" size="sm">New</Badge>}
          {p.isActive ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="neutral" size="sm">Inactive</Badge>}
        </div>
      </div>
    )},
    { key: 'variants', header: 'Variants', render: (p: Product) => (
      <span className="text-neutral-900">{p.variants?.length || 0}</span>
    )},
    { key: 'stock', header: 'Stock', render: (p: Product) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{p.totalStock || 0}</span>
        {getAvailabilityBadge(p)}
      </div>
    )},
    { key: 'price', header: 'Price Range', render: (p: Product) => (
      p.priceRange && p.priceRange.min > 0 ? (
        <span>$${p.priceRange.min.toFixed(2)} - $${p.priceRange.max.toFixed(2)}</span>
      ) : (
        <span className="text-neutral-400">-</span>
      )
    )},
    { key: 'createdAt', header: 'Created', render: (p: Product) => (
      <span className="text-neutral-600">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    )},
    { key: 'actions', header: '', render: (p: Product) => (
      <div className="flex items-center gap-2">
        <Link to={`/admin/products/${p.id}/edit`} className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50" title="Edit"><Edit className="h-4 w-4" /></Link>
        <button onClick={() => setDeleteModal({ open: true, product: p })} className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-600">Manage your product catalog</p>
        </div>
        <Link to="/admin/products/new">
          <Button><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-medium text-neutral-900">Filters</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <Filter className="h-4 w-4 mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
        {showFilters && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-slide-down">
            <Input
              label="Search"
              placeholder="Search products..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
            <Select
              label="Category"
              options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={filters.categoryId}
              onChange={e => handleFilterChange('categoryId', e.target.value)}
            />
            <Select
              label="Brand"
              options={[{ value: '', label: 'All Brands' }, ...brands.map(b => ({ value: b.id, label: b.name }))]}
              value={filters.brandId}
              onChange={e => handleFilterChange('brandId', e.target.value)}
            />
            <Select
              label="New Arrival"
              options={[{ value: '', label: 'All' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
              value={filters.isNewArrival}
              onChange={e => handleFilterChange('isNewArrival', e.target.value)}
            />
            <Select
              label="Status"
              options={[{ value: '', label: 'All' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              value={filters.isActive}
              onChange={e => handleFilterChange('isActive', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="card">
        <Table
          data={products}
          columns={columns}
          keyExtractor={p => p.id}
          isLoading={loading}
          emptyMessage="No products found"
          hoverable
          striped
        />
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Delete Product"
      >
        <p className="text-neutral-600">
          Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, product: null })}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
