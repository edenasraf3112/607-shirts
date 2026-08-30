import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  const adminUser = process.env.ADMIN_USERNAME || 'admin'
  const adminPass = process.env.ADMIN_PASSWORD || 'lazer2024'

  if (username === adminUser && password === adminPass) {
    const cookieStore = cookies()
    cookieStore.set('admin_session', Buffer.from(`${username}:${Date.now()}`).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('admin_session')
  return NextResponse.json({ ok: true })
}
