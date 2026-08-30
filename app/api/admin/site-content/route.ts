import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entries } = await req.json()
  if (!Array.isArray(entries)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  try {
    const db = getServiceClient()
    const updates = entries.map((e: { key: string; value: string }) =>
      db.from('site_content').upsert(
        { key: e.key, value: e.value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    )
    await Promise.all(updates)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}
