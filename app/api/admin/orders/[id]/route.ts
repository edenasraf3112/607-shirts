import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = params
  const body = await req.json()
  try {
    const db = getServiceClient()
    const { error } = await db.from('orders').update(body).eq('id', id)
    if (error) throw error
    if (body.status) {
      try {
        await db.from('order_status_history').insert({ order_id: id, status: body.status })
      } catch { /* table may not exist yet */ }
    }
    try { await logActivity(db, 'update_order', 'order', id, body) } catch {}

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = params
  const url = new URL(req.url)
  const permanent = url.searchParams.get('permanent') === '1'
  try {
    const db = getServiceClient()
    if (permanent) {
      const { error } = await db.from('orders').delete().eq('id', id)
      if (error) throw error
      await logActivity(db, 'delete_order_permanent', 'order', id)
    } else {
      const { error } = await db.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      await logActivity(db, 'trash_order', 'order', id)
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
