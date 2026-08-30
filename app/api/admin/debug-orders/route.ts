import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  // Try every possible query variant to find what works
  const results: Record<string, any> = {}

  // 1. Total order count (no filters)
  try {
    const { count, error } = await db.from('orders').select('*', { count: 'exact', head: true })
    results.total_orders = error ? `ERROR: ${error.message}` : count
  } catch (e: any) { results.total_orders = `EXCEPTION: ${e?.message}` }

  // 2. Orders without deleted_at filter
  try {
    const { data, error } = await db.from('orders').select('id, status, items, created_at').limit(3)
    results.sample_orders_no_filter = error
      ? `ERROR: ${error.message}`
      : (data || []).map(o => ({
          id: o.id?.slice(0, 8),
          status: o.status,
          items_type: typeof o.items,
          items_is_array: Array.isArray(o.items),
          items_length: Array.isArray(o.items) ? o.items.length : 'N/A',
          first_item_keys: Array.isArray(o.items) && o.items[0] ? Object.keys(o.items[0]) : [],
          first_item: Array.isArray(o.items) && o.items[0] ? o.items[0] : null,
        }))
  } catch (e: any) { results.sample_orders_no_filter = `EXCEPTION: ${e?.message}` }

  // 3. With deleted_at IS NULL
  try {
    const { data, error } = await db.from('orders').select('id, status').is('deleted_at', null).limit(5)
    results.orders_with_deleted_at_filter = error
      ? `ERROR: ${error.message}`
      : { count: data?.length, statuses: data?.map(o => o.status) }
  } catch (e: any) { results.orders_with_deleted_at_filter = `EXCEPTION: ${e?.message}` }

  // 4. Status distribution
  try {
    const { data, error } = await db.from('orders').select('status')
    if (!error && data) {
      const dist: Record<string, number> = {}
      data.forEach(o => { dist[o.status] = (dist[o.status] || 0) + 1 })
      results.status_distribution = dist
    } else {
      results.status_distribution = `ERROR: ${error?.message}`
    }
  } catch (e: any) { results.status_distribution = `EXCEPTION: ${e?.message}` }

  // 5. Check if deleted_at column exists
  try {
    const { error } = await db.from('orders').select('deleted_at').limit(1)
    results.deleted_at_column_exists = !error
    if (error) results.deleted_at_error = error.message
  } catch (e: any) { results.deleted_at_column_exists = `EXCEPTION: ${e?.message}` }

  return NextResponse.json(results, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}
