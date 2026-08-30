'use client'

import { useState, useEffect } from 'react'
import { Search, X, Printer, MessageCircle, Link2, Landmark } from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'
import OrderStatusUpdater from './OrderStatusUpdater'
import DeleteOrderButton from './DeleteOrderButton'
import OrderNotesEditor from './OrderNotesEditor'
import OrderTimeline from './OrderTimeline'
import OrderTagsEditor from './OrderTagsEditor'
import toast from 'react-hot-toast'
import type { Order } from '@/lib/supabase'

type BankDetails = { ownerName: string; bankName: string; branch: string; account: string }

type ExtendedOrder = Order & {
  deleted_at?: string | null
  paid_at?: string | null
  status_history?: any[] | null
  tags?: string[] | null
}

const ALL_TAGS = ['VIP', 'משפחה', 'איסוף עצמי', 'בעיה בתשלום', 'להתקשר', 'הזמנה גדולה']

export default function OrdersTable({ orders, showTrash, showDelivery }: { orders: ExtendedOrder[]; showTrash: boolean; showDelivery?: boolean }) {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [bitPayLink, setBitPayLink] = useState('')
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)

  useEffect(() => {
    const link = localStorage.getItem('nl_bit_personal_link') || ''
    const phone = localStorage.getItem('nl_bit_phone') || ''
    setBitPayLink(link || (phone ? `https://www.bitpay.co.il/app/transfer?phoneNumber=${phone}` : ''))
    const saved = localStorage.getItem('nl_bank_details')
    if (saved) { try { setBankDetails(JSON.parse(saved)) } catch {} }
  }, [])

  function waPhone(raw: string) {
    return raw.replace(/\D/g, '').replace(/^0/, '972')
  }

  function openWA(order: ExtendedOrder) {
    window.open(`https://wa.me/${waPhone(order.customer_phone)}`, '_blank')
  }

  function sendBitWA(order: ExtendedOrder) {
    if (!bitPayLink) { toast.error('הגדר קישור Bit בדף התשלומים'); return }
    const msg = `שלום ${order.customer_name} 🙏\nלתשלום על הזמנתך (${formatPrice(order.total)}) דרך Bit:\n${bitPayLink}`
    window.open(`https://wa.me/${waPhone(order.customer_phone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function sendBankWA(order: ExtendedOrder) {
    if (!bankDetails?.branch) { toast.error('הגדר פרטי בנק בדף התשלומים'); return }
    const bd = bankDetails
    const msg = `שלום ${order.customer_name} 🙏\nפרטי העברה בנקאית עבור הזמנתך (${formatPrice(order.total)}):\nשם: ${bd.ownerName || 'Nehoray Leizer'}\nבנק ${bd.bankName} (10) | סניף ${bd.branch} | חשבון ${bd.account}\n📝 בהערה: ${order.customer_name}`
    window.open(`https://wa.me/${waPhone(order.customer_phone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const q = search.trim().toLowerCase()
  const filtered = orders.filter(o => {
    if (tagFilter && !(o.tags || []).includes(tagFilter)) return false
    if (!q) return true
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.notes || '').toLowerCase().includes(q) ||
      (o.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (o.items as any[]).some((i: any) => i.product_name?.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-3">
      {/* Search + tag filter */}
      <div className="flex items-center gap-3 flex-wrap" dir="rtl">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, אימייל, מספר הזמנה, מוצר..."
            className="w-full pr-9 pl-9 py-2.5 border border-light-gray text-sm focus:outline-none focus:border-charcoal rounded-lg text-right bg-white"
            dir="rtl"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          className="border border-light-gray rounded-lg px-3 py-2.5 text-sm text-warm-gray focus:outline-none focus:border-charcoal bg-white"
          dir="rtl"
        >
          <option value="">כל התגיות</option>
          {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {(q || tagFilter) && (
        <p className="text-xs text-warm-gray" dir="rtl">{filtered.length} תוצאות</p>
      )}

      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-warm-gray">
            <p className="font-serif text-xl">
              {q || tagFilter ? 'לא נמצאו תוצאות' : showTrash ? 'אין הזמנות מחוקות' : 'אין הזמנות'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="border-b border-light-gray bg-cream-dark">
                <tr>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">לקוח</th>
                  {showDelivery && <th className="text-right py-3 px-4 font-medium text-blue-600">כתובת</th>}
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">פריטים</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">סכום</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">תאריך</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">הערות</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">סטטוס</th>
                  <th className="py-3 px-4 w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    className={`border-b border-light-gray last:border-0 hover:bg-cream-dark/30 transition-colors ${showTrash ? 'opacity-60' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal">{order.customer_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-warm-gray">{order.customer_phone}</span>
                        <button onClick={() => openWA(order)} title="פתח וואטסאפ" className="text-green-600 hover:text-green-700 transition-colors">
                          <MessageCircle size={13} />
                        </button>
                        {bitPayLink && (
                          <button onClick={() => sendBitWA(order)} title="שלח Bit בוואטסאפ" className="text-blue-600 hover:text-blue-700 transition-colors text-[10px] font-bold leading-none border border-blue-300 rounded px-1 py-0.5">
                            Bit
                          </button>
                        )}
                        {bankDetails?.branch && (
                          <button onClick={() => sendBankWA(order)} title="שלח פרטי בנק בוואטסאפ" className="text-warm-gray hover:text-charcoal transition-colors">
                            <Landmark size={12} />
                          </button>
                        )}
                      </div>
                      {order.customer_email && (
                        <div className="text-xs text-warm-gray">{order.customer_email}</div>
                      )}
                      {/* Tags */}
                      <div className="mt-1.5">
                        <OrderTagsEditor orderId={order.id} initialTags={order.tags || []} />
                      </div>
                    </td>
                    {showDelivery && (
                      <td className="py-3 px-4">
                        <div className="text-xs text-charcoal font-medium">
                          {(order as any).customer_address || <span className="text-warm-gray/50">—</span>}
                        </div>
                        {(order as any).notes && (
                          <div className="text-xs text-warm-gray italic mt-0.5">{(order as any).notes}</div>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {(order.items as any[]).map((item: any, i: number) => (
                          <div key={i} className="text-xs text-warm-gray">
                            {item.product_name}
                            {item.size ? ` (${item.size})` : ''}
                            {item.color ? ` · ${item.color}` : ''}
                            {` ×${item.quantity}`}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-charcoal whitespace-nowrap">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4 text-xs text-warm-gray whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4">
                      <OrderNotesEditor orderId={order.id} initialNotes={order.notes || ''} />
                    </td>
                    <td className="py-3 px-4">
                      {showTrash ? (
                        <span className="text-xs text-red-brand">נמחקה</span>
                      ) : (
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Timeline */}
                        <OrderTimeline
                          orderId={order.id}
                          history={order.status_history || []}
                          currentStatus={order.status}
                          createdAt={order.created_at}
                        />
                        {/* Print */}
                        <Link
                          href={`/admin/orders/${order.id}/print`}
                          target="_blank"
                          className="p-1.5 rounded text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
                          title="הדפס הזמנה"
                        >
                          <Printer size={14} />
                        </Link>
                        <DeleteOrderButton id={order.id} deleted={!!order.deleted_at} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
