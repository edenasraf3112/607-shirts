export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import ContentEditor from './ContentEditor'
import LogoUploader from './LogoUploader'
import HeroSlidesEditor from './HeroSlidesEditor'
import { DEFAULT_SLIDES, type HeroSlide } from '@/components/HeroSlider'

export default async function ContentAdmin() {
  let content: Record<string, string> = {}
  let logoUrl = '/assets/branding/brand-logo.png'
  let heroSlides: HeroSlide[] = DEFAULT_SLIDES

  try {
    const { data } = await getServiceClient().from('site_content').select('*')
    if (data) data.forEach((row: any) => {
      content[row.key] = row.value
      if (row.key === 'logo_url') logoUrl = row.value
      if (row.key === 'hero_slides') {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) heroSlides = parsed
        } catch {}
      }
    })
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">תוכן ועיצוב</h1>
          <p className="text-sm text-warm-gray">ניהול לוגו, דף הבית, טקסטים ומידע ביצירת קשר</p>
        </div>

        {/* Logo section */}
        <div className="bg-white rounded-xl border border-light-gray p-8">
          <h2 className="text-base font-semibold text-charcoal mb-1">לוגו האתר</h2>
          <p className="text-sm text-warm-gray mb-6">החלפת הלוגו שמופיע בסרגל הניווט</p>
          <LogoUploader currentLogoUrl={logoUrl} />
        </div>

        {/* Hero slides section */}
        <div className="bg-white rounded-xl border border-light-gray p-8">
          <h2 className="text-base font-semibold text-charcoal mb-1">שקופיות דף הבית</h2>
          <p className="text-sm text-warm-gray mb-6">התמונות והטקסטים שמתחלפים בראש דף הבית</p>
          <HeroSlidesEditor initialSlides={heroSlides} />
        </div>

        {/* Content section */}
        <div className="bg-white rounded-xl border border-light-gray p-8">
          <h2 className="text-base font-semibold text-charcoal mb-1">טקסטים ותוכן</h2>
          <p className="text-sm text-warm-gray mb-6">ניהול טקסטים ומידע ביצירת קשר</p>
          <ContentEditor content={content} />
        </div>
      </div>
    </AdminShell>
  )
}
