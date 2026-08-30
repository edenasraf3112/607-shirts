import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  if (!url || typeof url !== 'string') return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    await getServiceClient().from('site_content').upsert(
      { key: 'logo_url', value: url, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // If Supabase isn't connected, return ok anyway — URL is returned to client
    return NextResponse.json({ ok: true, warning: 'Supabase not connected, URL not persisted' })
  }
}
