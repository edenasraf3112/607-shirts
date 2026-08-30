import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await req.json()
  try {
    const db = getServiceClient()
    const { data, error } = await db.from('discount_codes').insert(payload).select('id').single()
    if (error) throw error
    await logActivity(db, 'create_discount', 'discount_code', data?.id, { code: payload.code })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const db = getServiceClient()
    const { error } = await db.from('discount_codes').update(payload).eq('id', id)
    if (error) throw error
    await logActivity(db, 'update_discount', 'discount_code', id, payload)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const db = getServiceClient()
    const { error } = await db.from('discount_codes').delete().eq('id', id)
    if (error) throw error
    await logActivity(db, 'delete_discount', 'discount_code', id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 })
  }
}
