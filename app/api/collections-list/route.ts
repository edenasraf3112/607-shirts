import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const revalidate = 0

export async function GET() {
  try {
    const { data } = await getServiceClient()
      .from('collections')
      .select('id,name')
      .order('created_at', { ascending: false })
    return NextResponse.json({ collections: data || [] })
  } catch {
    return NextResponse.json({ collections: [] })
  }
}
