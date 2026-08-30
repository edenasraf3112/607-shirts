import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  try {
    const { error } = await getServiceClient()
      .from('admin_activity_log')
      .insert({
        action: body.action,
        entity_type: body.entity_type || null,
        entity_id: body.entity_id || null,
        details: body.details || {},
      })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Silently fail — table may not be created yet
    return NextResponse.json({ ok: false, error: err?.message })
  }
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await getServiceClient()
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return NextResponse.json({ logs: data || [] })
  } catch (err: any) {
    return NextResponse.json({ logs: [], error: err?.message })
  }
}
