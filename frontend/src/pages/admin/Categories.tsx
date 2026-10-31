import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true, sortOrder: 0 })

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getCategories(); setCategories(res.data) } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', isActive: true, sortOrder: 0 }); setModalOpen(true) }
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || '', isActive: c.isActive, sortOrder: c.sortOrder || 0 }); setModalOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) await adminApi.updateCategory(editing.id, form)
      else await adminApi.createCategory(form)
      toast.success('Saved')
      setModalOpen(false)
      load()
    } catch { toast.error('Failed to save') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete category?')) return
    try { await adminApi.deleteCategory(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'isActive', header: 'Active', render: (c: any) => c.isActive ? 'Yes' : 'No' },
    { key: 'actions', header: '', render: (c: any) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(c)} className="p-1 text-neutral-400 hover:text-primary-600"><Edit className="h-4 w-4" /></button>
        <button onClick={() => handleDelete(c.id)} className="p-1 text-neutral-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>
      <Card>
        <Table data={categories} columns={columns} keyExtractor={(c: any) => c.id} isLoading={loading} emptyMessage="No categories" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} />
          <Input label="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
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
