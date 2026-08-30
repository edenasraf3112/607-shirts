import { getServiceClient } from './supabase'
import { customerGroupKey, type CustomerGroup } from './customerGroups'

// Persistent, once-assigned pickup number per customer (keyed the same way as
// label grouping — see customerGroupKey). Whichever happens first — a payment
// confirmation email or a label print — assigns the number; everything after
// that reuses it, so the number on the shelf always matches the number a
// customer was told to save.
export async function getOrCreatePickupNumber(customerKey: string, customerName: string): Promise<number> {
  const db = getServiceClient()

  const { data: existing } = await db
    .from('customer_pickup_numbers')
    .select('pickup_number')
    .eq('customer_key', customerKey)
    .maybeSingle()
  if (existing) return existing.pickup_number

  const { data: inserted, error } = await db
    .from('customer_pickup_numbers')
    .insert({ customer_key: customerKey, customer_name: customerName })
    .select('pickup_number')
    .single()
  if (inserted) return inserted.pickup_number

  // Someone else assigned it concurrently (unique constraint) — read what they got.
  const { data: retry } = await db
    .from('customer_pickup_numbers')
    .select('pickup_number')
    .eq('customer_key', customerKey)
    .maybeSingle()
  if (retry) return retry.pickup_number

  throw error
}

// Best-effort: if customer_pickup_numbers hasn't been created yet (see the
// migration in CLAUDE.md), keep the ephemeral index rather than crash the
// whole labels page — same "not set up yet" tolerance as logActivity().
export async function attachPickupNumbers(groups: CustomerGroup[]): Promise<void> {
  for (const g of groups) {
    try {
      g.number = await getOrCreatePickupNumber(g.key, g.customer_name)
    } catch {}
  }
}

export { customerGroupKey }
