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
    const { data: original, error: fetchErr } = await db.from('products').select('*').eq('id', params.id).single()
    if (fetchErr || !original) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const { id: _id, created_at: _ca, ...rest } = original
    const copy = {
      ...rest,
      name: `עותק של ${original.name}`,
      in_stock: false,
      display_order: (original.display_order || 0) + 1,
    }

    const { data: inserted, error: insertErr } = await db.from('products').insert(copy).select('id').single()
    if (insertErr) throw insertErr
    return NextResponse.json({ ok: true, id: inserted?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
