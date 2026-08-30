import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getServiceClient()
    .from('sticker_flag_files')
    .select('*')
    .order('display_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ files: data })
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await req.json()
  const { error } = await getServiceClient().from('sticker_flag_files').insert(payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...payload } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await getServiceClient().from('sticker_flag_files').update(payload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await getServiceClient().from('sticker_flag_files').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
