import { useEffect, useState } from 'react'
import { adminApi } from '../../utils/api'
import { Card } from '../../components/ui/Card'
import { PriceDisplay } from '../../components/ui/Badge'

export default function Reports() {
  const [daily, setDaily] = useState<any>(null)
  const [top, setTop] = useState<any[]>([])

  useEffect(() => {
    adminApi.getDailyReport().then(res => setDaily(res.data)).catch(() => {})
    adminApi.getTopProducts({ limit: 10 }).then(res => setTop(res.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <p className="text-sm text-neutral-500">Today's Revenue</p>
          <p className="text-2xl font-bold"><PriceDisplay price={daily?.revenue || 0} /></p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Today's Profit</p>
          <p className="text-2xl font-bold"><PriceDisplay price={daily?.profit || 0} /></p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Sales Count</p>
          <p className="text-2xl font-bold">{daily?.salesCount || 0}</p>
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Top Products</h2>
        {top.length === 0 ? <p className="text-neutral-500">No data.</p> : (
          <ul className="space-y-2">
            {top.map((t: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{t.variant?.product?.name || 'Unknown'}</span>
                <span>{t.quantitySold} sold • <PriceDisplay price={t.revenue || 0} /></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
