import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { shopApi } from '../../utils/api'
import { Product } from '../../types'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PriceDisplay } from '../../components/ui/Badge'


export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    brandId: searchParams.get('brandId') || '',
    isNewArrival: searchParams.get('isNewArrival') || '',
  })

  const page = parseInt(searchParams.get('page') || '1', 10)

  useEffect(() => {
    loadCategories()
    loadBrands()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [page, filters])

  const loadCategories = async () => {
    try { const res = await shopApi.getCategories(); setCategories(res.data) } catch {}
  }
  const loadBrands = async () => {
    try { const res = await shopApi.getBrands(); setBrands(res.data) } catch {}
  }
  const loadProducts = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const res = await shopApi.getProducts(params)
      setProducts(res.data.data)
      setPagination(res.data.pagination)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Shop</h1>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Search..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className="w-48" />
          <Select options={[{ value: '', label: 'All Categories' }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]} value={filters.categoryId} onChange={e => handleFilterChange('categoryId', e.target.value)} />
          <Select options={[{ value: '', label: 'All Brands' }, ...brands.map((b: any) => ({ value: b.id, label: b.name }))]} value={filters.brandId} onChange={e => handleFilterChange('brandId', e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-neutral-100" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">No products found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <Link key={p.id} to={`/product/${p.id}`} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-neutral-100">
                <img src={p.images?.[0]?.url || 'https://via.placeholder.com/300'} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-neutral-900 truncate">{p.name}</h3>
                <p className="text-sm text-neutral-500">{p.brand?.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <PriceDisplay price={p.priceRange?.min || 0} />
                  {p.hasStock ? <Badge variant="success" size="sm">In Stock</Badge> : <Badge variant="danger" size="sm">Out</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>Prev</Button>
          <span className="px-3 py-2 text-sm text-neutral-600">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
