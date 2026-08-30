export type GroupableOrder = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_address?: string
  total: number
  items: any[]
}

export type CustomerGroup = {
  key: string
  number: number
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_address: string
  orderIds: string[]
  items: any[]
  total: number
}

export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '')
}

// The same key used to decide "this is the same customer" everywhere — label
// grouping AND pickup-number assignment must agree on this or the number on
// a printed label could drift from the number promised in a customer email.
export function customerGroupKey(o: { customer_phone: string; customer_email?: string; customer_name: string }): string {
  return normalizePhone(o.customer_phone) || (o.customer_email || '').toLowerCase() || o.customer_name
}

// Groups orders placed by the same person (matched by phone, falling back to
// email/name) so a repeat customer gets one merged label instead of one per order.
export function groupOrdersByCustomer<T extends GroupableOrder>(orders: T[]): CustomerGroup[] {
  const groups = new Map<string, CustomerGroup>()
  for (const o of orders) {
    const key = customerGroupKey(o)
    let g = groups.get(key)
    if (!g) {
      g = {
        key,
        number: 0,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        customer_email: o.customer_email || '',
        customer_address: o.customer_address || '',
        orderIds: [],
        items: [],
        total: 0,
      }
      groups.set(key, g)
    }
    g.orderIds.push(o.id)
    g.total += o.total || 0
    for (const item of Array.isArray(o.items) ? o.items : []) {
      const existing = g.items.find((i: any) => i.product_name === item.product_name && i.size === item.size && i.color === item.color)
      if (existing) existing.quantity = (existing.quantity || 0) + (item.quantity || 0)
      else g.items.push({ ...item })
    }
  }
  // Placeholder ordinal — callers that print or email this number to a
  // customer must overwrite it with the persistent pickup number from
  // lib/pickupNumbers.ts instead, since this index shifts between calls.
  return Array.from(groups.values()).map((g, i) => ({ ...g, number: i + 1 }))
}
