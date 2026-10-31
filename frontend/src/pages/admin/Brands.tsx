import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Brands() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', logoUrl: '', isActive: true })

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getBrands(); setBrands(res.data) } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', logoUrl: '', isActive: true }); setModalOpen(true) }
  const openEdit = (b: any) => { setEditing(b); setForm({ name: b.name, slug: b.slug, description: b.description || '', logoUrl: b.logoUrl || '', isActive: b.isActive }) }

  const handleSave = async () => {
    try {
      if (editing) await adminApi.updateBrand(editing.id, form)
      else await adminApi.createBrand(form)
      toast.success('Saved')
      setModalOpen(false)
      load()
    } catch { toast.error('Failed to save') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete brand?')) return
    try { await adminApi.deleteBrand(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'isActive', header: 'Active', render: (b: any) => b.isActive ? 'Yes' : 'No' },
    { key: 'actions', header: '', render: (b: any) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(b)} className="p-1 text-neutral-400 hover:text-primary-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => handleDelete(b.id)} className="p-1 text-neutral-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Brands</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Brand</Button>
      </div>
      <Card>
        <Table data={brands} columns={columns} keyExtractor={(b: any) => b.id} isLoading={loading} emptyMessage="No brands" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Brand' : 'New Brand'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} />
          <Input label="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          <Input label="Logo URL" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
