import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'
import { validateForSave, validateForPublish } from '@/lib/sizeChartValidation'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = getServiceClient()
    const [{ data: charts, error }, { data: products }] = await Promise.all([
      db.from('size_charts').select('*').order('updated_at', { ascending: false }),
      db.from('products').select('size_chart_id'),
    ])
    if (error) throw error
    const counts: Record<string, number> = {}
    for (const p of products || []) {
      if (p.size_chart_id) counts[p.size_chart_id] = (counts[p.size_chart_id] || 0) + 1
    }
    const data = (charts || []).map(c => ({ ...c, product_count: counts[c.id] || 0 }))
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const fields = { internal_name: body.internal_name || '', title: body.title || '' }
    const validationError = body.status === 'published'
      ? validateForPublish(fields, body.data)
      : validateForSave(fields, body.data)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const db = getServiceClient()
    const { data, error } = await db.from('size_charts').insert({
      internal_name: body.internal_name,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      unit: body.unit || 'cm',
      status: body.status || 'draft',
      data: body.data,
    }).select('id').single()
    if (error) throw error

    await db.from('size_chart_versions').insert({ size_chart_id: data.id, data: body.data })
    await logActivity(db, 'create_size_chart', 'size_chart', data.id, { title: body.title })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}
