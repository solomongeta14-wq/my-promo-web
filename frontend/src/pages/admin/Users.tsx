import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' })

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getUsers(); setUsers(res.data) } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    try {
      await adminApi.createUser(form)
      toast.success('User created')
      setModalOpen(false)
      load()
    } catch { toast.error('Failed to create') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete user?')) return
    try { await adminApi.deleteUser(id); toast.success('Deleted'); load() } catch { toast.error('Failed to delete') }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'actions', header: '', render: (u: any) => (
      <button onClick={() => handleDelete(u.id)} className="p-1 text-neutral-400 hover:text-red-600">Delete</button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add User</Button>
      </div>
      <Card>
        <Table data={users} columns={columns} keyExtractor={(u: any) => u.id} isLoading={loading} emptyMessage="No users" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New User">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <label className="block text-sm font-medium text-neutral-700">Role</label>
          <select className="w-full border rounded px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="STAFF">Staff</option>
            <option value="OWNER">Owner</option>
          </select>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
