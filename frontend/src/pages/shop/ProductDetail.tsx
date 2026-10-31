import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { shopApi } from '../../utils/api'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PriceDisplay } from '../../components/ui/Badge'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: 1, message: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    shopApi.getProduct(id).then(res => {
      setProduct(res.data)
      const first = res.data.variants?.find((v: any) => v.quantity > 0) || res.data.variants?.[0]
      setSelectedVariant(first || null)
    }).catch(() => setProduct(null)).finally(() => setLoading(false))
  }, [id])

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    try {
      await shopApi.submitInquiry(id, { ...form, variantId: selectedVariant?.id })
      alert('Inquiry sent successfully')
      setInquiryOpen(false)
    } catch {
      alert('Failed to send inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-center">Loading...</div>
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-12 text-center">Product not found.</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
            <img src={product.images?.[0]?.url || 'https://via.placeholder.com/600'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.images.map((img: any) => (
                <img key={img.id} src={img.url} alt="" className="aspect-square object-cover rounded border" />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
          <p className="text-neutral-500 mt-1">{product.brand?.name} • {product.category?.name}</p>
          <div className="mt-4">
            <PriceDisplay price={selectedVariant?.salePrice || product.priceRange?.min || 0} className="text-2xl" />
          </div>
          <p className="mt-4 text-neutral-600">{product.description}</p>

          <div className="mt-6">
            <h3 className="font-medium text-neutral-900 mb-2">Variants</h3>
            <div className="flex flex-wrap gap-2">
              {product.variants?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-2 border rounded-lg text-sm ${selectedVariant?.id === v.id ? 'border-primary-600 bg-primary-50' : 'border-neutral-300'} ${v.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={v.quantity === 0}
                >
                  {v.size} / {v.color}
                  {v.quantity === 0 && ' (Out)'}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="mt-2 text-sm text-neutral-500">
                SKU: {selectedVariant.sku} • {selectedVariant.quantity > 0 ? `${selectedVariant.quantity} in stock` : 'Out of stock'}
                {selectedVariant.isLowStock && <Badge variant="warning" size="sm" className="ml-2">Low Stock</Badge>}
              </p>
            )}
          </div>

          <div className="mt-6">
            <Button onClick={() => setInquiryOpen(true)} disabled={!selectedVariant || selectedVariant.quantity === 0}>
              Request to Order
            </Button>
          </div>
        </div>
      </div>

      {inquiryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Product Inquiry</h2>
            <form onSubmit={handleSubmitInquiry} className="space-y-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <input className="w-full border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Quantity" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              <textarea className="w-full border rounded px-3 py-2" placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setInquiryOpen(false)}>Cancel</Button>
                <Button type="submit" loading={submitting}>Send</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
