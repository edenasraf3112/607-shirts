import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { DEMO_EMAIL } from '@/lib/demo'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

export type ProductionRow = {
  product_name: string
  color: string
  size: string
  quantity: number
}

async function queryOrders(
  filter: string,
  collectionId?: string | null,
  product?: string | null,
  dateFrom?: string | null,
  dateTo?: string | null,
  excludeDemo?: boolean,
) {
  const db = getServiceClient()

  // Always select * to avoid missing-column failures
  let q = db.from('orders').select('*').order('created_at', { ascending: false })

  // Soft-delete filter with fallback if column doesn't exist
  try {
    const test = await db.from('orders').select('deleted_at').limit(0)
    if (!test.error) q = q.is('deleted_at', null)
  } catch {}

  // "Paid" = paid_at IS NOT NULL (the payment checkbox), NOT status
  if (filter === 'paid' || filter === 'all_paid') {
    try {
      const test = await db.from('orders').select('paid_at').limit(0)
      if (!test.error) {
        q = q.not('paid_at', 'is', null)
      } else {
        // paid_at column missing — fall back to status
        q = q.in('status', ['paid', 'production', 'packing', 'shipped', 'delivered'])
      }
    } catch {
      q = q.in('status', ['paid', 'production', 'packing', 'shipped', 'delivered'])
    }
  }

  if (filter === 'collection' && collectionId) q = q.eq('collection_id', collectionId)
  if (filter === 'date_range') {
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59.999Z')
  }

  if (excludeDemo) q = q.neq('customer_email', DEMO_EMAIL)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

function aggregateOrders(orders: any[], productFilter?: string | null): ProductionRow[] {
  const map = new Map<string, ProductionRow>()

  for (const order of orders) {
    const rawItems = order.items
    if (!rawItems) continue

    const items: any[] = Array.isArray(rawItems)
      ? rawItems
      : (() => { try { return JSON.parse(String(rawItems)) } catch { return [] } })()

    for (const item of items) {
      const name = (
        item.product_name ?? item.name ?? item.productName ?? item.title ?? ''
      ).toString().trim()
      if (!name) continue

      // Product name filter (partial match, case-insensitive)
      if (productFilter && !name.toLowerCase().includes(productFilter.toLowerCase())) continue

      const color = (item.color ?? item.colour ?? '').toString().trim()
      const size = (item.size ?? item.variant ?? '').toString().trim()
      const qty = Math.max(Number(item.quantity ?? item.qty ?? 1), 1)
      const key = `${name}§${color}§${size}`

      const existing = map.get(key)
      if (existing) {
        existing.quantity += qty
      } else {
        map.set(key, { product_name: name, color, size, quantity: qty })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.product_name !== b.product_name) return a.product_name.localeCompare(b.product_name, 'he')
    if (a.color !== b.color) return a.color.localeCompare(b.color, 'he')
    const ai = SIZE_ORDER.indexOf(a.size.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.size.toUpperCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    return a.size.localeCompare(b.size)
  })
}

export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'all'
  const collectionId = url.searchParams.get('collection_id')
  const product = url.searchParams.get('product')
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')
  const excludeDemo = url.searchParams.get('exclude_demo') === 'true'

  try {
    const orders = await queryOrders(filter, collectionId, product, dateFrom, dateTo, excludeDemo)
    const rows = aggregateOrders(orders, filter === 'product' ? product : null)
    const totalQty = rows.reduce((s, r) => s + r.quantity, 0)
    return NextResponse.json({
      rows,
      totalQty,
      orderCount: orders.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
