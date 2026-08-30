import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  const session = cookies().get('admin_session')?.value
  return !!session
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `brand-logo.${ext}`
    const contentType = file.type || 'image/png'

    const db = getServiceClient()

    // Try Supabase Storage first
    try {
      const { error: uploadError } = await db.storage
        .from('branding')
        .upload(fileName, buffer, { upsert: true, contentType })

      if (!uploadError) {
        const { data: urlData } = db.storage.from('branding').getPublicUrl(fileName)
        const publicUrl = urlData.publicUrl

        await db.from('site_content').upsert(
          { key: 'logo_url', value: publicUrl, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

        return NextResponse.json({ url: publicUrl, storage: 'supabase' })
      }
    } catch {}

    // Fallback: write to public/ folder (dev only, read-only on Vercel)
    try {
      const { writeFileSync } = await import('fs')
      const { join } = await import('path')
      const destPath = join(process.cwd(), 'public', 'assets', 'branding', 'brand-logo.png')
      writeFileSync(destPath, buffer)
      return NextResponse.json({ url: '/assets/branding/brand-logo.png', storage: 'local' })
    } catch {
      return NextResponse.json(
        { error: 'לא ניתן לשמור קובץ בשרת. יש לחבר Supabase Storage או להשתמש בקישור URL.' },
        { status: 503 }
      )
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 })
  }
}
