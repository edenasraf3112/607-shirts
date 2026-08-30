import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await getServiceClient()
      .from('orders')
      .select('id, customer_name, customer_phone, customer_address, notes, items, total, delivery_method, status, paid_at')
      .eq('delivery_method', 'delivery')
      .is('deleted_at', null)
      .order('customer_name', { ascending: true })
    if (error) throw error
    return NextResponse.json({ orders: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
