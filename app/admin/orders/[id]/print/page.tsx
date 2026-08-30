export const dynamic = 'force-dynamic'
import { getServiceClient } from '@/lib/supabase'
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils'
import PrintActions from './_PrintActions'

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
  let order: any = null
  try {
    const { data } = await getServiceClient()
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    order = data
  } catch {}

  if (!order) {
    return (
      <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
        <p>הזמנה לא נמצאה</p>
        <a href="/admin/orders">← חזרה להזמנות</a>
      </div>
    )
  }

  const isPaid = ['paid', 'production', 'packing', 'shipped', 'delivered'].includes(order.status)
  const items: any[] = Array.isArray(order.items) ? order.items : []

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 15mm; }
        }
        body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1A1A1A; direction: rtl; }
      `}</style>

      <PrintActions />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 40px', direction: 'rtl' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1A1A1A', paddingBottom: 18, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#6B6560', marginBottom: 4 }}>NEHORAY LEIZER</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif' }}>רשימת אריזה</h1>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: '#6B6560', marginBottom: 3, letterSpacing: 1 }}>מספר הזמנה</div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, background: '#F2F0EC', padding: '4px 8px' }}>
              {order.id.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Customer + Order info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#6B6560', marginBottom: 10, borderBottom: '1px solid #E8E5E0', paddingBottom: 4 }}>פרטי לקוח</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5, fontFamily: 'Georgia, serif' }}>{order.customer_name}</div>
            <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 3 }}>{order.customer_phone}</div>
            {order.customer_email && <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 3 }}>{order.customer_email}</div>}
            {order.customer_address && <div style={{ fontSize: 13, color: '#6B6560' }}>{order.customer_address}</div>}
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#6B6560', marginBottom: 10, borderBottom: '1px solid #E8E5E0', paddingBottom: 4 }}>פרטי הזמנה</div>
            <div style={{ fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: '#6B6560' }}>תאריך: </span>{formatDate(order.created_at)}
            </div>
            <div style={{ fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: '#6B6560' }}>סטטוס: </span>
              <strong>{getStatusLabel(order.status)}</strong>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: '#6B6560' }}>תשלום: </span>
              <strong style={{ color: isPaid ? '#16a34a' : '#9B958F' }}>
                {isPaid ? 'שולם ✓' : 'טרם שולם'}
              </strong>
            </div>
            {order.paid_at && (
              <div style={{ fontSize: 11, color: '#9B958F', marginTop: 3 }}>{formatDate(order.paid_at)}</div>
            )}
          </div>
        </div>

        {/* Items table */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#6B6560', marginBottom: 10, borderBottom: '1px solid #E8E5E0', paddingBottom: 4 }}>פריטים</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F2F0EC' }}>
                <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 10, color: '#6B6560', fontWeight: 600, letterSpacing: 1 }}>מוצר</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, color: '#6B6560', fontWeight: 600, width: 70 }}>מידה</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, color: '#6B6560', fontWeight: 600, width: 70 }}>צבע</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: 10, color: '#6B6560', fontWeight: 600, width: 50 }}>כמות</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, color: '#6B6560', fontWeight: 600, width: 80 }}>מחיר</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #F2F0EC' }}>
                  <td style={{ padding: '11px 10px', fontSize: 14, fontWeight: 600 }}>{item.product_name}</td>
                  <td style={{ padding: '11px 10px', fontSize: 13, textAlign: 'center', color: '#6B6560' }}>{item.size || '—'}</td>
                  <td style={{ padding: '11px 10px', fontSize: 13, textAlign: 'center', color: '#6B6560' }}>{item.color || '—'}</td>
                  <td style={{ padding: '11px 10px', fontSize: 14, textAlign: 'center', fontWeight: 700 }}>×{item.quantity}</td>
                  <td style={{ padding: '11px 10px', fontSize: 13, textAlign: 'left' }}>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ borderTop: '2px solid #1A1A1A', paddingTop: 16, marginBottom: 28 }}>
          {order.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#6B6560' }}>
              <span>הנחה ({order.discount_code})</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>סה״כ לתשלום</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ background: '#FAFAF8', border: '1px solid #E8E5E0', padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#6B6560', marginBottom: 6 }}>הערות</div>
            <div style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.7 }}>{order.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E8E5E0', paddingTop: 16, textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 10, color: '#6B6560', letterSpacing: 3, textTransform: 'uppercase' }}>Nehoray Leizer</div>
          <div style={{ fontSize: 10, color: '#9B958F', marginTop: 3 }}>nehorayleizer.com</div>
        </div>
      </div>
    </>
  )
}
