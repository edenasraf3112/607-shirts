import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'
import OrderStatusUpdater from '../OrderStatusUpdater'
import OrderNotes from '../OrderNotes'
import OrderTags from '../OrderTags'
import { Printer } from 'lucide-react'
import type { Order } from '@/lib/supabase'

type HistoryEntry = { id: string; status: string; changed_at: string }

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const [{ data: order }, { data: history }] = await Promise.all([
    getServiceClient().from('orders').select('*').eq('id', params.id).single(),
    getServiceClient().from('order_status_history').select('id,status,changed_at').eq('order_id', params.id).order('changed_at', { ascending: true }),
  ])

  if (!order) {
    return (
      <AdminShell>
        <div dir="rtl" className="p-12 text-center text-warm-gray">
          <p className="font-serif text-xl">הזמנה לא נמצאה</p>
        </div>
      </AdminShell>
    )
  }

  const o = order as Order
  const timeline: HistoryEntry[] = history || []

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">הזמנה #{o.id.slice(0, 8)}</h1>
            <p className="text-sm text-warm-gray">{formatDate(o.created_at)}</p>
          </div>
          <a
            href={`/admin/orders/${o.id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
          >
            <Printer size={14} /> הדפס הזמנה / Packing Slip
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-light-gray p-6 space-y-3">
            <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase">פרטי לקוח</h2>
            <div className="text-sm space-y-1">
              <p><span className="text-warm-gray">שם: </span>{o.customer_name}</p>
              <p><span className="text-warm-gray">טלפון: </span>{o.customer_phone}</p>
              {o.customer_email && <p><span className="text-warm-gray">אימייל: </span>{o.customer_email}</p>}
              {o.customer_address && <p><span className="text-warm-gray">כתובת: </span>{o.customer_address}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-light-gray p-6 space-y-3">
            <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase">סטטוס</h2>
            <OrderStatusUpdater orderId={o.id} currentStatus={o.status} />
            <div className="pt-2">
              <p className="text-xs text-warm-gray mb-2">תגיות</p>
              <OrderTags orderId={o.id} initialTags={(o as any).tags || []} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-light-gray p-6">
          <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase mb-4">פריטים</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-light-gray">
              <tr>
                <th className="text-right py-2 font-medium text-warm-gray">מוצר</th>
                <th className="text-right py-2 font-medium text-warm-gray">מידה</th>
                <th className="text-right py-2 font-medium text-warm-gray">צבע</th>
                <th className="text-right py-2 font-medium text-warm-gray">כמות</th>
                <th className="text-right py-2 font-medium text-warm-gray">מחיר</th>
              </tr>
            </thead>
            <tbody>
              {(o.items as any[]).map((item, i) => (
                <tr key={i} className="border-b border-light-gray last:border-0">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2">{item.size || '-'}</td>
                  <td className="py-2">{item.color || '-'}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between pt-4 mt-4 border-t border-light-gray font-medium text-charcoal">
            <span>סה"כ</span>
            <span>{formatPrice(o.total)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-light-gray p-6">
          <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase mb-4">הערות פנימיות</h2>
          <OrderNotes orderId={o.id} initialNotes={o.notes} />
        </div>

        <div className="bg-white rounded-xl border border-light-gray p-6">
          <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase mb-4">היסטוריית סטטוסים</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-warm-gray">אין עדיין היסטוריה עבור הזמנה זו (המעקב התחיל מ-9.7.2026)</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map(h => (
                <li key={h.id} className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(h.status)}`}>{getStatusLabel(h.status)}</span>
                  <span className="text-warm-gray text-xs">{new Date(h.changed_at).toLocaleString('he-IL')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
