export const dynamic = 'force-dynamic'
import StoryContent, { StoryData } from '@/components/StoryContent'
import { DEFAULT_STORY_DATA, normalizeStoryData } from '@/lib/storyDefaults'
import { getServiceClient } from '@/lib/supabase'
import { isUnderConstruction } from '@/lib/underConstruction'
import UnderConstructionPage from '@/components/UnderConstructionPage'

export default async function StoryPage() {
  if (await isUnderConstruction('story')) return <UnderConstructionPage />

  let data: StoryData = DEFAULT_STORY_DATA

  try {
    const { data: row } = await getServiceClient()
      .from('site_content')
      .select('value')
      .eq('key', 'story_data')
      .single()
    if (row?.value) {
      data = normalizeStoryData(JSON.parse(row.value))
    }
  } catch {}

  return <StoryContent data={data} />
}
