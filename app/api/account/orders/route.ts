import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  let orders: any[] = []
  const withUserId = await db
    .from('orders')
    .select('*')
    .or(`user_id.eq.${user.id},customer_email.ilike.${user.email}`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!withUserId.error) {
    orders = withUserId.data || []
  } else {
    // orders.user_id may not exist yet if the SQL migration hasn't run — fall back to email only.
    const { data } = await db
      .from('orders')
      .select('*')
      .ilike('customer_email', user.email)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    orders = data || []
  }

  const collectionIds = Array.from(new Set(orders.map(o => o.collection_id).filter(Boolean)))
  let collections: any[] = []
  if (collectionIds.length > 0) {
    const { data } = await db
      .from('collections')
      .select('id,name,status,estimated_delivery,progress_steps')
      .in('id', collectionIds)
    collections = data || []
  }

  return NextResponse.json({ orders, collections })
}
