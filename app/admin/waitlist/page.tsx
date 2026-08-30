export const dynamic = 'force-dynamic'

import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import WaitlistEmailSender from './WaitlistEmailSender'

export default async function WaitlistPage() {
  let submissions: any[] = []
  try {
    const { data } = await getServiceClient()
      .from('popup_submissions')
      .select('email, name, created_at')
      .not('email', 'is', null)
      .order('created_at', { ascending: false })
    submissions = data || []
  } catch {}

  // Deduplicate
  const seen = new Set<string>()
  const unique = submissions.filter(s => {
    if (!s.email || seen.has(s.email.toLowerCase())) return false
    seen.add(s.email.toLowerCase())
    return true
  })

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">רשימת ממתינים</h1>
          <p className="text-sm text-warm-gray">{unique.length} נרשמים ייחודיים</p>
        </div>
        <WaitlistEmailSender count={unique.length} />
        <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-gray bg-cream-dark">
                  <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">אימייל</th>
                  <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">שם</th>
                  <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {unique.map((s, i) => (
                  <tr key={i} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/50">
                    <td className="px-4 py-3 text-charcoal">{s.email}</td>
                    <td className="px-4 py-3 text-warm-gray">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-warm-gray text-xs">{new Date(s.created_at).toLocaleDateString('he-IL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
