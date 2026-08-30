import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '@/lib/supabase'
import { getOrCreatePickupNumber } from '@/lib/pickupNumbers'
import { customerGroupKey } from '@/lib/customerGroups'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  let order: { customer_phone: string; customer_email: string; customer_name: string } | null = null
  const withUserId = await db
    .from('orders')
    .select('customer_phone, customer_email, customer_name')
    .or(`user_id.eq.${user.id},customer_email.ilike.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!withUserId.error) {
    order = withUserId.data
  } else {
    // orders.user_id may not exist yet if the SQL migration hasn't run — fall back to email only.
    const { data } = await db
      .from('orders')
      .select('customer_phone, customer_email, customer_name')
      .ilike('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    order = data
  }

  if (!order) return NextResponse.json({ pickupNumber: null })

  try {
    const pickupNumber = await getOrCreatePickupNumber(customerGroupKey(order), order.customer_name)
    return NextResponse.json({ pickupNumber })
  } catch {
    return NextResponse.json({ pickupNumber: null })
  }
}
