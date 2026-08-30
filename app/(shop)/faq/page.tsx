export const dynamic = 'force-dynamic'
import { getServiceClient } from '@/lib/supabase'
import { DEFAULT_FAQ_DATA } from '@/lib/faqDefaults'
import FAQAccordion from '@/components/FAQAccordion'
import type { FAQItem } from '@/lib/supabase'

export default async function FAQPage() {
  let data: FAQItem[] = DEFAULT_FAQ_DATA

  try {
    const { data: row } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'faq_data')
      .single()
    if (row?.value) data = JSON.parse(row.value)
  } catch {}

  const activeItems = data.filter(item => item.is_active !== false)

  return (
    <div className="pt-28 md:pt-40 min-h-screen bg-cream pb-20" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal font-light mb-10 text-center">
          שאלות ותשובות
        </h1>
        <FAQAccordion items={activeItems} />
      </div>
    </div>
  )
}
