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
      .select('id, customer_name, customer_phone, customer_email, customer_address, notes, delivery_method, items, total, status, created_at, paid_at')
      .is('deleted_at', null)
      .order('paid_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ orders: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
