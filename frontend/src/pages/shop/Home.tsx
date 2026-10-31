import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { shopApi } from '../../utils/api'
import { PriceDisplay } from '../../components/ui/Badge'

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    shopApi.getNewArrivals(8).then(res => setNewArrivals(res.data)).catch(() => {})
    shopApi.getCategories().then(res => setCategories(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <section className="bg-neutral-50 py-16 text-center">
        <h1 className="text-4xl font-display font-bold text-primary-600">Style Boutique</h1>
        <p className="mt-4 text-neutral-600 max-w-xl mx-auto">Discover the latest trends in fashion.</p>
        <Link to="/shop" className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg">Shop Now</Link>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.map((p: any) => (
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
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c: any) => (
            <Link key={c.id} to={`/category/${c.slug}`} className="card p-6 text-center hover:shadow-md transition-shadow">
              <h3 className="font-medium text-neutral-900">{c.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
