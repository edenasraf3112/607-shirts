import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { popup_id, email, name, phone, page_url } = body
    if (!popup_id || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { error } = await supabase.from('popup_submissions').insert({ popup_id, email, name, phone, page_url })
    if (error) throw error

    // Confirmation email to subscriber (non-blocking)
    try {
      await resend.emails.send({
        from: 'Nehoray Leizer <orders@nehorayleizer.com>',
        to: email,
        subject: 'נרשמת לרשימת הממתינים — Nehoray Leizer',
        html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:48px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1A1A1A;max-width:520px;width:100%;">
        <tr>
          <td style="padding:48px 40px 40px;text-align:center;">
            <img src="https://nehorayleizer.com/assets/branding/brand-logo.png" alt="Nehoray Leizer" style="max-height:64px;max-width:200px;width:auto;filter:invert(1);" />
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 40px;text-align:center;">
            <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#FAFAF8;font-family:Georgia,serif;line-height:1.3;">
              ${name ? `שלום ${name},` : 'שלום,'}
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#C8C0B4;line-height:1.8;font-family:Arial,sans-serif;">
              נרשמת בהצלחה לרשימת הממתינים<br>לקולקציה הראשונה של Nehoray Leizer.
            </p>
            <div style="height:1px;background:rgba(255,255,255,0.15);margin-bottom:24px;"></div>
            <p style="margin:0 0 24px;font-size:13px;color:#C8C0B4;line-height:1.8;font-family:Arial,sans-serif;">
              ברגע שההזמנות ייפתחו — תהיה מהראשונים לדעת.<br>
              כל חולצה מיוצרת במיוחד בעבורך לפי ההזמנה.
            </p>
            <p style="margin:0;font-size:12px;color:#6B6560;font-family:Arial,sans-serif;font-style:italic;">
              07.07 — 16.07
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#111;text-align:center;">
            <p style="margin:0;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">
              Nehoray Leizer &nbsp;·&nbsp; <a href="https://nehorayleizer.com" style="color:#6B6560;text-decoration:none;">nehorayleizer.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })
    } catch (emailErr) {
      console.error('Waitlist confirmation email failed:', emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
