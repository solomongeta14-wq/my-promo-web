import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { PriceDisplay } from '../../components/ui/Badge'
import toast from 'react-hot-toast'

export default function Sales() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.getSales({ page, limit: 20 })
      setSales(res.data.data)
      setPagination(res.data.pagination)
    } catch { toast.error('Failed to load sales') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const columns = [
    { key: 'saleNumber', header: 'Sale #' },
    { key: 'customerName', header: 'Customer', render: (s: any) => s.customerName || 'Walk-in' },
    { key: 'total', header: 'Total', render: (s: any) => <PriceDisplay price={Number(s.total)} /> },
    { key: 'status', header: 'Status', render: (s: any) => <Badge variant={s.status === 'COMPLETED' ? 'success' : 'neutral'}>{s.status}</Badge> },
    { key: 'createdAt', header: 'Date', render: (s: any) => new Date(s.createdAt).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Sales</h1>
      <Card>
        <Table data={sales} columns={columns} keyExtractor={(s: any) => s.id} isLoading={loading} emptyMessage="No sales yet" />
        {pagination.totalPages > 1 && (
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={p => load(p)} />
        )}
      </Card>
    </div>
  )
}
