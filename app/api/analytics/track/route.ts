import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const VALID_EVENTS = ['page_view', 'product_view', 'add_to_cart', 'checkout_start']

export async function POST(req: Request) {
  try {
    const { event_type, product_id, path, session_id } = await req.json()
    if (!VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }
    await getServiceClient().from('analytics_events').insert({
      event_type,
      product_id: product_id || null,
      path: path || null,
      session_id: session_id || null,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
