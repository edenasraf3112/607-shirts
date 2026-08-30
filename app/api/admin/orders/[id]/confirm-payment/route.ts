import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils'
import { customerGroupKey } from '@/lib/customerGroups'
import { getOrCreatePickupNumber } from '@/lib/pickupNumbers'

const resend = new Resend(process.env.RESEND_API_KEY)

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

async function getLogoUrl(): Promise<string> {
  try {
    const { data } = await getServiceClient()
      .from('site_content').select('value').eq('key', 'logo_url').single()
    if (data?.value) return data.value
  } catch {}
  return 'https://nehorayleizer.com/assets/branding/brand-logo.png'
}

function paymentConfirmationEmail(order: {
  customerName: string
  logoUrl: string
  items: { product_name: string; size?: string; color?: string; quantity: number; price: number; image?: string | null }[]
  total: number
  pickupNumber: number
}) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5E0;vertical-align:middle;">
        ${item.image
          ? `<img src="${item.image}" alt="${item.product_name}" style="width:52px;height:52px;object-fit:cover;display:block;" />`
          : `<div style="width:52px;height:52px;background:#F2F0EC;"></div>`}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #E8E5E0;font-size:14px;color:#1A1A1A;font-family:Georgia,serif;vertical-align:middle;">${item.product_name}</td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5E0;font-size:13px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;vertical-align:middle;">${[item.size, item.color].filter(Boolean).join(' / ') || '—'}</td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5E0;font-size:13px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;vertical-align:middle;">×${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5E0;font-size:14px;color:#1A1A1A;text-align:left;font-family:Georgia,serif;vertical-align:middle;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:48px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E5E0;max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #E8E5E0;background:#ffffff;">
            <img src="${order.logoUrl}" alt="Nehoray Leizer" style="max-height:72px;max-width:220px;width:auto;object-fit:contain;" />
          </td>
        </tr>

        <!-- Payment confirmed hero -->
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #E8E5E0;">
            <div style="display:inline-block;width:56px;height:56px;background:#1A1A1A;border-radius:50%;margin-bottom:16px;line-height:56px;font-size:24px;">✓</div>
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:400;color:#1A1A1A;font-family:Georgia,serif;">התשלום התקבל</h1>
            <p style="margin:0;font-size:14px;color:#6B6560;font-family:Arial,sans-serif;">ההזמנה שלך עברה לייצור — תודה שלך ${order.customerName}!</p>
          </td>
        </tr>

        <!-- Pickup number -->
        <tr>
          <td style="padding:32px 40px 0;text-align:center;">
            <div style="background:#1A1A1A;padding:26px 20px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FAFAF8;opacity:.65;font-family:Arial,sans-serif;">מספר ההזמנה שלך הוא</p>
              <p style="margin:0;font-size:56px;line-height:1;font-weight:bold;color:#FAFAF8;font-family:Georgia,serif;">${order.pickupNumber}</p>
              <p style="margin:12px 0 0;font-size:14px;color:#FAFAF8;opacity:.9;font-family:Arial,sans-serif;">שמור את המספר הזה למועד החלוקה</p>
            </div>
          </td>
        </tr>

        <!-- Items -->
        <tr>
          <td style="padding:32px 40px 24px;">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">פרטי ההזמנה</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E5E0;">
              <thead>
                <tr>
                  <th style="padding:10px 0;width:52px;"></th>
                  <th style="padding:10px 0 10px 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B6560;text-align:right;font-family:Arial,sans-serif;font-weight:400;">מוצר</th>
                  <th style="padding:10px 0;font-size:11px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;font-weight:400;letter-spacing:1px;text-transform:uppercase;">פרטים</th>
                  <th style="padding:10px 0;font-size:11px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;font-weight:400;letter-spacing:1px;text-transform:uppercase;">כמות</th>
                  <th style="padding:10px 0;font-size:11px;color:#6B6560;text-align:left;font-family:Arial,sans-serif;font-weight:400;letter-spacing:1px;text-transform:uppercase;">מחיר</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td style="padding:16px 0 0;font-size:15px;color:#1A1A1A;font-weight:600;border-top:1px solid #E8E5E0;font-family:Arial,sans-serif;">סה"כ שולם</td>
                <td style="padding:16px 0 0;font-size:22px;color:#1A1A1A;text-align:left;border-top:1px solid #E8E5E0;font-family:Georgia,serif;">${formatPrice(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- What's next -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#FAFAF8;padding:20px 24px;border-right:3px solid #1A1A1A;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-family:Arial,sans-serif;">מה הלאה?</p>
              <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.8;font-family:Arial,sans-serif;">
                ההזמנה שלך נכנסה לתהליך הייצור. נעדכן אותך כשהפריט שלך יהיה מוכן למשלוח.<br>
                זמן האספקה נקבע לפי לוחות הזמנים של המפעל — נתעדכן בהקדם.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#F2F0EC;text-align:center;border-top:1px solid #E8E5E0;">
            <p style="margin:0 0 4px;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">Nehoray Leizer</p>
            <p style="margin:0 0 4px;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;">
              <a href="https://nehorayleizer.com" style="color:#6B6560;text-decoration:none;">nehorayleizer.com</a>
              &nbsp;·&nbsp; לכבוד זכרו של נהוראי ליזר
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#9B958F;font-family:Arial,sans-serif;">לפניות: <a href="mailto:orders@nehorayleizer.com" style="color:#9B958F;text-decoration:none;">orders@nehorayleizer.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = params

  try {
    const db = getServiceClient()

    // Fetch order first
    const { data: order, error: fetchErr } = await db
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr || !order) throw new Error('הזמנה לא נמצאה')

    // Mark as paid + set status
    const paidAt = new Date().toISOString()
    const { error: updateErr } = await db
      .from('orders')
      .update({ paid_at: paidAt, status: 'paid' })
      .eq('id', id)
    if (updateErr) throw updateErr

    // Send confirmation email to customer
    let emailSent = false
    let emailError: string | null = null
    if (order.customer_email) {
      try {
        const logoUrl = await getLogoUrl()
        const pickupNumber = await getOrCreatePickupNumber(customerGroupKey(order), order.customer_name)
        await resend.emails.send({
          from: 'Nehoray Leizer <orders@nehorayleizer.com>',
          to: order.customer_email,
          subject: '✓ התשלום התקבל — ההזמנה שלך בייצור',
          html: paymentConfirmationEmail({
            customerName: order.customer_name,
            logoUrl,
            items: order.items || [],
            total: order.total,
            pickupNumber,
          }),
        })
        emailSent = true
      } catch (emailErr: any) {
        console.error('Payment confirmation email failed:', emailErr)
        emailError = emailErr?.message || 'שליחת המייל נכשלה'
      }
    } else {
      emailError = 'ללקוח אין כתובת מייל שמורה'
    }

    return NextResponse.json({ ok: true, paidAt, emailSent, emailError })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
