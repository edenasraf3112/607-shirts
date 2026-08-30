import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import BarChart from './BarChart'

function FunnelCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-light-gray text-center">
      <p className="text-2xl font-bold text-charcoal">{value}</p>
      <p className="text-xs text-warm-gray mt-1">{label}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-light-gray p-6">
      <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default async function AnalyticsPage() {
  const db = getServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let events: any[] = []
  let orders: any[] = []
  let products: { id: string; name: string }[] = []
  try {
    const [{ data: eventsData }, { data: ordersData }, { data: productsData }] = await Promise.all([
      db.from('analytics_events').select('event_type,product_id,created_at').gte('created_at', thirtyDaysAgo),
      db.from('orders').select('items,total,created_at').gte('created_at', thirtyDaysAgo),
      db.from('products').select('id,name'),
    ])
    events = eventsData || []
    orders = ordersData || []
    products = productsData || []
  } catch {}

  const funnel = {
    page_views: events.filter(e => e.event_type === 'page_view').length,
    product_views: events.filter(e => e.event_type === 'product_view').length,
    add_to_cart: events.filter(e => e.event_type === 'add_to_cart').length,
    checkout_start: events.filter(e => e.event_type === 'checkout_start').length,
    completed_orders: orders.length,
  }
  const conversionRate = funnel.page_views > 0 ? (funnel.completed_orders / funnel.page_views) * 100 : 0

  const productNameById = new Map(products.map(p => [p.id, p.name]))
  const viewCounts = new Map<string, number>()
  events.filter(e => e.event_type === 'product_view' && e.product_id).forEach(e => {
    viewCounts.set(e.product_id, (viewCounts.get(e.product_id) || 0) + 1)
  })
  const topViewed = Array.from(viewCounts.entries())
    .map(([id, count]) => ({ label: productNameById.get(id) || id, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const byDay = new Map<string, { revenue: number; orders: number; items: number }>()
  for (const o of orders) {
    const day = (o.created_at as string).slice(0, 10)
    const entry = byDay.get(day) || { revenue: 0, orders: 0, items: 0 }
    entry.revenue += o.total || 0
    entry.orders += 1
    entry.items += ((o.items as any[]) || []).reduce((s, i) => s + (i.quantity || 0), 0)
    byDay.set(day, entry)
  }
  const days = Array.from(byDay.keys()).sort()
  const revenueData = days.map(d => ({ label: d.slice(5), value: byDay.get(d)!.revenue }))
  const ordersData = days.map(d => ({ label: d.slice(5), value: byDay.get(d)!.orders }))
  const itemsData = days.map(d => ({ label: d.slice(5), value: byDay.get(d)!.items }))

  const productSales = new Map<string, number>()
  const sizeSales = new Map<string, number>()
  for (const o of orders) {
    for (const item of (o.items as any[]) || []) {
      productSales.set(item.product_name, (productSales.get(item.product_name) || 0) + (item.quantity || 0))
      if (item.size) sizeSales.set(item.size, (sizeSales.get(item.size) || 0) + (item.quantity || 0))
    }
  }
  const topProducts = Array.from(productSales.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  const topSizes = Array.from(sizeSales.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">אנליטיקות</h1>
          <p className="text-sm text-warm-gray mt-1">30 הימים האחרונים</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FunnelCard label="כניסות לאתר" value={funnel.page_views} />
          <FunnelCard label="צפיות במוצר" value={funnel.product_views} />
          <FunnelCard label="הוספות לסל" value={funnel.add_to_cart} />
          <FunnelCard label="התחלות צ'קאאוט" value={funnel.checkout_start} />
          <FunnelCard label="הזמנות שהושלמו" value={funnel.completed_orders} />
        </div>

        <div className="bg-white rounded-xl border border-light-gray p-6">
          <p className="text-sm text-warm-gray">אחוז המרה (הזמנות / כניסות לאתר)</p>
          <p className="text-3xl font-serif text-charcoal mt-1">{conversionRate.toFixed(2)}%</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="הכנסות לפי יום"><BarChart data={revenueData} color="#7C3AED" /></ChartCard>
          <ChartCard title="הזמנות לפי יום"><BarChart data={ordersData} color="#059669" /></ChartCard>
          <ChartCard title="פריטים שנמכרו לפי יום"><BarChart data={itemsData} color="#0EA5E9" /></ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="מוצרים הכי נמכרים"><BarChart data={topProducts} horizontal /></ChartCard>
          <ChartCard title="מידות הכי נמכרות"><BarChart data={topSizes} horizontal /></ChartCard>
        </div>

        <ChartCard title="מוצרים הכי נצפים"><BarChart data={topViewed} horizontal /></ChartCard>
      </div>
    </AdminShell>
  )
}
