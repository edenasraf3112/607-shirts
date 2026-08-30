import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const { data: original, error: fetchError } = await db.from('size_charts').select('*').eq('id', params.id).single()
    if (fetchError || !original) throw fetchError || new Error('לא נמצא')

    const { data: copy, error } = await db.from('size_charts').insert({
      internal_name: `${original.internal_name} (עותק)`,
      title: `${original.title} (עותק)`,
      description: original.description,
      category: original.category,
      unit: original.unit,
      status: 'draft',
      data: original.data,
    }).select('id').single()
    if (error) throw error

    await db.from('size_chart_versions').insert({ size_chart_id: copy.id, data: original.data })
    await logActivity(db, 'duplicate_size_chart', 'size_chart', copy.id, { from: params.id })
    return NextResponse.json({ ok: true, id: copy.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to duplicate' }, { status: 500 })
  }
}
