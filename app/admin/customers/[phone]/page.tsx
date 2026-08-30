export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '@/lib/utils'
import { CLOTHING_CATEGORIES } from '@/lib/clothing-categories'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Calendar, TrendingUp } from 'lucide-react'
import CustomerNotesClient from './CustomerNotesClient'
import { getOrCreatePickupNumber } from '@/lib/pickupNumbers'
import { customerGroupKey } from '@/lib/customerGroups'

function getCategoryLabel(value: string) {
  return CLOTHING_CATEGORIES.find(c => c.value === value)?.label || value
}

export default async function CustomerProfilePage({ params }: { params: { phone: string } }) {
  const phone = decodeURIComponent(params.phone)

  let orders: any[] = []
  try {
    const { data } = await getServiceClient()
      .from('orders')
      .select('*')
      .or(`customer_phone.eq.${phone},customer_email.eq.${phone}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    orders = data || []
  } catch {}

  if (orders.length === 0) notFound()

  const latest = orders[0]
  const name = latest.customer_name
  const email = latest.customer_email
  const address = latest.customer_address || ''

  // Aggregate stats
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0)
  const totalOrders = orders.length
  const totalItems = orders.reduce((s, o) => {
    const items: any[] = Array.isArray(o.items) ? o.items : []
    return s + items.reduce((is, i) => is + (Number(i.quantity) || 1), 0)
  }, 0)
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
  const firstPurchase = orders[orders.length - 1].created_at
  const lastPurchase = orders[0].created_at

  // Product breakdown
  const productMap = new Map<string, { name: string; qty: number; category?: string }>()
  const sizesByCategory = new Map<string, Map<string, number>>()

  for (const order of orders) {
    const items: any[] = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const pName = (item.product_name || item.name || '').trim()
      if (!pName) continue
      const qty = Number(item.quantity) || 1
      const category = item.clothing_category || ''
      const size = (item.size || '').trim()

      const existing = productMap.get(pName)
      if (existing) {
        existing.qty += qty
      } else {
        productMap.set(pName, { name: pName, qty, category })
      }

      if (category && size) {
        if (!sizesByCategory.has(category)) sizesByCategory.set(category, new Map())
        const catMap = sizesByCategory.get(category)!
        catMap.set(size, (catMap.get(size) || 0) + qty)
      }
    }
  }

  const productBreakdown = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty)
  const favoriteProduct = productBreakdown[0]

  const sizePrefsByCategory = Array.from(sizesByCategory.entries()).map(([cat, sizeMap]) => {
    const topSize = Array.from(sizeMap.entries()).sort((a, b) => b[1] - a[1])[0]
    return { category: cat, size: topSize[0], count: topSize[1] }
  })

  // Persistent pickup number (same key used for labels + payment-confirmation email)
  let pickupNumber: number | null = null
  try {
    pickupNumber = await getOrCreatePickupNumber(customerGroupKey(latest), name)
  } catch {}

  // Load admin profile (notes/tags)
  let adminNotes = ''
  let adminTags: string[] = []
  try {
    const { data } = await getServiceClient()
      .from('customer_profiles')
      .select('admin_notes,admin_tags')
      .eq('phone', phone)
      .single()
    if (data) {
      adminNotes = data.admin_notes || ''
      adminTags = data.admin_tags || []
    }
  } catch {}

  // Collection history
  const collectionIdSet: Record<string, true> = {}
  orders.forEach((o: any) => { if (o.collection_id) collectionIdSet[o.collection_id] = true })
  const collectionIds = Object.keys(collectionIdSet)
  let collections: any[] = []
  try {
    if (collectionIds.length > 0) {
      const { data } = await getServiceClient()
        .from('collections')
        .select('id,name,status,close_date')
        .in('id', collectionIds)
      collections = data || []
    }
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6 max-w-4xl">
        {/* Back */}
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors"
        >
          <ArrowRight size={14} />
          חזרה ללקוחות
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-light-gray p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-charcoal">{name}</h1>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-warm-gray">{phone}</p>
                {email && <p className="text-sm text-warm-gray">{email}</p>}
                {address && <p className="text-xs text-warm-gray/70">{address}</p>}
              </div>
              {adminTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {adminTags.map(tag => (
                    <span key={tag} className="text-xs bg-charcoal text-cream px-2.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {pickupNumber !== null && (
              <div className="bg-charcoal rounded-xl px-5 py-3 text-center flex-shrink-0">
                <p className="text-[10px] tracking-[2px] uppercase text-cream/65">מספר חבילה</p>
                <p className="font-serif text-3xl font-bold text-cream leading-none mt-1">{pickupNumber}</p>
              </div>
            )}
            <div className="text-left text-xs text-warm-gray space-y-1">
              <p className="flex items-center gap-1.5">
                <Calendar size={11} />
                הצטרף: {formatDate(firstPurchase)}
              </p>
              <p className="flex items-center gap-1.5">
                <Calendar size={11} />
                אחרונה: {formatDate(lastPurchase)}
              </p>
            </div>
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">סה"כ הזמנות</p>
            <p className="font-serif text-2xl text-charcoal">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">פריטים שנרכשו</p>
            <p className="font-serif text-2xl text-charcoal">{totalItems}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">סה"כ הוצאה</p>
            <p className="font-serif text-2xl text-charcoal">₪{totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-light-gray">
            <p className="text-xs text-warm-gray uppercase tracking-wider mb-1">ממוצע להזמנה</p>
            <p className="font-serif text-2xl text-charcoal">₪{Math.round(avgOrderValue).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product breakdown */}
          <div className="bg-white rounded-xl border border-light-gray p-6">
            <h3 className="font-semibold text-charcoal text-sm mb-4 flex items-center gap-2">
              <ShoppingBag size={14} />
              מה הזמין
            </h3>
            {productBreakdown.length === 0 ? (
              <p className="text-sm text-warm-gray">אין נתונים</p>
            ) : (
              <div className="space-y-2">
                {productBreakdown.map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-charcoal">{p.name}</span>
                      {p.category && (
                        <span className="text-xs text-warm-gray mr-2">({getCategoryLabel(p.category)})</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-charcoal ml-4 flex-shrink-0">×{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
            {favoriteProduct && (
              <div className="mt-4 pt-4 border-t border-light-gray">
                <p className="text-xs text-warm-gray">מוצר מועדף</p>
                <p className="text-sm font-medium text-charcoal mt-0.5">{favoriteProduct.name}</p>
              </div>
            )}
          </div>

          {/* Size preferences */}
          <div className="bg-white rounded-xl border border-light-gray p-6">
            <h3 className="font-semibold text-charcoal text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={14} />
              מידות מועדפות לפי קטגוריה
            </h3>
            {sizePrefsByCategory.length === 0 ? (
              <p className="text-sm text-warm-gray">הנתונים יוצגו לאחר שתוגדר קטגוריה לכל מוצר</p>
            ) : (
              <div className="space-y-3">
                {sizePrefsByCategory.map(({ category, size }) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-warm-gray">{getCategoryLabel(category)}</span>
                    <span className="text-sm font-bold text-charcoal bg-cream-dark px-3 py-0.5 rounded">{size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collection history */}
        {collections.length > 0 && (
          <div className="bg-white rounded-xl border border-light-gray p-6">
            <h3 className="font-semibold text-charcoal text-sm mb-4">קולקציות</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {collections.map(col => (
                <div key={col.id} className="flex items-center gap-3 p-3 bg-cream-dark rounded-lg">
                  <span className="text-green-600 text-base">✅</span>
                  <div>
                    <p className="text-sm font-medium text-charcoal">{col.name}</p>
                    <p className="text-xs text-warm-gray">{getStatusLabel(col.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin notes */}
        <CustomerNotesClient phone={phone} initialNotes={adminNotes} initialTags={adminTags} />

        {/* Order history */}
        <div className="bg-white rounded-xl border border-light-gray p-6">
          <h3 className="font-semibold text-charcoal text-sm mb-4">היסטוריית הזמנות</h3>
          <div className="space-y-4">
            {orders.map(order => {
              const items: any[] = Array.isArray(order.items) ? order.items : []
              return (
                <div key={order.id} className="border border-light-gray rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-warm-gray">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-warm-gray/60 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.paid_at && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">שולם ✓</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-warm-gray">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          {item.product_name}
                          {item.size ? ` — ${item.size}` : ''}
                          {item.color ? ` — ${item.color}` : ''}
                          {' ×'}{item.quantity || 1}
                        </span>
                        <span className="ml-4">₪{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-light-gray">
                    <span className="text-xs text-warm-gray">סה"כ</span>
                    <span className="font-medium text-charcoal">₪{(order.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
