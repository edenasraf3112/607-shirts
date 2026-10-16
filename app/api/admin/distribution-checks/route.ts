import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

async function tableExists(): Promise<boolean> {
  try {
    const test = await getServiceClient().from('distribution_checks').select('id').limit(0)
    return !test.error
  } catch {
    return false
  }
}

export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const productId = url.searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id נדרש' }, { status: 400 })

  if (!(await tableExists())) {
    return NextResponse.json({ keys: [], missingTable: true })
  }

  try {
    const { data, error } = await getServiceClient()
      .from('distribution_checks')
      .select('check_key')
      .like('check_key', `${productId}:%`)
    if (error) throw error
    return NextResponse.json({ keys: (data || []).map(r => r.check_key) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await tableExists())) {
    return NextResponse.json({ error: 'הטבלה distribution_checks עדיין לא נוצרה — צריך להריץ את ה-SQL', missingTable: true }, { status: 409 })
  }

  try {
    const { key, checked } = await req.json()
    if (!key) return NextResponse.json({ error: 'key נדרש' }, { status: 400 })

    const db = getServiceClient()
    if (checked) {
      const { error } = await db.from('distribution_checks').upsert(
        { check_key: key, checked_at: new Date().toISOString() },
        { onConflict: 'check_key' }
      )
      if (error) throw error
    } else {
      const { error } = await db.from('distribution_checks').delete().eq('check_key', key)
      if (error) throw error
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
