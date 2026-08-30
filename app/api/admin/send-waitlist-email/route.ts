import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { subject, bodyHtml, testOnly, testEmail } = await req.json()

    // Fetch all unique emails from popup_submissions
    const { data: submissions } = await getServiceClient()
      .from('popup_submissions')
      .select('email, name')
      .not('email', 'is', null)

    if (!submissions?.length) {
      return NextResponse.json({ ok: true, sent: 0, message: 'אין נרשמים' })
    }

    // Deduplicate by email
    const seen = new Set<string>()
    const recipients = submissions.filter(s => {
      if (!s.email || seen.has(s.email.toLowerCase())) return false
      seen.add(s.email.toLowerCase())
      return true
    })

    if (testOnly && testEmail) {
      // Send only to test email
      await resend.emails.send({
        from: 'Nehoray Leizer <orders@nehorayleizer.com>',
        to: testEmail,
        subject: `[בדיקה] ${subject}`,
        html: bodyHtml,
      })
      return NextResponse.json({ ok: true, sent: 1, message: `נשלח בדיקה ל-${testEmail}` })
    }

    // Batch send (Resend allows up to 100 per request via batch, or send individually)
    let sent = 0
    const errors: string[] = []
    for (const r of recipients) {
      try {
        await resend.emails.send({
          from: 'Nehoray Leizer <orders@nehorayleizer.com>',
          to: r.email,
          subject,
          html: bodyHtml.replace('{{name}}', r.name || ''),
        })
        sent++
      } catch (e: any) {
        errors.push(r.email)
      }
    }

    return NextResponse.json({ ok: true, sent, total: recipients.length, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
