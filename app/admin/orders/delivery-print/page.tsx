import { getServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SHIPPING_COST = 20

function formatItems(items: any[]): string {
  if (!Array.isArray(items)) return ''
  return items
    .map(i => `${i.product_name || i.name || ''}${i.size ? ` (${i.size})` : ''}${i.color ? ` / ${i.color}` : ''} ×${i.quantity || 1}`)
    .join(' | ')
}

export default async function DeliveryPrintPage() {
  const session = cookies().get('admin_session')
  if (!session?.value) redirect('/admin/login')

  const { data: orders } = await getServiceClient()
    .from('orders')
    .select('id, customer_name, customer_phone, customer_address, notes, items, total')
    .eq('delivery_method', 'delivery')
    .is('deleted_at', null)
    .order('customer_name', { ascending: true })

  const rows = orders || []
  const grandTotal = rows.reduce((s, o) => s + (Number(o.total) || 0) + SHIPPING_COST, 0)
  const today = new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <title>רשימת משלוחים — Nehoray Leizer</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, 'Helvetica Neue', sans-serif;
            font-size: 11px;
            color: #1A1A1A;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 18px;
            border-bottom: 2px solid #1A1A1A;
            padding-bottom: 12px;
          }
          .header h1 { font-size: 18px; letter-spacing: 0.05em; }
          .header p { font-size: 11px; color: #6B6560; margin-top: 3px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background: #1A1A1A;
            color: #FAFAF8;
            padding: 6px 8px;
            text-align: right;
            font-weight: 600;
            white-space: nowrap;
          }
          td {
            padding: 7px 8px;
            border-bottom: 1px solid #E8E5E0;
            vertical-align: top;
          }
          tr:nth-child(even) td { background: #FAFAF8; }
          .total-row td {
            border-top: 2px solid #1A1A1A;
            font-weight: 700;
            background: #F2F0EC;
          }
          .notes { color: #6B6560; font-style: italic; font-size: 10px; }
          .amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
          .footer {
            margin-top: 14px;
            font-size: 10px;
            color: #6B6560;
            text-align: center;
          }
          @media print {
            body { padding: 10px; }
            @page { margin: 1cm; size: A4 landscape; }
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>Nehoray Leizer — רשימת משלוחים</h1>
          <p>{today} · {rows.length} לקוחות</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם המזמין</th>
              <th>טלפון</th>
              <th>כתובת למשלוח</th>
              <th>פריטים</th>
              <th>הערות</th>
              <th>סכום הזמנה</th>
              <th>דמי משלוח</th>
              <th>סכום כולל</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, idx) => {
              const orderTotal = Number(o.total) || 0
              return (
                <tr key={o.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{o.customer_name}</strong></td>
                  <td>{o.customer_phone}</td>
                  <td>{o.customer_address || <span style={{ color: '#C41E3A' }}>חסרה כתובת</span>}</td>
                  <td>{formatItems(o.items as any[])}</td>
                  <td className="notes">{o.notes || ''}</td>
                  <td className="amount">₪{orderTotal.toFixed(0)}</td>
                  <td className="amount">₪{SHIPPING_COST}</td>
                  <td className="amount"><strong>₪{(orderTotal + SHIPPING_COST).toFixed(0)}</strong></td>
                </tr>
              )
            })}
            <tr className="total-row">
              <td colSpan={6}>סה"כ — {rows.length} משלוחים</td>
              <td className="amount">₪{rows.reduce((s, o) => s + (Number(o.total) || 0), 0).toFixed(0)}</td>
              <td className="amount">₪{(rows.length * SHIPPING_COST).toFixed(0)}</td>
              <td className="amount">₪{grandTotal.toFixed(0)}</td>
            </tr>
          </tbody>
        </table>

        <p className="footer">הופק {today} · Nehoray Leizer Admin</p>

        <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print()' }} />
      </body>
    </html>
  )
}
