import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import toast from 'react-hot-toast'

export default function Backups() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getBackups()
      setBackups(res.data.backups || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try { await adminApi.createBackup(); toast.success('Backup created'); load() } catch { toast.error('Failed to create backup') }
  }

  const columns = [
    { key: 'filename', header: 'Filename' },
    { key: 'status', header: 'Status' },
    { key: 'size', header: 'Size', render: (b: any) => `${b.size} bytes` },
    { key: 'createdAt', header: 'Created', render: (b: any) => new Date(b.createdAt).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Backups</h1>
        <Button onClick={handleCreate}>Create Backup</Button>
      </div>
      <Card>
        <Table data={backups} columns={columns} keyExtractor={(b: any) => b.id} isLoading={loading} emptyMessage="No backups" />
      </Card>
    </div>
  )
}
