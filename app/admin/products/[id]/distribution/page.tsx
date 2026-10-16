export const dynamic = 'force-dynamic'

import { getServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PrintButton from '../../../orders/production-print/PrintButton'
import DistributionChecklist from '@/components/admin/DistributionChecklist'
import { DEMO_EMAIL } from '@/lib/demo'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

// Largest to smallest — the whole point of this sheet is sorting a pile of
// shirts by size, so XXL goes on top.
const SIZE_ORDER_DESC = ['4XL', '3XL', '2XL', 'XXL', 'XL', 'L', 'M', 'S', 'XS', 'XXS']

type Row = { customer_name: string; variant: string; quantity: number }
type VariantMode = 'size' | 'color'

async function fetchOrders(opts: { paidOnly: boolean; excludeDemo: boolean }) {
  const db = getServiceClient()
  let query = db.from('orders').select('items, customer_name, customer_email')

  if (opts.paidOnly) {
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
  }

  if (opts.excludeDemo) query = query.neq('customer_email', DEMO_EMAIL)

  try {
    const { data, error } = await (query as any).is('deleted_at', null)
    if (!error) return data || []
  } catch {}

  const { data, error } = await query
  if (error) throw error
  return data || []
}

function aggregateRows(orders: any[], productId: string, productName: string): { rows: Row[]; totalQty: number; variantMode: VariantMode } {
  // Collect raw matched items first — decide size-vs-color per product (not
  // per row), e.g. a hat with no sizes but several colors should group by
  // color instead of showing an empty/dash "size" column.
  const matched: { customerName: string; size: string; color: string; quantity: number }[] = []

  for (const order of orders) {
    const rawItems = order.items
    if (!rawItems) continue
    const items: any[] = Array.isArray(rawItems) ? rawItems : (() => {
      try { return JSON.parse(rawItems) } catch { return [] }
    })()

    for (const item of items) {
      const matches = item.product_id
        ? item.product_id === productId
        : (item.product_name || '').toString().trim() === productName
      if (!matches) continue

      matched.push({
        customerName: (order.customer_name || '').toString().trim(),
        size: (item.size || '').toString().trim(),
        color: (item.color || '').toString().trim(),
        quantity: Math.max(Number(item.quantity) || 1, 1),
      })
    }
  }

  const hasSize = matched.some(m => m.size)
  const variantMode: VariantMode = hasSize ? 'size' : 'color'

  const map = new Map<string, Row>()
  for (const m of matched) {
    const variant = (variantMode === 'size' ? m.size : m.color) || '—'
    const key = `${m.customerName}||${variant}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity += m.quantity
    } else {
      map.set(key, { customer_name: m.customerName, variant, quantity: m.quantity })
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => {
    if (variantMode === 'size') {
      const ai = SIZE_ORDER_DESC.indexOf(a.variant.toUpperCase())
      const bi = SIZE_ORDER_DESC.indexOf(b.variant.toUpperCase())
      if (ai !== bi) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
    } else if (a.variant !== b.variant) {
      return a.variant.localeCompare(b.variant, 'he')
    }
    return a.customer_name.localeCompare(b.customer_name, 'he')
  })

  const totalQty = rows.reduce((s, r) => s + r.quantity, 0)
  return { rows, totalQty, variantMode }
}

async function fetchCheckedKeys(productId: string): Promise<{ keys: string[]; missingTable: boolean }> {
  const db = getServiceClient()
  try {
    const test = await db.from('distribution_checks').select('id').limit(0)
    if (test.error) return { keys: [], missingTable: true }
  } catch {
    return { keys: [], missingTable: true }
  }
  try {
    const { data, error } = await db.from('distribution_checks').select('check_key').like('check_key', `${productId}:%`)
    if (error) throw error
    return { keys: (data || []).map((r: any) => r.check_key), missingTable: false }
  } catch {
    return { keys: [], missingTable: false }
  }
}

export default async function ProductDistributionPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { paid_only?: string; exclude_demo?: string }
}) {
  if (!isAuthed()) redirect('/admin/login')

  const paidOnly = searchParams.paid_only !== 'false'
  const excludeDemo = searchParams.exclude_demo !== 'false'

  const { data: product } = await getServiceClient()
    .from('products')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!product) {
    return (
      <div dir="rtl" style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
        מוצר לא נמצא
      </div>
    )
  }

  let rows: Row[] = []
  let totalQty = 0
  let variantMode: VariantMode = 'size'
  let fetchError = ''
  try {
    const orders = await fetchOrders({ paidOnly, excludeDemo })
    const result = aggregateRows(orders, product.id, product.name)
    rows = result.rows
    totalQty = result.totalQty
    variantMode = result.variantMode
  } catch (e: any) {
    fetchError = e?.message || String(e) || 'שגיאה לא ידועה'
  }

  const variantLabel = variantMode === 'size' ? 'מידה' : 'צבע'

  const { keys: checkedKeys, missingTable } = await fetchCheckedKeys(product.id)

  const today = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })

  function toggleUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ paid_only: String(paidOnly), exclude_demo: String(excludeDemo), ...overrides })
    return `/admin/products/${params.id}/distribution?${p.toString()}`
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif !important; background: #fff; color: #1A1A1A; direction: rtl; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; }
          tr { page-break-inside: avoid; }
        }
        .print-only { display: none; }
        .dist-table { border-collapse: collapse; width: 100%; }
        .dist-table th, .dist-table td { text-align: right; }
      `}</style>

      <div className="no-print" style={{ background: '#1A1A1A', padding: '10px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/admin/products" style={{ color: '#FAFAF8', fontSize: 13, textDecoration: 'none', opacity: 0.7 }}>← חזרה</a>
        <div style={{ flex: 1 }} />
        <a
          href={toggleUrl({ paid_only: String(!paidOnly) })}
          style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none', background: paidOnly ? '#FAFAF8' : 'transparent', color: paidOnly ? '#1A1A1A' : '#FAFAF8', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {paidOnly ? '✓ רק ששולמו' : 'כולל לא שולמו'}
        </a>
        <a
          href={toggleUrl({ exclude_demo: String(!excludeDemo) })}
          style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none', background: excludeDemo ? '#FAFAF8' : 'transparent', color: excludeDemo ? '#1A1A1A' : '#FAFAF8', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {excludeDemo ? '✓ ללא דמו' : 'כולל דמו'}
        </a>
        <PrintButton />
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ borderBottom: '2px solid #1A1A1A', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: 1, marginBottom: 6 }}>607</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{product.name} — ייצוא וחלוקה</div>
          <div style={{ fontSize: 13, color: '#6B6560', marginTop: 6 }}>
            {today} · {paidOnly ? 'הזמנות ששולמו' : 'כל ההזמנות'} · הזמינו <strong>{totalQty}</strong> יחידות בסה&quot;כ
          </div>
        </div>

        {fetchError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#DC2626' }}>
            <strong>שגיאה:</strong> {fetchError}
          </div>
        )}

        {rows.length === 0 && !fetchError && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B6560', fontSize: 15 }}>
            לא נמצאו הזמנות למוצר זה — נסה לכבות את &quot;רק ששולמו&quot;
          </div>
        )}

        {rows.length > 0 && (
          <DistributionChecklist
            productId={product.id}
            rows={rows}
            totalQty={totalQty}
            variantLabel={variantLabel}
            initialCheckedKeys={checkedKeys}
            missingTable={missingTable}
          />
        )}

        {rows.length > 0 && (
          <table className="dist-table print-only">
            <thead>
              <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
                <th style={{ padding: '8px 8px 8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, width: '20%' }}>כמות</th>
                <th style={{ padding: '8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, width: '50%' }}>שם</th>
                <th style={{ padding: '8px 0', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6B6560', fontWeight: 400, textAlign: 'center', width: '30%' }}>{variantLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E8E5E0', background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
                  <td style={{ padding: '11px 8px 11px 0', fontSize: 18, fontWeight: 700 }}>{row.quantity}</td>
                  <td style={{ padding: '11px 0', fontSize: 14 }}>{row.customer_name}</td>
                  <td style={{ padding: '11px 0', fontSize: 15, textAlign: 'center', fontWeight: 700 }}>{row.variant}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #1A1A1A', background: '#F2F0EC' }}>
                <td style={{ padding: '14px 8px 14px 0', fontSize: 18, fontWeight: 700 }}>{totalQty}</td>
                <td colSpan={2} style={{ padding: '14px 0', fontSize: 14, fontWeight: 700 }}>סה&quot;כ</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
