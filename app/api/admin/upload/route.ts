import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'

const ALLOWED_BUCKETS = ['products', 'collections', 'story', 'branding', 'stickers-flags']

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null

    if (!file || !bucket) return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 })
    if (!ALLOWED_BUCKETS.includes(bucket)) return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const path = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9.\-_]/g, '_')

    const db = getServiceClient()
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
    })
    if (error) throw error

    const { data } = db.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 })
  }
}
