import type { StoryData, StoryBlock } from '@/components/StoryContent'

export const DEFAULT_STORY_DATA: StoryData = {
  heroImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=85',
  heroTitle: 'נהוראי ליזר',
  heroSubtitle: 'חי בזיכרוננו לנצח',
  blocks: [
    {
      id: 'default-timeline',
      type: 'timeline',
      items: [
        { year: '2020', text: 'נהוראי ליזר — אדם בעל לב ענק, חבר אמיתי, רוח חיה.' },
        { year: '2021', text: 'המשפחה החליטה לשמור את הזיכרון חי — לא בדמעות בלבד, אלא בפעולה.' },
        { year: '2022', text: 'הרעיון נולד: מותג בגדים שנושא את שמו, את האופי שלו, את הסיפור שלו.' },
        { year: '2024', text: 'האתר של נהוראי לייזר עלה לאוויר. קולקציה 01 — פתוחה להזמנות.' },
      ],
    },
    { id: 'default-quotes', type: 'community_quotes', images: [] },
  ],
}

// Migrates older saved shapes (separate top-level timeline/gallery/quotes fields)
// into the unified blocks array, so existing saved data keeps working.
export function normalizeStoryData(raw: any): StoryData {
  if (!raw) return DEFAULT_STORY_DATA

  if (Array.isArray(raw.blocks)) {
    return {
      heroImage: raw.heroImage || DEFAULT_STORY_DATA.heroImage,
      heroTitle: raw.heroTitle || DEFAULT_STORY_DATA.heroTitle,
      heroSubtitle: raw.heroSubtitle || DEFAULT_STORY_DATA.heroSubtitle,
      blocks: raw.blocks,
    }
  }

  const blocks: StoryBlock[] = []
  if (Array.isArray(raw.timeline) && raw.timeline.length > 0) {
    blocks.push({ id: 'migrated-timeline', type: 'timeline', items: raw.timeline })
  }
  if (Array.isArray(raw.legacyBlocks)) {
    blocks.push(...raw.legacyBlocks)
  }
  blocks.push({ id: 'migrated-quotes', type: 'community_quotes', images: Array.isArray(raw.gallery) ? raw.gallery : [] })
  if (Array.isArray(raw.gallery) && raw.gallery.length > 0) {
    blocks.push({ id: 'migrated-gallery', type: 'gallery', images: raw.gallery })
  }

  return {
    heroImage: raw.heroImage || DEFAULT_STORY_DATA.heroImage,
    heroTitle: raw.heroTitle || DEFAULT_STORY_DATA.heroTitle,
    heroSubtitle: raw.heroSubtitle || DEFAULT_STORY_DATA.heroSubtitle,
    blocks,
  }
}
