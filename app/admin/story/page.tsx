export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import StoryEditor from './StoryEditor'
import { getServiceClient } from '@/lib/supabase'
import { DEFAULT_STORY_DATA, normalizeStoryData } from '@/lib/storyDefaults'
import type { StoryData } from '@/components/StoryContent'
import type { CommunityQuote } from '@/lib/supabase'

export default async function StoryAdmin() {
  let data: StoryData = DEFAULT_STORY_DATA
  let quotes: CommunityQuote[] = []
  const db = getServiceClient()

  try {
    const { data: row } = await db
      .from('site_content')
      .select('value')
      .eq('key', 'story_data')
      .single()
    if (row?.value) data = normalizeStoryData(JSON.parse(row.value))
  } catch {}

  try {
    const { data: rows } = await db.from('community_quotes').select('*').order('created_at', { ascending: false })
    quotes = rows || []
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">הסיפור שלו</h1>
          <p className="text-sm text-warm-gray">ניהול מלא של תמונות וטקסטים בדף "הסיפור שלו"</p>
        </div>
        <div className="bg-white rounded-xl border border-light-gray p-8">
          <StoryEditor initialData={data} initialQuotes={quotes} />
        </div>
      </div>
    </AdminShell>
  )
}
