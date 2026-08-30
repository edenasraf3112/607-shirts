import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY || 're_disabled')

async function getLogoUrl(): Promise<string> {
  try {
    const { data } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'logo_url')
      .single()
    if (data?.value) return data.value
  } catch {}
  return 'https://nehorayleizer.com/assets/branding/brand-logo.png'
}

function orderConfirmationEmail(order: {
  customerName: string
  logoUrl: string
  items: { product_name: string; size?: string; color?: string; quantity: number; price: number; image?: string | null }[]
  total: number
  discountAmount: number
  discountCode?: string
}) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5E0;vertical-align:middle;">
        ${item.image ? `<img src="${item.image}" alt="${item.product_name}" style="width:56px;height:56px;object-fit:cover;display:block;background:#F2F0EC;" />` : `<div style="width:56px;height:56px;background:#F2F0EC;"></div>`}
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

        <!-- Logo header -->
        <tr>
          <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #E8E5E0;background:#ffffff;">
            <img src="${order.logoUrl}" alt="Nehoray Leizer" style="max-height:80px;max-width:240px;width:auto;object-fit:contain;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">

            <!-- Greeting -->
            <p style="margin:0 0 6px;font-size:18px;color:#1A1A1A;font-family:Georgia,serif;font-weight:400;">שלום ${order.customerName},</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6B6560;line-height:1.8;font-family:Arial,sans-serif;">
              קיבלנו את הזמנתך בהצלחה — תודה שבחרת ב-Nehoray Leizer.<br>
              אנו ניצור איתך קשר בהקדם לסיום תהליך התשלום ואישור ההזמנה הסופי.
            </p>

            <!-- Divider -->
            <div style="height:1px;background:#E8E5E0;margin-bottom:28px;"></div>

            <!-- Items table -->
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">פרטי ההזמנה</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E5E0;">
              <thead>
                <tr>
                  <th style="padding:10px 0;width:56px;"></th>
                  <th style="padding:10px 0 10px 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B6560;text-align:right;font-family:Arial,sans-serif;font-weight:400;">מוצר</th>
                  <th style="padding:10px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B6560;text-align:center;font-family:Arial,sans-serif;font-weight:400;">פרטים</th>
                  <th style="padding:10px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B6560;text-align:center;font-family:Arial,sans-serif;font-weight:400;">כמות</th>
                  <th style="padding:10px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B6560;text-align:left;font-family:Arial,sans-serif;font-weight:400;">מחיר</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              ${order.discountAmount > 0 ? `
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6B6560;font-family:Arial,sans-serif;">הנחה${order.discountCode ? ` (${order.discountCode})` : ''}</td>
                <td style="padding:6px 0;font-size:13px;color:#16a34a;text-align:left;font-family:Arial,sans-serif;">-${formatPrice(order.discountAmount)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:16px 0 0;font-size:15px;color:#1A1A1A;font-weight:600;border-top:1px solid #E8E5E0;font-family:Arial,sans-serif;">סה"כ לתשלום</td>
                <td style="padding:16px 0 0;font-size:20px;color:#1A1A1A;text-align:left;border-top:1px solid #E8E5E0;font-family:Georgia,serif;">${formatPrice(order.total)}</td>
              </tr>
            </table>

            <!-- Payment note -->
            <div style="margin-top:32px;padding:20px 24px;background:#FAFAF8;border-right:3px solid #1A1A1A;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-family:Arial,sans-serif;">שלב הבא — תשלום</p>
              <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.8;font-family:Arial,sans-serif;">
                לאחר אישור ההזמנה נפנה אליך לתשלום דרך Bit, העברה בנקאית או כל אמצעי נוח לך.<br>
                רק לאחר קבלת התשלום תיכנס ההזמנה לייצור.
              </p>
            </div>

          </td>
        </tr>

        <!-- Policy section -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="border-top:1px solid #E8E5E0;padding-top:24px;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">מדיניות ותנאים</p>
              <p style="margin:0 0 8px;font-size:12px;color:#6B6560;line-height:1.8;font-family:Arial,sans-serif;">
                <strong style="color:#1A1A1A;">ביטול עסקה:</strong> ניתן לבטל את ההזמנה עד 24 שעות לאחר ביצוע התשלום בפועל. לאחר מכן, בשל כך שהמוצרים מיוצרים לפי הזמנה אישית, לא ניתן לבטל ולא יינתן החזר כספי.
              </p>
              <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.8;font-family:Arial,sans-serif;">
                <strong style="color:#1A1A1A;">זמני אספקה:</strong> זמן הייצור והאספקה נקבע בהתאם ללוחות הזמנים של המפעל והיצרן. נעדכן אותך לגבי מועד האספקה הצפוי לאחר אישור התשלום. Nehoray Leizer אינה אחראית לעיכובים הנובעים מגורמי ייצור וספקים חיצוניים.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#F2F0EC;text-align:center;border-top:1px solid #E8E5E0;">
            <p style="margin:0 0 4px;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">
              Nehoray Leizer
            </p>
            <p style="margin:0 0 4px;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;">
              <a href="https://nehorayleizer.com" style="color:#6B6560;text-decoration:none;">nehorayleizer.com</a>
              &nbsp;·&nbsp; לכבוד זכרו של נהוראי ליזר
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#9B958F;font-family:Arial,sans-serif;">
              קיבלת אימייל זה כי ביצעת הזמנה באתר Nehoray Leizer. לפניות: <a href="mailto:orders@nehorayleizer.com" style="color:#9B958F;text-decoration:none;">orders@nehorayleizer.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const { form, items, total, discountCode, discountAmount } = await req.json()

    if (!form.name || !form.phone || !form.email) {
      return NextResponse.json({ error: 'שם, טלפון ואימייל הם שדות חובה' }, { status: 400 })
    }

    const orderItems = items.map((i: any) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.product.sale_price || i.product.price,
      image: i.product.images?.[0] || null,
    }))

    const { error: dbError } = await getServiceClient().from('orders').insert({
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email,
      customer_address: form.address,
      items: orderItems,
      total: total - discountAmount,
      discount_code: discountCode || null,
      discount_amount: discountAmount,
      notes: form.notes,
      status: 'received',
    })

    if (dbError) throw dbError

    // Send emails (non-blocking — don't fail the order if email fails)
    try {
      const logoUrl = await getLogoUrl()
      const finalTotal = total - discountAmount

      // 1. Confirmation to customer
      await resend.emails.send({
        from: 'Nehoray Leizer <orders@nehorayleizer.com>',
        to: form.email,
        subject: `אישור הזמנה התקבלה — Nehoray Leizer`,
        html: orderConfirmationEmail({
          customerName: form.name, logoUrl,
          items: orderItems, total: finalTotal,
          discountAmount, discountCode,
        }),
      })

      // 2. Admin notification
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        const itemsAdminHtml = orderItems.map((i: any) =>
          `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #E8E5E0;vertical-align:middle;width:48px;">
              ${i.image ? `<img src="${i.image}" alt="${i.product_name}" style="width:48px;height:48px;object-fit:cover;display:block;" />` : `<div style="width:48px;height:48px;background:#F2F0EC;"></div>`}
            </td>
            <td style="padding:10px 8px;border-bottom:1px solid #E8E5E0;font-size:14px;color:#1A1A1A;font-family:Arial,sans-serif;vertical-align:middle;">${i.product_name}</td>
            <td style="padding:10px 0;border-bottom:1px solid #E8E5E0;font-size:13px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;vertical-align:middle;">${[i.size, i.color].filter(Boolean).join(' / ') || '—'}</td>
            <td style="padding:10px 0;border-bottom:1px solid #E8E5E0;font-size:13px;color:#6B6560;text-align:center;font-family:Arial,sans-serif;vertical-align:middle;">×${i.quantity}</td>
            <td style="padding:10px 0;border-bottom:1px solid #E8E5E0;font-size:14px;color:#1A1A1A;text-align:left;font-family:Georgia,serif;vertical-align:middle;">${formatPrice(i.price * i.quantity)}</td>
          </tr>`
        ).join('')
        await resend.emails.send({
          from: 'Nehoray Leizer <orders@nehorayleizer.com>',
          to: adminEmail,
          subject: `🛍️ הזמנה חדשה — ${form.name} — ${formatPrice(finalTotal)}`,
          html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:32px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E5E0;max-width:560px;width:100%;">
        <tr>
          <td style="padding:28px 32px;text-align:center;border-bottom:1px solid #E8E5E0;background:#ffffff !important;">
            <img src="${logoUrl}" alt="Nehoray Leizer" style="max-height:60px;max-width:200px;width:auto;object-fit:contain;background:#ffffff;" />
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">הזמנה חדשה</p>
            <h2 style="margin:0 0 20px;font-size:22px;color:#1A1A1A;font-family:Georgia,serif;font-weight:400;">${form.name}</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:3px 0;font-size:13px;color:#6B6560;font-family:Arial,sans-serif;"><strong style="color:#1A1A1A;">טלפון:</strong> ${form.phone}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;color:#6B6560;font-family:Arial,sans-serif;"><strong style="color:#1A1A1A;">אימייל:</strong> ${form.email}</td></tr>
              ${form.address ? `<tr><td style="padding:3px 0;font-size:13px;color:#6B6560;font-family:Arial,sans-serif;"><strong style="color:#1A1A1A;">כתובת:</strong> ${form.address}</td></tr>` : ''}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <div style="height:1px;background:#E8E5E0;margin:20px 0 16px;"></div>
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">פריטים</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E5E0;">
              ${itemsAdminHtml}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              ${discountAmount > 0 ? `<tr><td style="padding:4px 0;font-size:13px;color:#16a34a;font-family:Arial,sans-serif;">הנחה${discountCode ? ` (${discountCode})` : ''}</td><td style="padding:4px 0;font-size:13px;color:#16a34a;text-align:left;font-family:Arial,sans-serif;">-${formatPrice(discountAmount)}</td></tr>` : ''}
              <tr>
                <td style="padding:12px 0 0;font-size:16px;color:#1A1A1A;font-weight:700;border-top:1px solid #E8E5E0;font-family:Arial,sans-serif;">סה"כ</td>
                <td style="padding:12px 0 0;font-size:20px;color:#1A1A1A;text-align:left;border-top:1px solid #E8E5E0;font-family:Georgia,serif;">${formatPrice(finalTotal)}</td>
              </tr>
            </table>
            ${form.notes ? `<p style="margin:16px 0 0;font-size:13px;color:#6B6560;font-style:italic;font-family:Arial,sans-serif;">הערות: ${form.notes}</p>` : ''}
            <a href="https://nehorayleizer.com/admin/orders" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#1A1A1A;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">לניהול הזמנות</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#F2F0EC;text-align:center;border-top:1px solid #E8E5E0;">
            <p style="margin:0;font-size:10px;color:#9B958F;font-family:Arial,sans-serif;letter-spacing:1px;">Nehoray Leizer Admin Notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'שגיאה בשליחת ההזמנה' }, { status: 500 })
  }
}
