import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  try {
    const { error } = await getServiceClient().from('admin_tasks').insert({ text, done: false })
    if (error) throw error
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
    const { error } = await getServiceClient().from('admin_tasks').update(payload).eq('id', id)
    if (error) throw error
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
    const { error } = await getServiceClient().from('admin_tasks').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 })
  }
}
