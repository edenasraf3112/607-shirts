import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const body = await req.json()
    const { error } = await getServiceClient()
      .from('products')
      .update({ in_stock: body.in_stock })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const db = getServiceClient()
    const { data: product } = await db.from('products').select('images').eq('id', id).single()
    if (product?.images?.length) {
      const paths = product.images.map((url: string) => {
        const parts = url.split('/products/')
        return parts[1] || ''
      }).filter(Boolean)
      if (paths.length) await db.storage.from('products').remove(paths)
    }
    const { error } = await db.from('products').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 })
  }
}
