import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

async function getRecipients(group: string, collectionId?: string): Promise<{ email: string; name?: string }[]> {
  const db = getServiceClient()
  const PAID = ['paid', 'production', 'packing', 'shipped', 'delivered']

  if (group === 'waitlist') {
    const { data } = await db
      .from('popup_submissions')
      .select('email,name')
      .not('email', 'is', null)
    return (data || []).filter(r => r.email)
  }

  if (group === 'all_customers') {
    const { data } = await db
      .from('orders')
      .select('customer_email,customer_name')
      .is('deleted_at', null)
      .not('customer_email', 'is', null)
    return (data || []).map(o => ({ email: o.customer_email!, name: o.customer_name }))
  }

  if (group === 'pending_payment') {
    const { data } = await db
      .from('orders')
      .select('customer_email,customer_name')
      .is('deleted_at', null)
      .in('status', ['received', 'pending_payment'])
      .not('customer_email', 'is', null)
    return (data || []).map(o => ({ email: o.customer_email!, name: o.customer_name }))
  }

  if (group === 'paid') {
    const { data } = await db
      .from('orders')
      .select('customer_email,customer_name')
      .is('deleted_at', null)
      .in('status', PAID)
      .not('customer_email', 'is', null)
    return (data || []).map(o => ({ email: o.customer_email!, name: o.customer_name }))
  }

  if (group === 'by_collection' && collectionId) {
    const { data } = await db
      .from('orders')
      .select('customer_email,customer_name')
      .is('deleted_at', null)
      .eq('collection_id', collectionId)
      .not('customer_email', 'is', null)
    return (data || []).map(o => ({ email: o.customer_email!, name: o.customer_name }))
  }

  return []
}

function buildEmailHtml(subject: string, body: string, recipientName?: string): string {
  const greeting = recipientName ? `שלום ${recipientName},` : 'שלום,'
  const bodyHtml = body
    .split('\n')
    .map(line => line.trim() ? `<p style="margin:0 0 12px;font-size:14px;color:#1A1A1A;line-height:1.7;font-family:Arial,sans-serif;">${line}</p>` : '<br/>')
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:48px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E5E0;max-width:600px;width:100%;">
        <tr>
          <td style="padding:32px 40px;border-bottom:1px solid #E8E5E0;text-align:center;background:#ffffff;">
            <img src="https://nehorayleizer.com/assets/branding/brand-logo.png" alt="Nehoray Leizer" style="max-height:64px;max-width:200px;width:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:14px;color:#1A1A1A;font-family:Arial,sans-serif;">${greeting}</p>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#F2F0EC;text-align:center;border-top:1px solid #E8E5E0;">
            <p style="margin:0 0 4px;font-size:11px;color:#6B6560;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">Nehoray Leizer</p>
            <p style="margin:0;font-size:11px;color:#9B958F;font-family:Arial,sans-serif;">
              <a href="https://nehorayleizer.com" style="color:#9B958F;text-decoration:none;">nehorayleizer.com</a>
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
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { group, collection_id, subject, body } = await req.json()
  if (!group || !subject || !body) {
    return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 })
  }

  try {
    const raw = await getRecipients(group, collection_id)
    // Deduplicate by email
    const seen = new Set<string>()
    const recipients = raw.filter(r => {
      const key = r.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, total: 0, message: 'אין נמענים בקבוצה זו' })
    }

    let sent = 0
    let failed = 0

    // Send in batches of 10 to avoid rate limits
    const BATCH = 10
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH)
      await Promise.allSettled(
        batch.map(async r => {
          try {
            await resend.emails.send({
              from: 'Nehoray Leizer <orders@nehorayleizer.com>',
              to: r.email,
              subject,
              html: buildEmailHtml(subject, body, r.name),
            })
            sent++
          } catch {
            failed++
          }
        })
      )
      // Small delay between batches
      if (i + BATCH < recipients.length) await new Promise(res => setTimeout(res, 300))
    }

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const group = url.searchParams.get('group') || ''
  const collectionId = url.searchParams.get('collection_id') || undefined

  try {
    const raw = await getRecipients(group, collectionId)
    const seen = new Set<string>()
    const recipients = raw.filter(r => {
      const key = r.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return NextResponse.json({ count: recipients.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
