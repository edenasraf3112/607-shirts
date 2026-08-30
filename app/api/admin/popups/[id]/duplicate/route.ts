import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const { data: orig, error: fetchErr } = await db.from('popups').select('*').eq('id', params.id).single()
    if (fetchErr || !orig) throw fetchErr || new Error('Not found')
    const { id, created_at, updated_at, ...rest } = orig
    const { data, error } = await db
      .from('popups')
      .insert({ ...rest, title: `${orig.title} (עותק)`, is_active: false, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
