import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ids = params.id.split(',').filter(Boolean)
  try {
    const db = getServiceClient()

    const { data: orders, error } = await db
      .from('orders')
      .select('id, status, customer_name')
      .in('id', ids)
      .is('deleted_at', null)

    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })
    }

    const pending = orders.filter(o => o.status !== 'delivered')
    if (pending.length === 0) {
      return NextResponse.json({ ok: true, alreadyDelivered: true })
    }

    const pendingIds = pending.map(o => o.id)
    await db.from('orders').update({ status: 'delivered' }).in('id', pendingIds)

    try {
      await db.from('order_status_history').insert(pendingIds.map(orderId => ({ order_id: orderId, status: 'delivered' })))
    } catch {}

    const customerName = orders[0].customer_name
    const resendKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM
    if (resendKey && adminEmail) {
      try {
        const origin = new URL(req.url).origin
        const orderLinks = pendingIds
          .map(orderId => `<a href="${origin}/admin/orders/${orderId}" style="display:inline-block;background:#1A1A1A;color:#FAFAF8;padding:12px 24px;text-decoration:none;font-size:13px;margin:0 8px 8px 0;">צפה בהזמנה ${orderId.slice(0, 8)}</a>`)
          .join('')
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Nehoray Leizer <${process.env.EMAIL_FROM || 'orders@nehorayleizer.com'}>`,
            to: adminEmail,
            subject: `✓ ${customerName} אישר קבלת החבילה`,
            html: `<!DOCTYPE html><html dir="rtl" lang="he"><body style="font-family:Arial,sans-serif;background:#FAFAF8;padding:40px 20px;"><div style="max-width:500px;margin:0 auto;background:#fff;border:1px solid #E8E5E0;padding:32px;"><p style="font-size:13px;color:#6B6560;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;">Nehoray Leizer · משלוחים</p><h2 style="font-size:22px;color:#1A1A1A;margin:0 0 12px;">✓ ${customerName} אישר קבלת החבילה</h2><p style="color:#6B6560;font-size:14px;margin:0 0 24px;">הלקוח סרק את המדבקה ולחץ "קיבלתי את החבילה". ${pendingIds.length > 1 ? `${pendingIds.length} הזמנות עודכנו` : 'הסטטוס עודכן'} ל<strong>נמסרה</strong>.</p>${orderLinks}</div></body></html>`,
          }),
        })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
