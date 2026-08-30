import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'under_construction')
      .single()
    if (error || !data?.value) return NextResponse.json({})
    return NextResponse.json(JSON.parse(data.value))
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const state = await req.json()
    const { error } = await getServiceClient()
      .from('site_content')
      .upsert(
        { key: 'under_construction', value: JSON.stringify(state), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}
