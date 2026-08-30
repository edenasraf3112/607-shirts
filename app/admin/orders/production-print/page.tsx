export const dynamic = 'force-dynamic'

import { getServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'
import { DEMO_EMAIL } from '@/lib/demo'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

type Row = { product_name: string; color: string; size: string; quantity: number }

async function fetchOrders(statusFilter: string, collectionId: string | null, excludeDemo: boolean) {
  const db = getServiceClient()
  let query = db.from('orders').select('items, status, created_at, customer_email')

  if (statusFilter === 'paid') {
    // Use paid_at IS NOT NULL — the payment checkbox, not the status field
    try {
      const paidAtTest = await db.from('orders').select('paid_at').limit(0)
      if (!paidAtTest.error) {
        query = (query as any).not('paid_at', 'is', null)
      } else {
        query = query.in('status', ['paid', 'production', 'packing', 'shipped', 'delivered'])
      }
    } catch {
      query = query.in('status', ['paid', 'production', 'packing', 'shipped', 'delivered'])
    }
  } else if (statusFilter === 'pending') {
    query = query.in('status', ['received', 'pending_payment'])
  }
  // 'all' = no status/payment filter

  if (collectionId) {
    query = query.eq('collection_id', collectionId)
  }

  if (excludeDemo) {
    query = query.neq('customer_email', DEMO_EMAIL)
  }

  // Try with deleted_at filter; fall back if column doesn't exist
  try {
    const { data, error } = await (query as any).is('deleted_at', null)
    if (!error) return data || []
  } catch {}

  const { data, error } = await query
  if (error) throw error
  return data || []
}

function aggregateItems(orders: any[], isHe: boolean): { rows: Row[]; totalOrders: number; totalQty: number; debugItems: number } {
  const map = new Map<string, Row>()
  let debugItems = 0
  const unknownProductLabel = isHe ? 'מוצר לא ידוע' : 'Unknown product'

  for (const order of orders) {
    const rawItems = order.items
    if (!rawItems) continue

    const itemsArr: any[] = Array.isArray(rawItems) ? rawItems : (() => {
      try { return JSON.parse(rawItems) } catch { return [] }
    })()

    for (const item of itemsArr) {
      debugItems++
      const pName = (
        item.product_name ||
        item.name ||
        item.productName ||
        item.title ||
        unknownProductLabel
      ).toString().trim() || unknownProductLabel

      const color = (item.color || item.colour || '').toString()
      const size = (item.size || item.variant || '').toString()
      const qty = Math.max(Number(item.quantity) || Number(item.qty) || 1, 1)
      const key = `${pName}||${color}||${size}`

      const existing = map.get(key)
      if (existing) {
        existing.quantity += qty
      } else {
        map.set(key, { product_name: pName, color, size, quantity: qty })
      }
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => {
    if (a.product_name !== b.product_name) return a.product_name.localeCompare(b.product_name, 'he')
    if (a.color !== b.color) return a.color.localeCompare(b.color, 'he')
    const ai = SIZE_ORDER.indexOf(a.size.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.size.toUpperCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    return a.size.localeCompare(b.size)
  })

  const totalQty = rows.reduce((s, r) => s + r.quantity, 0)
  return { rows, totalOrders: orders.length, totalQty, debugItems }
}

export default async function ProductionPrintPage({
  searchParams,
}: {
  searchParams: { status?: string; collection_id?: string; exclude_demo?: string; lang?: string }
}) {
  if (!isAuthed()) redirect('/admin/login')

  const statusFilter = searchParams.status || 'all'
  const collectionId = searchParams.collection_id || null
  const excludeDemo = searchParams.exclude_demo !== 'false'
  const isHe = searchParams.lang !== 'en'

  let rows: Row[] = []
  let totalOrders = 0
  let totalQty = 0
  let debugItems = 0
  let fetchError = ''

  try {
    const orders = await fetchOrders(statusFilter, collectionId, excludeDemo)
    const result = aggregateItems(orders, isHe)
    rows = result.rows
    totalOrders = result.totalOrders
    totalQty = result.totalQty
    debugItems = result.debugItems
  } catch (e: any) {
    fetchError = e?.message || String(e) || (isHe ? 'שגיאה לא ידועה' : 'Unknown error')
  }

  const today = new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })

  const filterLabel = isHe
    ? (statusFilter === 'paid' ? 'הזמנות ששולמו' : statusFilter === 'pending' ? 'ממתינות לתשלום' : 'כל ההזמנות')
    : (statusFilter === 'paid' ? 'Paid orders' : statusFilter === 'pending' ? 'Pending payment' : 'All orders')

  const grouped: { name: string; rows: Row[] }[] = []
  for (const row of rows) {
    const last = grouped[grouped.length - 1]
    if (last && last.name === row.product_name) {
      last.rows.push(row)
    } else {
      grouped.push({ name: row.product_name, rows: [row] })
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif !important;
          background: #fff;
          color: #1A1A1A;
          direction: ${isHe ? 'rtl' : 'ltr'};
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          tr { page-break-inside: avoid; }
        }
        .prod-table { border-collapse: collapse; width: 100%; }
        .prod-table th, .prod-table td { text-align: ${isHe ? 'right' : 'left'}; }
      `}</style>

      {/* Top bar — hidden on print */}
      <div className="no-print" style={{ background: '#1A1A1A', padding: '10px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/admin/orders" style={{ color: '#FAFAF8', fontSize: 13, textDecoration: 'none', opacity: 0.7 }}>{isHe ? '← חזרה' : '← Back'}</a>
        <div style={{ flex: 1 }} />
        {(['all', 'paid', 'pending'] as const).map(s => (
          <a key={s}
            href={`/admin/orders/production-print?status=${s}&exclude_demo=${excludeDemo}&lang=${isHe ? 'he' : 'en'}`}
            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none', background: statusFilter === s ? '#FAFAF8' : 'transparent', color: statusFilter === s ? '#1A1A1A' : '#FAFAF8', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            {isHe
              ? (s === 'all' ? 'הכל' : s === 'paid' ? 'שולמו' : 'ממתינות')
              : (s === 'all' ? 'All' : s === 'paid' ? 'Paid' : 'Pending')}
          </a>
        ))}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
        <a
          href={`/admin/orders/production-print?status=${statusFilter}&exclude_demo=${!excludeDemo}&lang=${isHe ? 'he' : 'en'}`}
          style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none', background: excludeDemo ? '#FAFAF8' : 'transparent', color: excludeDemo ? '#1A1A1A' : '#FAFAF8', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {isHe
            ? (excludeDemo ? '✓ ללא דמו' : 'כולל דמו')
            : (excludeDemo ? '✓ Excluding demo' : 'Including demo')}
        </a>
        <PrintButton isHe={isHe} />
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 24px' }}>

        {/* Page header */}
        <div style={{ borderBottom: '2px solid #1A1A1A', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: 1, marginBottom: 6, color: '#1A1A1A' }}>Nehoray Leizer</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{isHe ? 'רשימת מידות למפעל' : 'Production Size Sheet'}</div>
              <div style={{ fontSize: 12, color: '#6B6560', marginTop: 4 }}>{filterLabel}</div>
            </div>
            <div style={{ textAlign: isHe ? 'left' : 'right', fontSize: 12, color: '#6B6560', lineHeight: 1.8 }}>
              <div>{today}</div>
              <div>{totalOrders} {isHe ? 'הזמנות' : 'orders'}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>{isHe ? `סה"כ פריטים: ${totalQty}` : `Total items: ${totalQty}`}</div>
            </div>
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#DC2626', direction: isHe ? 'rtl' : 'ltr' }}>
            <strong>{isHe ? 'שגיאה:' : 'Error:'}</strong> {fetchError}
          </div>
        )}

        {/* Debug info — no-print */}
        {!fetchError && (
          <div className="no-print" style={{ background: '#F2F0EC', padding: '8px 14px', borderRadius: 6, marginBottom: 20, fontSize: 12, color: '#6B6560', direction: isHe ? 'rtl' : 'ltr' }}>
            {isHe
              ? `נמצאו ${totalOrders} הזמנות · ${debugItems} פריטים גולמיים · ${rows.length} שורות לאחר קיבוץ`
              : `Found ${totalOrders} orders · ${debugItems} raw items · ${rows.length} rows after grouping`}
          </div>
        )}

        {/* Empty state */}
        {rows.length === 0 && !fetchError && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B6560', fontSize: 15 }}>
            {isHe
              ? (totalOrders === 0 ? 'לא נמצאו הזמנות — נסה סינון אחר' : `נמצאו ${totalOrders} הזמנות אך הן ריקות מפריטים`)
              : (totalOrders === 0 ? 'No orders found — try a different filter' : `Found ${totalOrders} orders but they have no items`)}
          </div>
        )}

        {/* Table */}
        {rows.length > 0 && (
          <table className="prod-table">
            <thead>
              <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
                <th style={{ padding: isHe ? '8px 8px 8px 0' : '8px 0 8px 8px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, width: '40%' }}>{isHe ? 'שם מוצר' : 'Product'}</th>
                <th style={{ padding: '8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, textAlign: 'center', width: '22%' }}>{isHe ? 'צבע' : 'Color'}</th>
                <th style={{ padding: '8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, textAlign: 'center', width: '18%' }}>{isHe ? 'מידה' : 'Size'}</th>
                <th style={{ padding: '8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, textAlign: 'center', width: '20%' }}>{isHe ? 'כמות' : 'Qty'}</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group, gi) =>
                group.rows.map((row, ri) => (
                  <tr
                    key={`${gi}-${ri}`}
                    style={{ borderBottom: '1px solid #E8E5E0', background: gi % 2 === 0 ? '#fff' : '#FAFAF8' }}
                  >
                    <td style={{ padding: isHe ? '11px 8px 11px 0' : '11px 0 11px 8px', fontSize: 13, fontWeight: ri === 0 ? 600 : 400 }}>
                      {ri === 0 ? row.product_name : ''}
                    </td>
                    <td style={{ padding: '11px 0', fontSize: 13, textAlign: 'center', color: '#6B6560' }}>
                      {row.color || '—'}
                    </td>
                    <td style={{ padding: '11px 0', fontSize: 15, textAlign: 'center', fontWeight: 700 }}>
                      {row.size || '—'}
                    </td>
                    <td style={{ padding: '11px 0', fontSize: 18, textAlign: 'center', fontWeight: 700, color: '#1A1A1A' }}>
                      {row.quantity}
                    </td>
                  </tr>
                ))
              )}
              {/* Total row */}
              <tr style={{ borderTop: '2px solid #1A1A1A', background: '#F2F0EC' }}>
                <td colSpan={3} style={{ padding: isHe ? '14px 8px 14px 0' : '14px 0 14px 8px', fontSize: 14, fontWeight: 700 }}>
                  {isHe ? 'סה"כ פריטים' : 'Total items'}
                </td>
                <td style={{ padding: '14px 0', fontSize: 22, textAlign: 'center', fontWeight: 700 }}>{totalQty}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E8E5E0', textAlign: 'center', fontSize: 11, color: '#9B958F', letterSpacing: 1 }}>
          Nehoray Leizer · nehorayleizer.com
        </div>
      </div>
    </>
  )
}
