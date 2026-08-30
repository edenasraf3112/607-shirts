export const dynamic = 'force-dynamic'

import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import SubmissionsTable from './SubmissionsTable'

export default async function SubmissionsPage() {
  let submissions: any[] = []
  try {
    const { data } = await getServiceClient()
      .from('popup_submissions')
      .select('*, popups(title)')
      .order('created_at', { ascending: false })
      .limit(500)
    submissions = data || []
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">פניות מפופאפים</h1>
            <p className="text-sm text-warm-gray">{submissions.length} פניות</p>
          </div>
          <Link href="/admin/popups" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
            ← חזרה לפופאפים
          </Link>
        </div>
        <SubmissionsTable submissions={submissions} />
      </div>
    </AdminShell>
  )
}
