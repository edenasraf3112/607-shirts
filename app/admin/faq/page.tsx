export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { DEFAULT_FAQ_DATA } from '@/lib/faqDefaults'
import FAQEditor from './FAQEditor'
import type { FAQItem } from '@/lib/supabase'

export default async function FAQAdmin() {
  let data: FAQItem[] = DEFAULT_FAQ_DATA

  try {
    const { data: row } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'faq_data')
      .single()
    if (row?.value) data = JSON.parse(row.value)
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">שאלות ותשובות</h1>
          <p className="text-sm text-warm-gray">ניהול עמוד ה-FAQ הכללי באתר</p>
        </div>
        <div className="bg-white rounded-xl border border-light-gray p-8">
          <FAQEditor initialData={data} />
        </div>
      </div>
    </AdminShell>
  )
}
