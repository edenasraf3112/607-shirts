export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import ExportCustomersButton from './ExportCustomersButton'
import CustomersList from './CustomersList'
import PaymentVerificationModal from './PaymentVerificationModal'

type Customer = {
  customer_name: string
  customer_phone: string
  customer_email: string
  order_count: number
  total_spent: number
  total_items: number
  last_order: string
  first_order: string
}

export default async function CustomersAdmin() {
  let customers: Customer[] = []
  try {
    const { data: orders } = await getServiceClient()
      .from('orders')
      .select('customer_name,customer_phone,customer_email,total,created_at,items')
      .is('deleted_at', null)

    if (orders) {
      const map = new Map<string, Customer>()
      orders.forEach((o: any) => {
        const key = o.customer_phone || o.customer_email || o.customer_name
        const items: any[] = Array.isArray(o.items) ? o.items : []
        const itemQty = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)

        if (map.has(key)) {
          const c = map.get(key)!
          c.order_count++
          c.total_spent += o.total || 0
          c.total_items += itemQty
          if (o.created_at > c.last_order) c.last_order = o.created_at
          if (o.created_at < c.first_order) c.first_order = o.created_at
        } else {
          map.set(key, {
            customer_name: o.customer_name,
            customer_phone: o.customer_phone || '',
            customer_email: o.customer_email || '',
            order_count: 1,
            total_spent: o.total || 0,
            total_items: itemQty,
            last_order: o.created_at,
            first_order: o.created_at,
          })
        }
      })
      customers = Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent)
    }
  } catch {}

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0)
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0)
  const repeatCustomers = customers.filter(c => c.order_count > 1).length

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">לקוחות</h1>
            <p className="text-sm text-warm-gray">{customers.length} לקוחות ייחודיים</p>
          </div>
          <div className="flex items-center gap-2">
            <PaymentVerificationModal />
            <ExportCustomersButton customers={customers} />
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">לקוחות</p>
            <p className="font-serif text-2xl text-charcoal">{customers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">לקוחות חוזרים</p>
            <p className="font-serif text-2xl text-charcoal">{repeatCustomers}</p>
            <p className="text-xs text-warm-gray mt-0.5">{customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0}% מהלקוחות</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">סה"כ הזמנות</p>
            <p className="font-serif text-2xl text-charcoal">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray tracking-wider uppercase mb-1">הכנסה כוללת</p>
            <p className="font-serif text-2xl text-charcoal">₪{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <CustomersList customers={customers} />
      </div>
    </AdminShell>
  )
}
