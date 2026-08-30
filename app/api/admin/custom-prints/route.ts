import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getServiceClient()
    .from('custom_print_submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data })
}

export async function PATCH(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  const allowed = ['pending', 'approved', 'rejected']
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const { error } = await getServiceClient()
    .from('custom_print_submissions')
    .update({ status })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
