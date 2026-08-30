export const dynamic = 'force-dynamic'
import HeroSlider, { HeroSlide, DEFAULT_SLIDES } from '@/components/HeroSlider'
import BrandSection from '@/components/BrandSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import ImpactSection from '@/components/ImpactSection'
import NewsletterSection from '@/components/NewsletterSection'
import PopupRenderer from '@/components/PopupRenderer'
import { getServiceClient } from '@/lib/supabase'

export default async function HomePage() {
  let brandTagline = ''
  let brandDescription = ''
  let slides: HeroSlide[] = DEFAULT_SLIDES
  let impactHeading = ''
  let impactText = ''
  let impactQuote = ''
  let impactImage = ''
  let impactLabel = ''

  try {
    const { data } = await getServiceClient()
      .from('site_content')
      .select('key,value')
      .in('key', ['brand_tagline', 'brand_description', 'hero_slides', 'impact_heading', 'impact_text', 'impact_quote', 'impact_image', 'impact_label'])
    data?.forEach((row: any) => {
      if (row.key === 'brand_tagline') brandTagline = row.value
      if (row.key === 'brand_description') brandDescription = row.value
      if (row.key === 'impact_heading') impactHeading = row.value
      if (row.key === 'impact_text') impactText = row.value
      if (row.key === 'impact_quote') impactQuote = row.value
      if (row.key === 'impact_image') impactImage = row.value
      if (row.key === 'impact_label') impactLabel = row.value
      if (row.key === 'hero_slides') {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) slides = parsed
        } catch {}
      }
    })
  } catch {}

  return (
    <>
      <PopupRenderer page="home" />
      <HeroSlider slides={slides} />
      <BrandSection tagline={brandTagline} description={brandDescription} />
      <FeaturedProducts />
      <ImpactSection
        heading={impactHeading}
        text={impactText}
        quote={impactQuote}
        imageUrl={impactImage}
        label={impactLabel}
      />
      <NewsletterSection />
    </>
  )
}
