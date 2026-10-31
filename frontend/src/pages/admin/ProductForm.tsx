import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../../utils/api'
import { Category, Brand } from '../../types'
import { Card, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge, PriceDisplay } from '../../components/ui/Badge'
import { Tag } from 'lucide-react'
import { Plus, Trash2, Image, Eye, Save, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface VariantForm {
  size: string
  color: string
  sku: string
  purchasePrice: number
  salePrice: number
  quantity: number
  minStockLevel: number
  isActive: boolean
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [images, setImages] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [variants, setVariants] = useState<VariantForm[]>([])
  const [showVariantModal, setShowVariantModal] = useState<{ open: boolean; index: number | null }>({ open: false, index: null })
  const [showImageModal, setShowImageModal] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    brandId: '',
    isNewArrival: false,
    isActive: true,
  })

  useEffect(() => {
    loadCategories()
    loadBrands()
    if (isEditing) loadProduct()
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories()
      setCategories(res.data.filter((c:any) => c.isActive))
    } catch {}
  }

  const loadBrands = async () => {
    try {
      const res = await adminApi.getBrands()
      setBrands(res.data.filter((b:any) => b.isActive))
    } catch {}
  }

  const loadProduct = async () => {
    try {
      const res = await adminApi.getProduct(id!)
      const product = res.data
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        categoryId: product.categoryId,
        brandId: product.brandId,
        isNewArrival: product.isNewArrival,
        isActive: product.isActive,
      })
      setImages(product.images?.map((i:any) => i.url) || [])
      setVariants(product.variants?.map((v:any) => ({
        size: v.size,
        color: v.color,
        sku: v.sku,
        purchasePrice: Number(v.purchasePrice),
        salePrice: Number(v.salePrice),
        quantity: v.quantity,
        minStockLevel: v.minStockLevel,
        isActive: v.isActive,
      })) || [])
    } catch {
      toast.error('Failed to load product')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, name: value, slug: generateSlug(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.categoryId || !formData.brandId) {
      toast.error('Please fill in all required fields')
      return
    }
    if (variants.length === 0) {
      toast.error('At least one variant is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        variants: variants.map(v => ({
          ...v,
          purchasePrice: v.purchasePrice,
          salePrice: v.salePrice,
        })),
      }

      if (isEditing) {
        await adminApi.updateProduct(id!, payload)
        toast.success('Product updated')
      } else {
        const res = await adminApi.createProduct(payload)
        toast.success('Product created')
        navigate(`/admin/products/${res.data.id}/edit`)
      }
    } catch {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const addVariant = () => {
    setShowVariantModal({ open: true, index: null })
  }

  const editVariant = (index: number) => {
    setShowVariantModal({ open: true, index })
  }

  const saveVariant = (variant: VariantForm) => {
    if (showVariantModal.index !== null) {
      setVariants(prev => prev.map((v, i) => i === showVariantModal.index ? variant : v))
    } else {
      setVariants(prev => [...prev, variant])
    }
    setShowVariantModal({ open: false, index: null })
  }

  const deleteVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const addImage = async () => {
    if (!newImageUrl.trim()) return
    try {
      if (isEditing) {
        await adminApi.uploadImage(id!, { url: newImageUrl, altText: newImageAlt, isPrimary: images.length === 0 })
      }
      setImages(prev => [...prev, newImageUrl])
      setNewImageUrl('')
      setNewImageAlt('')
      setShowImageModal(false)
    } catch {
      toast.error('Failed to add image')
    }
  }

  const deleteImage = async (index: number) => {
    // In a real implementation, you'd call the delete API
    setImages(prev => prev.filter((_, i) => i !== index))
    if (primaryImageIndex >= index && primaryImageIndex > 0) {
      setPrimaryImageIndex(p => p - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{isEditing ? 'Edit Product' : 'New Product'}</h1>
            <p className="text-neutral-600">{isEditing ? 'Update product details' : 'Add a new product to your catalog'}</p>
          </div>
        </div>
        <Button onClick={handleSubmit} loading={saving}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader title="Basic Information" />
            <div className="space-y-4">
              <Input
                label="Product Name *"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Nike Air Max 270"
                required
              />
              <Input
                label="Slug *"
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="auto-generated from name"
                helperText="URL-friendly identifier (lowercase, hyphens only)"
              />
              <Select
                label="Category *"
                options={[{ value: '', label: 'Select category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                value={formData.categoryId}
                onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                required
              />
              <Select
                label="Brand *"
                options={[{ value: '', label: 'Select brand' }, ...brands.map(b => ({ value: b.id, label: b.name }))]}
                value={formData.brandId}
                onChange={e => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                required
              />
              <Textarea
                label="Description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description for customers..."
                rows={4}
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={e => setFormData(prev => ({ ...prev, isNewArrival: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Mark as New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Active</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Variants */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <CardHeader title="Variants (Size/Color)" description="Each size/color combination is a separate variant with its own stock" />
              <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-4 w-4 mr-2" /> Add Variant</Button>
            </div>
            {variants.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                <Tag className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-neutral-500">No variants added yet</p>
                <p className="text-sm text-neutral-400">Click "Add Variant" to create size/color combinations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-neutral-900">{variant.size} / {variant.color}</span>
                      <Badge variant={variant.isActive ? 'success' : 'neutral'} size="sm">{variant.sku}</Badge>
                      <Badge variant={variant.quantity === 0 ? 'danger' : variant.quantity <= variant.minStockLevel ? 'warning' : 'success'} size="sm">
                        {variant.quantity === 0 ? 'Out of Stock' : variant.quantity <= variant.minStockLevel ? 'Low Stock' : 'In Stock'}
                      </Badge>
                      <PriceDisplay price={variant.salePrice} className="text-lg font-semibold" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editVariant(index)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteVariant(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Images */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <CardHeader title="Images" description="First image is used as primary" />
              <Button variant="outline" size="sm" onClick={() => setShowImageModal(true)}><Plus className="h-4 w-4 mr-2" /> Add Image</Button>
            </div>
            {images.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                <Image className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-neutral-500">No images yet</p>
                <p className="text-sm text-neutral-400">Add product images to showcase your items</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-neutral-200">
                      <img src={image} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                      {index === primaryImageIndex && (
                        <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">Primary</div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index !== primaryImageIndex && (
                        <button
                          onClick={() => setPrimaryImageIndex(index)}
                          className="p-1.5 rounded bg-white text-neutral-600 hover:text-primary-600 shadow"
                          title="Set as primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteImage(index)}
                        className="p-1.5 rounded bg-white text-neutral-600 hover:text-red-600 shadow"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader title="Quick Stats" />
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Variants</span>
                <span className="font-medium">{variants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Stock</span>
                <span className="font-medium">{variants.reduce((sum, v) => sum + v.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Low Stock Variants</span>
                <span className="font-medium text-yellow-600">{variants.filter(v => v.quantity > 0 && v.quantity <= v.minStockLevel).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Out of Stock Variants</span>
                <span className="font-medium text-red-600">{variants.filter(v => v.quantity === 0).length}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-neutral-200">
                <span className="text-neutral-600">Avg Sale Price</span>
                <span className="font-medium">
                  {variants.length > 0
                    ? '$' + (variants.reduce((sum, v) => sum + v.salePrice, 0) / variants.length).toFixed(2)
                    : '$0.00'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Variant Modal */}
      <Modal
        isOpen={showVariantModal.open}
        onClose={() => setShowVariantModal({ open: false, index: null })}
        title={showVariantModal.index !== null ? 'Edit Variant' : 'Add Variant'}
      >
        <VariantFormComponent
          initialData={showVariantModal.index !== null ? variants[showVariantModal.index] : null}
          onSave={saveVariant}
          onCancel={() => setShowVariantModal({ open: false, index: null })}
          existingSkus={variants.filter((_, i) => i !== showVariantModal.index).map(v => v.sku)}
        />
      </Modal>

      {/* Image Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => { setShowImageModal(false); setNewImageUrl(''); setNewImageAlt(''); }}
        title="Add Product Image"
      >
        <div className="space-y-4">
          <Input
            label="Image URL"
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <Input
            label="Alt Text"
            value={newImageAlt}
            onChange={e => setNewImageAlt(e.target.value)}
            placeholder="Brief description for accessibility"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowImageModal(false); setNewImageUrl(''); setNewImageAlt(''); }}>Cancel</Button>
            <Button onClick={addImage}>Add Image</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function VariantFormComponent({ initialData, onSave, onCancel, existingSkus }: { initialData: VariantForm | null; onSave: (v: VariantForm) => void; onCancel: () => void; existingSkus: string[] }) {
  const [form, setForm] = useState<VariantForm>({
    size: '',
    color: '',
    sku: '',
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    minStockLevel: 5,
    isActive: true,
    ...initialData,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof VariantForm, string>>>({})

  const validate = () => {
    const newErrors: Partial<Record<keyof VariantForm, string>> = {}
    if (!form.size) newErrors.size = 'Size is required'
    if (!form.color) newErrors.color = 'Color is required'
    if (!form.sku) newErrors.sku = 'SKU is required'
    else if (existingSkus.includes(form.sku)) newErrors.sku = 'SKU already exists'
    if (form.purchasePrice <= 0) newErrors.purchasePrice = 'Must be greater than 0'
    if (form.salePrice <= 0) newErrors.salePrice = 'Must be greater than 0'
    if (form.quantity < 0) newErrors.quantity = 'Cannot be negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Size *"
          value={form.size}
          onChange={e => setForm(prev => ({ ...prev, size: e.target.value }))}
          error={errors.size}
          placeholder="e.g., M, 42, 32/32"
        />
        <Input
          label="Color *"
          value={form.color}
          onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
          error={errors.color}
          placeholder="e.g., Black, Navy"
        />
      </div>
      <Input
        label="SKU *"
        value={form.sku}
        onChange={e => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
        error={errors.sku}
        placeholder="e.g., NK-AM270-BLK-42"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Purchase Price *"
          type="number"
          step="0.01"
          min="0.01"
          value={form.purchasePrice}
          onChange={e => setForm(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
          error={errors.purchasePrice}
          placeholder="0.00"
        />
        <Input
          label="Sale Price *"
          type="number"
          step="0.01"
          min="0.01"
          value={form.salePrice}
          onChange={e => setForm(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
          error={errors.salePrice}
          placeholder="0.00"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity"
          type="number"
          min="0"
          value={form.quantity}
          onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
          error={errors.quantity}
        />
        <Input
          label="Min Stock Level"
          type="number"
          min="0"
          value={form.minStockLevel}
          onChange={e => setForm(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 5 }))}
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-neutral-700">Active</span>
      </label>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Save Changes' : 'Add Variant'}</Button>
      </div>
    </form>
  )
}
