import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { product_id, email, name } = await req.json()
    if (!product_id || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const { error } = await getServiceClient()
      .from('product_notifications')
      .upsert({ product_id, email, name }, { onConflict: 'product_id,email' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
