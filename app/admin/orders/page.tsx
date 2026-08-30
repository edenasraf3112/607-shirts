export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { getStatusLabel } from '@/lib/utils'
import ExportOrdersButton from './ExportOrdersButton'
import ExportProductionButton from './ExportProductionButton'
import DeliverySheetExport from './DeliverySheetExport'
import OrdersTable from './OrdersTable'
import Link from 'next/link'
import { CreditCard, Trash2, Truck, ShoppingBag, CheckCircle2, Shirt } from 'lucide-react'
import OrdersSearchBar from './OrdersSearchBar'
import type { Order } from '@/lib/supabase'

export default async function OrdersAdmin({ searchParams }: { searchParams: { status?: string; collection?: string; q?: string; tag?: string; trash?: string; delivery?: string } }) {
  const showTrash = searchParams.trash === '1'
  const showDelivery = searchParams.delivery === '1'
  let orders: (Order & { deleted_at?: string | null; paid_at?: string | null })[] = []
  let allTags: string[] = []
  let collections: { id: string; name: string }[] = []
  let products: { id: string; name: string }[] = []

  try {
    let query = getServiceClient().from('orders').select('*').order('created_at', { ascending: false })
    if (showTrash) {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
      if (showDelivery) {
        query = query.eq('delivery_method', 'delivery')
      } else if (searchParams.status) {
        query = query.eq('status', searchParams.status)
      }
    }
    const { data } = await query
    orders = data || []

    const q = searchParams.q?.trim().toLowerCase()
    if (q) {
      orders = orders.filter(o =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        (o.items as any[]).some((i: any) => i.product_name?.toLowerCase().includes(q))
      )
    }

    // Deduplicate tags without Set iteration
    const tagSet: Record<string, true> = {}
    orders.flatMap(o => (o as any).tags || []).forEach((t: string) => { tagSet[t] = true })
    allTags = Object.keys(tagSet)

    if (searchParams.tag) {
      orders = orders.filter(o => ((o as any).tags || []).includes(searchParams.tag))
    }

    const [{ data: collectionsData }, { data: productsData }] = await Promise.all([
      getServiceClient().from('collections').select('id,name').order('name'),
      getServiceClient().from('products').select('id,name').order('name'),
    ])
    collections = collectionsData || []
    products = productsData || []
  } catch {}

  const statuses = ['received', 'pending_payment', 'paid', 'production', 'packing', 'shipped', 'delivered']

  const paidCount = orders.filter(o => ['paid', 'production', 'packing', 'shipped', 'delivered'].includes(o.status)).length
  const totalItemsCount = orders.reduce((s, o) => s + ((o.items as any[]) || []).reduce((is: number, i: any) => is + (Number(i.quantity) || 1), 0), 0)

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">הזמנות</h1>
            <p className="text-sm text-warm-gray">{orders.length} הזמנות</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin/orders/payment"
              className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg"
            >
              <CreditCard size={15} />
              ביצוע תשלומים
            </Link>
            {showDelivery && <DeliverySheetExport />}
            <ExportProductionButton collections={collections} products={products} />
            <ExportOrdersButton orders={orders} />
          </div>
        </div>

        {!showTrash && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-white border border-light-gray rounded-lg px-4 py-3">
              <ShoppingBag size={18} className="text-warm-gray shrink-0" />
              <div>
                <p className="text-lg font-semibold text-charcoal leading-tight">{orders.length}</p>
                <p className="text-xs text-warm-gray">הזמנות</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-light-gray rounded-lg px-4 py-3">
              <CheckCircle2 size={18} className="text-warm-gray shrink-0" />
              <div>
                <p className="text-lg font-semibold text-charcoal leading-tight">{paidCount}</p>
                <p className="text-xs text-warm-gray">שילמו</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-light-gray rounded-lg px-4 py-3">
              <Shirt size={18} className="text-warm-gray shrink-0" />
              <div>
                <p className="text-lg font-semibold text-charcoal leading-tight">{totalItemsCount}</p>
                <p className="text-xs text-warm-gray">חולצות הוזמנו</p>
              </div>
            </div>
          </div>
        )}

        <OrdersSearchBar status={searchParams.status} initialQuery={searchParams.q} />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {!showTrash ? (
            <>
              <a href={`/admin/orders${searchParams.q ? `?q=${encodeURIComponent(searchParams.q)}` : ''}`} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${!searchParams.status && !showDelivery ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                הכל
              </a>
              {statuses.map(s => (
                <a key={s} href={`/admin/orders?status=${s}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ''}`}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${searchParams.status === s ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                  {getStatusLabel(s)}
                </a>
              ))}
              <a href={`/admin/orders?delivery=1${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ''}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${showDelivery ? 'bg-blue-600 text-white border-blue-600' : 'border-light-gray text-warm-gray hover:border-blue-400 hover:text-blue-600'}`}>
                <Truck size={11} />משלוחים
              </a>
            </>
          ) : null}
          <a
            href={showTrash ? '/admin/orders' : '/admin/orders?trash=1'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${showTrash ? 'bg-red-50 text-red-brand border-red-200' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
          >
            <Trash2 size={11} />
            {showTrash ? 'חזור להזמנות' : 'פח אשפה'}
          </a>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-warm-gray">תגיות:</span>
            <a href={`/admin/orders${searchParams.status ? `?status=${searchParams.status}` : ''}`} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${!searchParams.tag ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
              הכל
            </a>
            {allTags.map(tag => (
              <a key={tag} href={`/admin/orders?tag=${encodeURIComponent(tag)}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${searchParams.tag === tag ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                {tag}
              </a>
            ))}
          </div>
        )}

        <OrdersTable orders={orders} showTrash={showTrash} showDelivery={showDelivery} />
      </div>
    </AdminShell>
  )
}
