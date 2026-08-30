export const dynamic = 'force-dynamic'

import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import DashboardChart from './DashboardChart'
import DemoUserButton from './DemoUserButton'
import { DEMO_EMAIL } from '@/lib/demo'

const HE_MONTHS: Record<number, string> = {
  1: 'ינו׳', 2: 'פבר׳', 3: 'מרץ', 4: 'אפר׳', 5: 'מאי', 6: 'יונ׳',
  7: 'יול׳', 8: 'אוג׳', 9: 'ספט׳', 10: 'אוק׳', 11: 'נוב׳', 12: 'דצמ׳',
}

async function getStats() {
  const db = getServiceClient()
  const [products, orders, messages, collections] = await Promise.all([
    db.from('products').select('id', { count: 'exact', head: true }),
    db.from('orders').select('id,total,status,created_at,items,customer_name,customer_phone,customer_email,paid_at').is('deleted_at', null),
    db.from('messages').select('id,created_at', { count: 'exact' }),
    db.from('collections').select('id', { count: 'exact' }),
  ])

  const allOrders = (orders.data || []).filter((o: any) => o.customer_email !== DEMO_EMAIL)
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0)
  const pendingOrders = allOrders.filter(o => o.status === 'received').length
  const awaitingPayment = allOrders.filter(o => o.status === 'pending_payment').length
  const paidOrders = allOrders.filter(o => ['paid', 'production', 'packing', 'shipped', 'delivered'].includes(o.status)).length
  const totalItems = allOrders.reduce((s, o) => s + ((o as any).items as any[] || []).reduce((is: number, i: any) => is + (Number(i.quantity) || 1), 0), 0)

  // Revenue today / this week / this month
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const revenueToday = allOrders
    .filter(o => o.created_at?.startsWith(todayStr))
    .reduce((s, o) => s + (o.total || 0), 0)
  const revenueWeek = allOrders
    .filter(o => o.created_at && new Date(o.created_at) >= weekAgo)
    .reduce((s, o) => s + (o.total || 0), 0)
  const revenueMonth = allOrders
    .filter(o => o.created_at >= monthStart)
    .reduce((s, o) => s + (o.total || 0), 0)

  // New customers this month (first order in this month)
  const customerFirstOrder: Record<string, string> = {}
  for (const o of [...allOrders].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const key = (o as any).customer_phone || (o as any).customer_email || ''
    if (key && !customerFirstOrder[key]) customerFirstOrder[key] = o.created_at
  }
  const newCustomersMonth = Object.values(customerFirstOrder).filter(d => d >= monthStart).length
  const totalCustomers = Object.keys(customerFirstOrder).length

  // Build last 6 months data
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${HE_MONTHS[d.getMonth() + 1]} ${String(d.getFullYear()).slice(2)}`
    const monthOrders = allOrders.filter(o => o.created_at?.startsWith(key))
    const monthItems = monthOrders.reduce((s, o) => s + ((o as any).items as any[] || []).reduce((is: number, item: any) => is + (Number(item.quantity) || 1), 0), 0)
    return {
      month: key,
      label,
      orders: monthOrders.length,
      revenue: monthOrders.reduce((s, o) => s + (o.total || 0), 0),
      items: monthItems,
    }
  })

  // Best sellers + size breakdown
  const itemMap: Record<string, { name: string; qty: number }> = {}
  const sizeMap: Record<string, number> = {}
  for (const o of allOrders) {
    for (const item of ((o as any).items as any[] || [])) {
      const key = item.product_name || item.name || 'לא ידוע'
      if (!itemMap[key]) itemMap[key] = { name: key, qty: 0 }
      itemMap[key].qty += Number(item.quantity) || 1
      if (item.size) sizeMap[item.size] = (sizeMap[item.size] || 0) + (Number(item.quantity) || 1)
    }
  }
  const bestSellers = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5)
  const topSizes = Object.entries(sizeMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Recent orders (last 5)
  const recentOrders = [...allOrders]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map(o => ({
      id: o.id,
      name: (o as any).customer_name,
      phone: (o as any).customer_phone,
      total: o.total,
      status: o.status,
      paidAt: (o as any).paid_at,
      createdAt: o.created_at,
    }))

  return {
    products: products.count || 0,
    orders: allOrders.length,
    pending: pendingOrders,
    awaitingPayment,
    paid: paidOrders,
    revenue: totalRevenue,
    totalItems,
    totalCustomers,
    newCustomersMonth,
    messages: (messages.data || []).length,
    collections: collections.count || 0,
    monthsData,
    bestSellers,
    topSizes,
    revenueToday,
    revenueWeek,
    revenueMonth,
    recentOrders,
  }
}

export default async function AdminDashboard() {
  let stats = {
    products: 0, orders: 0, pending: 0, awaitingPayment: 0, paid: 0,
    revenue: 0, totalItems: 0, messages: 0, collections: 0,
    totalCustomers: 0, newCustomersMonth: 0,
    revenueToday: 0, revenueWeek: 0, revenueMonth: 0,
    monthsData: [] as any[],
    bestSellers: [] as { name: string; qty: number }[],
    topSizes: [] as [string, number][],
    recentOrders: [] as any[],
  }
  try { stats = await getStats() } catch {}


  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">לוח הבקרה</h1>
          <p className="text-sm text-warm-gray mt-1">סיכום כללי — Nehoray Leizer</p>
        </div>

        {/* Alerts */}
        {(stats.awaitingPayment > 0 || stats.pending > 0) && (
          <div className="flex flex-wrap gap-3">
            {stats.awaitingPayment > 0 && (
              <a href="/admin/orders?status=pending_payment" className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2.5 rounded-lg hover:bg-orange-100 transition-colors">
                <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-800 text-xs font-bold flex items-center justify-center">{stats.awaitingPayment}</span>
                הזמנות ממתינות לתשלום
              </a>
            )}
            {stats.pending > 0 && (
              <a href="/admin/orders?status=received" className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center">{stats.pending}</span>
                הזמנות חדשות שהתקבלו
              </a>
            )}
          </div>
        )}

        {/* Revenue today / week / month */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">היום</p>
            <p className="font-serif text-2xl text-charcoal">{formatPrice(stats.revenueToday)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">7 ימים אחרונים</p>
            <p className="font-serif text-2xl text-charcoal">{formatPrice(stats.revenueWeek)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">החודש</p>
            <p className="font-serif text-2xl text-charcoal">{formatPrice(stats.revenueMonth)}</p>
            {stats.newCustomersMonth > 0 && (
              <p className="text-xs text-green-700 mt-1">+{stats.newCustomersMonth} לקוחות חדשים</p>
            )}
          </div>
        </div>

        {/* Main KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-2">סה"כ הכנסות</p>
            <p className="font-serif text-3xl text-charcoal">{formatPrice(stats.revenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-2">סה"כ הזמנות</p>
            <p className="font-serif text-3xl text-charcoal">{stats.orders}</p>
            <p className="text-xs text-warm-gray mt-1">{stats.paid} שולמו</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-2">פריטים שהוזמנו</p>
            <p className="font-serif text-3xl text-charcoal">{stats.totalItems.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-2">לקוחות</p>
            <p className="font-serif text-3xl text-charcoal">{stats.totalCustomers}</p>
            <p className="text-xs text-warm-gray mt-1">
              {stats.orders > 0 ? `₪${Math.round(stats.revenue / stats.orders).toLocaleString()} ממוצע` : ''}
            </p>
          </div>
        </div>

        {/* Monthly chart */}
        <div className="bg-white rounded-xl p-6 border border-light-gray">
          <h2 className="text-sm font-semibold text-charcoal mb-1">מגמה חודשית</h2>
          <p className="text-xs text-warm-gray mb-5">6 חודשים אחרונים</p>
          {stats.monthsData.length > 0
            ? <DashboardChart months={stats.monthsData} />
            : <p className="text-sm text-warm-gray text-center py-8">אין נתונים</p>
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best sellers */}
          {stats.bestSellers.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-light-gray">
              <h2 className="text-sm font-semibold text-charcoal mb-4">מוצרים מובילים</h2>
              <div className="space-y-3">
                {stats.bestSellers.map((s, i) => {
                  const pct = stats.totalItems > 0 ? Math.round((s.qty / stats.totalItems) * 100) : 0
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs text-warm-gray/50 w-4 flex-shrink-0 font-mono">{i + 1}</span>
                      <span className="text-sm text-charcoal flex-1 truncate">{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 h-1.5 bg-light-gray rounded-full overflow-hidden">
                          <div className="h-full bg-charcoal rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-warm-gray w-10 text-left">{s.qty} יח׳</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top sizes */}
          {stats.topSizes.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-light-gray">
              <h2 className="text-sm font-semibold text-charcoal mb-4">מידות פופולריות</h2>
              <div className="space-y-3">
                {stats.topSizes.map(([size, count], i) => {
                  const pct = stats.totalItems > 0 ? Math.round((count / stats.totalItems) * 100) : 0
                  return (
                    <div key={size} className="flex items-center gap-3">
                      <span className="text-xs text-warm-gray/50 w-4 flex-shrink-0 font-mono">{i + 1}</span>
                      <span className="text-sm font-medium text-charcoal w-10 flex-shrink-0">{size}</span>
                      <div className="flex-1 h-1.5 bg-light-gray rounded-full overflow-hidden">
                        <div className="h-full bg-charcoal rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-warm-gray w-10 text-left">{count} יח׳</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent orders */}
        {stats.recentOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray">
              <h2 className="text-sm font-semibold text-charcoal">הזמנות אחרונות</h2>
              <a href="/admin/orders" className="text-xs text-warm-gray hover:text-charcoal underline">כל ההזמנות</a>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {stats.recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/40 transition-colors">
                    <td className="px-6 py-3 text-charcoal font-medium">{o.name}</td>
                    <td className="px-4 py-3 text-warm-gray text-xs">{o.createdAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-charcoal">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      {o.paidAt
                        ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">שולם</span>
                        : <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">ממתין</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/admin/orders/${o.id}`} className="text-xs text-warm-gray hover:text-charcoal underline">פרטים</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Demo user */}
        <DemoUserButton />

        {/* Quick links */}
        <div className="bg-white rounded-xl p-6 border border-light-gray">
          <h2 className="text-sm font-semibold text-charcoal mb-4 tracking-wider uppercase">פעולות מהירות</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '+ מוצר חדש', href: '/admin/products/new' },
              { label: '+ קולקציה חדשה', href: '/admin/collections/new' },
              { label: 'ניהול הזמנות', href: '/admin/orders' },
              { label: 'לקוחות', href: '/admin/customers' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-center py-3 px-4 border border-light-gray text-sm text-charcoal hover:bg-charcoal hover:text-cream transition-colors rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
