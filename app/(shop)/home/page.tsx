export const dynamic = 'force-dynamic'
import HeroSlider, { HeroSlide, DEFAULT_SLIDES } from '@/components/HeroSlider'
import FeaturedProducts from '@/components/FeaturedProducts'
import PopupRenderer from '@/components/PopupRenderer'
import { getServiceClient } from '@/lib/supabase'

export default async function HomePage() {
  let slides: HeroSlide[] = DEFAULT_SLIDES

  try {
    const { data } = await getServiceClient()
      .from('site_content')
      .select('key,value')
      .eq('key', 'hero_slides')
      .maybeSingle()
    if (data?.value) {
      const parsed = JSON.parse(data.value)
      if (Array.isArray(parsed) && parsed.length > 0) slides = parsed
    }
  } catch {}

  return (
    <>
      <PopupRenderer page="home" />
      <HeroSlider slides={slides} />
      <FeaturedProducts />
    </>
  )
}
