import { getServiceClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import ConfirmButton from './_ConfirmButton'

export const dynamic = 'force-dynamic'

export default async function TrackPage({ params }: { params: { id: string } }) {
  const ids = params.id.split(',').filter(Boolean)
  let orders: any[] = []
  try {
    const db = getServiceClient()
    const { data } = await db
      .from('orders')
      .select('id, customer_name, items, total, status')
      .in('id', ids)
      .is('deleted_at', null)
    orders = data || []
  } catch {}

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-5" dir="rtl">
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1A1A1A' }}>הזמנה לא נמצאה</p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#6B6560', marginTop: 8 }}>nehorayleizer.com</p>
      </main>
    )
  }

  const order = { customer_name: orders[0].customer_name, total: orders.reduce((s, o) => s + (o.total || 0), 0) }
  const isDelivered = orders.every(o => o.status === 'delivered')
  const items: any[] = orders.flatMap(o => (Array.isArray(o.items) ? o.items : []))

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 py-16" dir="rtl">
      <div className="w-full max-w-[360px]">

        {/* Brand */}
        <div className="text-center mb-12">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-warm-gray">
            Nehoray Leizer
          </p>
          <div className="w-10 h-px bg-warm-gray/30 mx-auto mt-3" />
        </div>

        {/* Greeting */}
        <div className="mb-7">
          <h1 className="font-serif text-[2rem] leading-tight text-charcoal mb-1">
            שלום, {order.customer_name}
          </h1>
          <p className="text-sm text-warm-gray font-sans">
            {isDelivered
              ? 'קבלת החבילה אושרה ✓'
              : 'החבילה שלך מוכנה — לחץ לאישור קבלה'}
          </p>
        </div>

        {/* Items */}
        <div className="border border-light-gray bg-white mb-7">
          {items.map((item: any, i: number) => (
            <div
              key={i}
              className="px-5 py-3 border-b border-light-gray last:border-0 flex justify-between items-start gap-3 text-sm"
            >
              <span className="text-charcoal leading-snug">
                {item.product_name}
                {item.size ? ` — ${item.size}` : ''}
                {item.color ? ` / ${item.color}` : ''}
              </span>
              <span className="text-warm-gray whitespace-nowrap">×{item.quantity}</span>
            </div>
          ))}
          <div className="px-5 py-3 flex justify-between items-center bg-cream-dark">
            <span className="text-[10px] text-warm-gray tracking-[0.15em] uppercase font-sans">סכום</span>
            <span className="font-serif text-charcoal font-bold text-lg">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* CTA */}
        {isDelivered ? (
          <div className="text-center py-6 border border-light-gray bg-white">
            <p className="text-3xl mb-2">✓</p>
            <p className="text-sm text-warm-gray font-sans">ההזמנה אושרה כנמסרה</p>
          </div>
        ) : (
          <ConfirmButton orderId={params.id} />
        )}

        <p className="text-center text-[10px] text-warm-gray/40 mt-10 font-sans tracking-widest uppercase">
          nehorayleizer.com
        </p>
      </div>
    </main>
  )
}
