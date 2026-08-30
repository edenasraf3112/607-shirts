import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

const KEYS = ['admin_bit_phone', 'admin_bit_link', 'admin_bank_details']

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data } = await getServiceClient()
      .from('site_content')
      .select('key, value')
      .in('key', KEYS)
    const map: Record<string, string> = {}
    for (const row of data || []) map[row.key] = row.value
    return NextResponse.json({
      bitPhone: map['admin_bit_phone'] || '',
      bitLink: map['admin_bit_link'] || '',
      bankDetails: map['admin_bank_details'] ? JSON.parse(map['admin_bank_details']) : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const db = getServiceClient()
    const updates = []
    if ('bitPhone' in body)
      updates.push(db.from('site_content').upsert({ key: 'admin_bit_phone', value: body.bitPhone, updated_at: new Date().toISOString() }, { onConflict: 'key' }).then())
    if ('bitLink' in body)
      updates.push(db.from('site_content').upsert({ key: 'admin_bit_link', value: body.bitLink, updated_at: new Date().toISOString() }, { onConflict: 'key' }).then())
    if ('bankDetails' in body)
      updates.push(db.from('site_content').upsert({ key: 'admin_bank_details', value: JSON.stringify(body.bankDetails), updated_at: new Date().toISOString() }, { onConflict: 'key' }).then())
    await Promise.all(updates)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
