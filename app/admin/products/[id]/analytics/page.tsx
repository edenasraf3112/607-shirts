export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function ProductAnalyticsPage({ params }: { params: { id: string } }) {
  const db = getServiceClient()

  const { data: product } = await db.from('products').select('*').eq('id', params.id).single()
  if (!product) notFound()

  const { data: allOrders } = await db
    .from('orders')
    .select('id,created_at,total,items,customer_name,customer_phone,customer_email,status,paid_at')
    .is('deleted_at', null)

  const orders = allOrders || []

  // Find all orders containing this product
  type OrderWithItem = {
    orderId: string
    createdAt: string
    customerName: string
    customerPhone: string
    customerEmail: string
    status: string
    paidAt: string | null
    size: string
    color: string
    quantity: number
    revenue: number
  }

  const matchingOrders: OrderWithItem[] = []
  for (const order of orders) {
    const items: any[] = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const nameMatch = (item.product_name || item.name || '').trim() === product.name.trim()
      const idMatch = item.product_id === params.id
      if (nameMatch || idMatch) {
        matchingOrders.push({
          orderId: order.id,
          createdAt: order.created_at,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          customerEmail: order.customer_email,
          status: order.status,
          paidAt: order.paid_at,
          size: item.size || '',
          color: item.color || '',
          quantity: Number(item.quantity) || 1,
          revenue: (item.price || 0) * (Number(item.quantity) || 1),
        })
      }
    }
  }

  const totalUnits = matchingOrders.reduce((s, o) => s + o.quantity, 0)
  const totalRevenue = matchingOrders.reduce((s, o) => s + o.revenue, 0)
  const orderCount = matchingOrders.length
  const uniqueCustomers = new Set(matchingOrders.map(o => o.customerPhone || o.customerEmail)).size

  // Find returning customers (appear in more than one order across all orders)
  const customerOrderCounts: Record<string, number> = {}
  for (const order of orders) {
    const key = order.customer_phone || order.customer_email || ''
    if (key) customerOrderCounts[key] = (customerOrderCounts[key] || 0) + 1
  }
  const returningCustomers = matchingOrders.filter(o => {
    const key = o.customerPhone || o.customerEmail || ''
    return key && (customerOrderCounts[key] || 0) > 1
  }).length

  // Size breakdown
  const sizeCounts: Record<string, number> = {}
  for (const o of matchingOrders) {
    if (o.size) sizeCounts[o.size] = (sizeCounts[o.size] || 0) + o.quantity
  }
  const sizeBreakdown = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])
  const topSize = sizeBreakdown[0]

  // Color breakdown
  const colorCounts: Record<string, number> = {}
  for (const o of matchingOrders) {
    if (o.color) colorCounts[o.color] = (colorCounts[o.color] || 0) + o.quantity
  }
  const colorBreakdown = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])
  const topColor = colorBreakdown[0]

  // Timeline (orders by month)
  const monthCounts: Record<string, number> = {}
  for (const o of matchingOrders) {
    const month = o.createdAt?.slice(0, 7) || 'unknown'
    monthCounts[month] = (monthCounts[month] || 0) + o.quantity
  }

  const recentOrders = [...matchingOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6 max-w-4xl">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors"
        >
          <ArrowRight size={14} />
          חזרה למוצרים
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">{product.name}</h1>
            <p className="text-sm text-warm-gray mt-1">סטטיסטיקות מוצר</p>
          </div>
          <Link href={`/admin/products/${params.id}`} className="text-sm text-warm-gray underline hover:text-charcoal">
            ערוך מוצר
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">יחידות שנמכרו</p>
            <p className="font-serif text-3xl text-charcoal">{totalUnits}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">הכנסה</p>
            <p className="font-serif text-3xl text-charcoal">{formatPrice(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">לקוחות ייחודיים</p>
            <p className="font-serif text-3xl text-charcoal">{uniqueCustomers}</p>
            {returningCustomers > 0 && (
              <p className="text-xs text-warm-gray mt-1">{returningCustomers} לקוחות חוזרים</p>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">הזמנות</p>
            <p className="font-serif text-3xl text-charcoal">{orderCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Size breakdown */}
          {sizeBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-light-gray p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">פילוח לפי מידה</h3>
              {topSize && (
                <div className="mb-4 pb-4 border-b border-light-gray">
                  <p className="text-xs text-warm-gray">מידה פופולרית</p>
                  <p className="font-serif text-2xl text-charcoal mt-1">{topSize[0]}</p>
                  <p className="text-xs text-warm-gray">{topSize[1]} יח׳</p>
                </div>
              )}
              <div className="space-y-2">
                {sizeBreakdown.map(([size, count]) => {
                  const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0
                  return (
                    <div key={size} className="flex items-center gap-3">
                      <span className="text-sm text-charcoal w-10 flex-shrink-0">{size}</span>
                      <div className="flex-1 h-2 bg-light-gray rounded-full overflow-hidden">
                        <div className="h-full bg-charcoal rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-warm-gray w-12 text-left">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Color breakdown */}
          {colorBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-light-gray p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">פילוח לפי צבע</h3>
              {topColor && (
                <div className="mb-4 pb-4 border-b border-light-gray">
                  <p className="text-xs text-warm-gray">צבע פופולרי</p>
                  <p className="font-serif text-2xl text-charcoal mt-1">{topColor[0]}</p>
                  <p className="text-xs text-warm-gray">{topColor[1]} יח׳</p>
                </div>
              )}
              <div className="space-y-2">
                {colorBreakdown.map(([color, count]) => {
                  const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0
                  return (
                    <div key={color} className="flex items-center gap-3">
                      <span className="text-sm text-charcoal flex-1 truncate">{color}</span>
                      <div className="w-24 h-2 bg-light-gray rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full bg-charcoal rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-warm-gray w-12 text-left">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-light-gray p-6">
            <h3 className="text-sm font-semibold text-charcoal mb-4">הזמנות אחרונות</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-gray">
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">תאריך</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">לקוח</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">מידה</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">צבע</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">כמות</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">הכנסה</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-gray">שולם</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={i} className="border-b border-light-gray last:border-0">
                      <td className="py-2 text-warm-gray">{formatDate(o.createdAt)}</td>
                      <td className="py-2">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(o.customerPhone || o.customerEmail)}`}
                          className="text-charcoal hover:underline"
                        >
                          {o.customerName}
                        </Link>
                      </td>
                      <td className="py-2 text-warm-gray">{o.size || '—'}</td>
                      <td className="py-2 text-warm-gray">{o.color || '—'}</td>
                      <td className="py-2 text-charcoal font-medium">×{o.quantity}</td>
                      <td className="py-2 text-charcoal">{formatPrice(o.revenue)}</td>
                      <td className="py-2">
                        {o.paidAt
                          ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">שולם ✓</span>
                          : <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">ממתין</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {matchingOrders.length === 0 && (
          <div className="bg-white rounded-xl border border-light-gray p-12 text-center">
            <p className="text-warm-gray font-serif text-lg">אין נתוני מכירות עדיין</p>
            <p className="text-xs text-warm-gray mt-2">הנתונים יופיעו לאחר שיתקבלו הזמנות הכוללות מוצר זה</p>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
