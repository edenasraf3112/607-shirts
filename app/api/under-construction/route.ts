import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'under_construction')
      .single()
    if (!data?.value) return NextResponse.json({})
    return NextResponse.json(JSON.parse(data.value))
  } catch {
    return NextResponse.json({})
  }
}
