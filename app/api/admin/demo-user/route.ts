import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServiceClient } from '@/lib/supabase'
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME } from '@/lib/demo'

function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}

export async function POST() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  // Check if user already exists
  const { data: existing } = await db.auth.admin.listUsers()
  const existingUser = existing?.users?.find(u => u.email === DEMO_EMAIL)

  if (existingUser) {
    // Reset password in case it was changed
    await db.auth.admin.updateUserById(existingUser.id, { password: DEMO_PASSWORD })
    return NextResponse.json({
      status: 'exists',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      message: 'משתמש הדמו כבר קיים — הסיסמה אופסה',
    })
  }

  // Create the demo user
  const { data, error } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: DEMO_NAME },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create user profile entry
  if (data.user) {
    try {
      await db.from('user_profiles').upsert({
        id: data.user.id,
        name: DEMO_NAME,
        phone: '0500000000',
        address: 'כתובת דמו',
      })
    } catch {}
  }

  return NextResponse.json({
    status: 'created',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    message: 'משתמש הדמו נוצר בהצלחה',
  })
}

export async function DELETE() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { data: existing } = await db.auth.admin.listUsers()
  const user = existing?.users?.find(u => u.email === DEMO_EMAIL)

  if (!user) return NextResponse.json({ message: 'משתמש הדמו לא קיים' })

  await db.auth.admin.deleteUser(user.id)
  return NextResponse.json({ message: 'משתמש הדמו נמחק' })
}
