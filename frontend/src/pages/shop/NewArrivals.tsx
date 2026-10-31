import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { shopApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { PriceDisplay } from '../../components/ui/Badge'

export default function NewArrivals() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    shopApi.getNewArrivals(20).then(res => setProducts(res.data)).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">New Arrivals</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <Link key={p.id} to={`/product/${p.id}`} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-neutral-100">
                <img src={p.images?.[0]?.url || 'https://via.placeholder.com/300'} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-neutral-900 truncate">{p.name}</h3>
                <PriceDisplay price={p.priceRange?.min || 0} />
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && products.length === 0 && <Card className="text-center py-12"><p className="text-neutral-500">No new arrivals.</p></Card>}
    </div>
  )
}
