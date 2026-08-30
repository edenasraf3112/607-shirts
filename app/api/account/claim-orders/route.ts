import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '@/lib/supabase'
import { normalizePhone } from '@/lib/customerGroups'

// Links pre-existing guest orders (placed at checkout, no account) to a
// customer's account once they sign up/log in — matched by email
// (case-insensitive, since orders were entered free-text at checkout) or
// phone. Idempotent: only claims orders that don't already have a user_id.
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  let phone: string | null = null
  try {
    const { data: profile } = await db
      .from('user_profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle()
    phone = profile?.phone ? normalizePhone(profile.phone) : null
  } catch {}

  try {
    let query = db
      .from('orders')
      .select('id, customer_phone, customer_email')
      .is('user_id', null)

    query = phone
      ? query.or(`customer_email.ilike.${user.email},customer_phone.eq.${phone}`)
      : query.ilike('customer_email', user.email)

    const { data: matches, error } = await query
    if (error) throw error
    if (!matches || matches.length === 0) return NextResponse.json({ claimed: 0 })

    const ids = matches.map(o => o.id)
    const { error: updateErr } = await db.from('orders').update({ user_id: user.id }).in('id', ids)
    if (updateErr) throw updateErr

    return NextResponse.json({ claimed: ids.length })
  } catch (err: any) {
    // Best-effort — orders.user_id may not exist yet if the SQL migration hasn't run.
    return NextResponse.json({ claimed: 0, error: err?.message })
  }
}
