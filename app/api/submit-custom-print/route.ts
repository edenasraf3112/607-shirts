import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp',
  'application/pdf',
]

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const widthStr = formData.get('width') as string
    const heightStr = formData.get('height') as string
    const print_type = formData.get('print_type') as string
    const notes = formData.get('notes') as string

    if (!file || !name || !print_type) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'הקובץ גדול מדי — מקסימום 20MB' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'סוג קובץ לא נתמך — PNG, JPG, SVG, PDF בלבד' }, { status: 400 })
    }

    const db = getServiceClient()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `submissions/${Date.now()}-${safeName}`

    const { error: uploadError } = await db.storage
      .from('stickers-flags')
      .upload(path, buffer, { contentType: file.type })
    if (uploadError) throw uploadError

    const { data: urlData } = db.storage.from('stickers-flags').getPublicUrl(path)

    const { error: dbError } = await db.from('custom_print_submissions').insert({
      name,
      email: email || null,
      phone: phone || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      width_cm: widthStr ? parseFloat(widthStr) : null,
      height_cm: heightStr ? parseFloat(heightStr) : null,
      print_type,
      notes: notes || null,
      status: 'pending',
    })
    if (dbError) throw dbError

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'שגיאה בשליחה' }, { status: 500 })
  }
}
