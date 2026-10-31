import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminApi.getActivityLogs({ limit: 50 }).then(res => setLogs(res.data.data)).catch(() => setLogs([])).finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'action', header: 'Action' },
    { key: 'entityType', header: 'Entity' },
    { key: 'user', header: 'User', render: (l: any) => l.user?.name || '-' },
    { key: 'createdAt', header: 'When', render: (l: any) => new Date(l.createdAt).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Activity Logs</h1>
      <Card>
        <Table data={logs} columns={columns} keyExtractor={(l: any) => l.id} isLoading={loading} emptyMessage="No logs" />
      </Card>
    </div>
  )
}
