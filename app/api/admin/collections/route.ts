import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { logActivity } from '@/lib/activityLog'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

async function syncProducts(db: ReturnType<typeof getServiceClient>, collectionId: string, selectedProducts: string[]) {
  const { data: current } = await db.from('products').select('id').eq('collection_id', collectionId)
  const previouslySelected = (current || []).map((p: any) => p.id)
  const toAdd = selectedProducts.filter(id => !previouslySelected.includes(id))
  const toRemove = previouslySelected.filter((id: string) => !selectedProducts.includes(id))
  if (toAdd.length) await db.from('products').update({ collection_id: collectionId }).in('id', toAdd)
  if (toRemove.length) await db.from('products').update({ collection_id: null }).in('id', toRemove)
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { selectedProducts = [], ...form } = await req.json()
  try {
    const db = getServiceClient()
    const { data, error } = await db.from('collections').insert(form).select('id').single()
    if (error) throw error
    if (data?.id) await syncProducts(db, data.id, selectedProducts)
    await logActivity(db, 'create_collection', 'collection', data?.id, { name: form.name })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, selectedProducts = [], ...form } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const db = getServiceClient()
    const { error } = await db.from('collections').update(form).eq('id', id)
    if (error) throw error
    await syncProducts(db, id, selectedProducts)
    await logActivity(db, 'update_collection', 'collection', id, { name: form.name })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}
