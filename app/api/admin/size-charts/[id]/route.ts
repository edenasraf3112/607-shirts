import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'
import { validateForSave, validateForPublish } from '@/lib/sizeChartValidation'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await getServiceClient().from('size_charts').select('*').eq('id', params.id).single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const fields = { internal_name: body.internal_name || '', title: body.title || '' }
    const validationError = body.status === 'published'
      ? validateForPublish(fields, body.data)
      : validateForSave(fields, body.data)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const db = getServiceClient()
    const { error } = await db.from('size_charts').update({
      internal_name: body.internal_name,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      unit: body.unit || 'cm',
      status: body.status || 'draft',
      data: body.data,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id)
    if (error) throw error

    await db.from('size_chart_versions').insert({ size_chart_id: params.id, data: body.data })
    // best-effort trim — keep only the 20 most recent versions per chart
    const { data: oldVersions } = await db
      .from('size_chart_versions')
      .select('id')
      .eq('size_chart_id', params.id)
      .order('created_at', { ascending: false })
      .range(20, 1000)
    if (oldVersions?.length) {
      await db.from('size_chart_versions').delete().in('id', oldVersions.map(v => v.id))
    }

    await logActivity(db, 'update_size_chart', 'size_chart', params.id, { title: body.title })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const { error } = await db.from('size_charts').delete().eq('id', params.id)
    if (error) throw error
    await logActivity(db, 'delete_size_chart', 'size_chart', params.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 })
  }
}
