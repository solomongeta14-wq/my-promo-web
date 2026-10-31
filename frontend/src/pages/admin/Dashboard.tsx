import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../utils/api'
import { DashboardStats } from '../../types'
import { Badge } from '../../components/ui/Badge'
import { PriceDisplay } from '../../components/ui/Badge'
import { Package, ShoppingBag, AlertTriangle, DollarSign, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const statCards = [
  { name: 'Total Products', key: 'totalProducts', icon: Package, color: 'bg-blue-500', href: '/admin/products' },
  { name: 'Total Variants', key: 'totalVariants', icon: Package, color: 'bg-purple-500', href: '/admin/products' },
  { name: 'Low Stock', key: 'lowStockCount', icon: AlertTriangle, color: 'bg-yellow-500', href: '/admin/dashboard/low-stock' },
  { name: 'Out of Stock', key: 'outOfStockCount', icon: AlertTriangle, color: 'bg-red-500', href: '/admin/dashboard/out-of-stock' },
  { name: 'Today\'s Sales', key: 'todaysSales.count', icon: ShoppingBag, color: 'bg-green-500', href: '/admin/sales' },
  { name: 'Today\'s Revenue', key: 'todaysSales.revenue', icon: DollarSign, color: 'bg-emerald-500', href: '/admin/sales', isCurrency: true },
  { name: 'Unread Alerts', key: 'unreadAlerts', icon: AlertTriangle, color: 'bg-orange-500', href: '/admin/dashboard/alerts' },
]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSales, setRecentSales] = useState<DashboardStats['recentSales']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentSales(),
      ])
      setStats(statsRes.data)
      setRecentSales(salesRes.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatValue = (obj: DashboardStats, path: string) => {
    return path.split('.').reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], obj) as number
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="card p-6 h-32">
              <div className="h-4 w-3/4 bg-neutral-200 rounded mb-4" />
              <div className="h-8 w-1/2 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="p-6 border-b border-neutral-200">
            <div className="h-6 w-1/4 bg-neutral-200 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Overview of your boutique performance</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => {
          const value = getStatValue(stats!, card.key)
          return (
            <Link key={card.name} to={card.href} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">{card.name}</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {card.isCurrency ? (
                      <PriceDisplay price={value} />
                    ) : (
                      value.toLocaleString()
                    )}
                  </p>
                </div>
                <div className={clsx('p-3 rounded-xl', card.color)}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-500">View details</span>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent sales and alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
            <Link to="/admin/sales" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="p-6">
            {recentSales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-neutral-500">No recent sales</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{sale.saleNumber}</p>
                        <p className="text-sm text-neutral-500">
                          {sale.items?.length} item{sale.items?.length !== 1 ? 's' : ''} • {new Date(sale.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">
                        <PriceDisplay price={Number(sale.total)} />
                      </p>
                      <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'neutral'} size="sm">
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="card">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Stock Alerts</h2>
            <Link to="/admin/dashboard/alerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="p-6">
            {stats!.unreadAlerts === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-2 text-neutral-500">No stock alerts</p>
                <p className="text-sm text-neutral-400">All products are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { type: 'Out of Stock', count: stats!.outOfStockCount, variant: 'danger' as const, href: '/admin/dashboard/out-of-stock' },
                  { type: 'Low Stock', count: stats!.lowStockCount, variant: 'warning' as const, href: '/admin/dashboard/low-stock' },
                ].map(alert => (
                  alert.count > 0 && (
                    <Link key={alert.type} to={alert.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={clsx('p-2 rounded-lg', alert.variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100')}>
                          <AlertTriangle className={clsx('h-5 w-5', alert.variant === 'danger' ? 'text-red-600' : 'text-yellow-600')} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{alert.type}</p>
                          <p className="text-sm text-neutral-500">{alert.count} variant{alert.count !== 1 ? 's' : ''} affected</p>
                        </div>
                      </div>
                      <Badge variant={alert.variant} size="sm">{alert.count}</Badge>
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
