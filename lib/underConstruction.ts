import { supabase } from './supabase'

export type UnderConstructionKey =
  | 'shop_all'
  | 'shop_men'
  | 'shop_women'
  | 'shop_accessories'
  | 'story'
  | 'stickers_flags'
  | 'past_collections'
  | 'contact'

export const PAGE_LABELS: Record<UnderConstructionKey, string> = {
  shop_all: 'הכל',
  shop_men: 'גברים',
  shop_women: 'נשים',
  shop_accessories: 'אקססוריז',
  story: 'הסיפור שלו',
  stickers_flags: 'מדבקות & דגלים',
  past_collections: 'קולקציות עבר',
  contact: 'הודעה אלינו',
}

export async function isUnderConstruction(page: UnderConstructionKey): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'under_construction')
      .single()
    if (!data?.value) return false
    const map = JSON.parse(data.value)
    return map[page] === true
  } catch {
    return false
  }
}

export async function getAllUnderConstruction(): Promise<Record<UnderConstructionKey, boolean>> {
  const defaults = Object.fromEntries(
    Object.keys(PAGE_LABELS).map(k => [k, false])
  ) as Record<UnderConstructionKey, boolean>
  try {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'under_construction')
      .single()
    if (!data?.value) return defaults
    return { ...defaults, ...JSON.parse(data.value) }
  } catch {
    return defaults
  }
}
