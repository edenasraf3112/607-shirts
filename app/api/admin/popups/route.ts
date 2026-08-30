import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await getServiceClient()
      .from('popups')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { error, data } = await getServiceClient()
      .from('popups')
      .insert({ ...body, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, bgImageSettings, ...rest } = body

    // If a background image was set via the form, merge it into popup_settings
    // without overwriting other settings (splitLayout, layout, blocks, etc.)
    let extraFields: Record<string, any> = {}
    if (bgImageSettings !== undefined) {
      const { data: curr } = await getServiceClient()
        .from('popups').select('popup_settings').eq('id', id).single()
      extraFields.popup_settings = {
        ...(curr?.popup_settings || {}),
        backgroundImage: bgImageSettings,
      }
    }

    const { error } = await getServiceClient()
      .from('popups')
      .update({ ...rest, ...extraFields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
