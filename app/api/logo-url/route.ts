import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const revalidate = 0

export async function GET() {
  try {
    const { data } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'logo_url')
      .single()

    if (data?.value) {
      return NextResponse.json({ url: data.value })
    }
  } catch {}

  return NextResponse.json({ url: '/assets/branding/brand-logo.png' })
}
