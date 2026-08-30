import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const phone = new URL(req.url).searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 })
  try {
    const { data } = await getServiceClient()
      .from('customer_profiles')
      .select('*')
      .eq('phone', phone)
      .single()
    return NextResponse.json({ profile: data || null })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { phone, admin_notes, admin_tags } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 })
  try {
    const { error } = await getServiceClient()
      .from('customer_profiles')
      .upsert({ phone, admin_notes, admin_tags, updated_at: new Date().toISOString() })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
