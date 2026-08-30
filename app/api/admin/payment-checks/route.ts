import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const [{ data: orders, error: ordersErr }, { data: checks, error: checksErr }] = await Promise.all([
      db.from('orders')
        .select('id,customer_name,customer_phone,customer_email,items,total,discount_amount,delivery_method,notes,status,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      db.from('payment_checks').select('*'),
    ])
    if (ordersErr) throw ordersErr
    // payment_checks table may not exist yet if the SQL migration hasn't been applied
    return NextResponse.json({ orders: orders || [], checks: checksErr ? [] : (checks || []) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

type IncomingCheck = {
  order_id: string
  status: string
  payment_method: string | null
  received_amount: number | null
  note: string
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const rows: IncomingCheck[] = body.checks || []
    if (rows.length === 0) return NextResponse.json({ ok: true, count: 0 })

    const db = getServiceClient()
    const orderIds = rows.map(r => r.order_id)
    const { data: existing, error: existingErr } = await db
      .from('payment_checks')
      .select('order_id,status,verified_at,verified_by')
      .in('order_id', orderIds)
    if (existingErr) throw existingErr

    const existingMap = new Map((existing || []).map(e => [e.order_id, e]))
    const now = new Date().toISOString()

    const upsertRows = rows.map(r => {
      const prev = existingMap.get(r.order_id)
      const wasChecked = prev && prev.status !== 'not_checked'
      const isChecked = r.status !== 'not_checked'
      let verified_at: string | null = null
      let verified_by: string | null = null
      if (isChecked) {
        if (wasChecked) {
          // stayed "checked" (even if the specific status value changed) — keep the original timestamp
          verified_at = prev!.verified_at
          verified_by = prev!.verified_by
        } else {
          verified_at = now
          verified_by = 'admin'
        }
      }
      return {
        order_id: r.order_id,
        status: r.status,
        payment_method: r.payment_method || null,
        received_amount: r.received_amount,
        note: r.note || null,
        verified_at,
        verified_by,
        updated_at: now,
      }
    })

    const { error: upsertErr } = await db.from('payment_checks').upsert(upsertRows, { onConflict: 'order_id' })
    if (upsertErr) throw upsertErr

    await logActivity(db, 'save_payment_checks', 'payment_check', null, { count: upsertRows.length })

    return NextResponse.json({ ok: true, count: upsertRows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const { error } = await db.from('payment_checks').delete().not('id', 'is', null)
    if (error) throw error
    await logActivity(db, 'reset_payment_checks', 'payment_check', null)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
