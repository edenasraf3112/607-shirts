export const dynamic = 'force-dynamic'
import { getServiceClient } from '@/lib/supabase'
import type { StickerFlagFile } from '@/lib/supabase'
import { isUnderConstruction } from '@/lib/underConstruction'
import UnderConstructionPage from '@/components/UnderConstructionPage'
import CustomPrintForm from '@/components/CustomPrintForm'
import { Download, Tag } from 'lucide-react'
import Image from 'next/image'

const TYPE_LABELS: Record<string, string> = {
  sticker: 'מדבקה',
  flag: 'דגל',
  both: 'מדבקה & דגל',
}

export default async function StickersPage() {
  if (await isUnderConstruction('stickers_flags')) return <UnderConstructionPage />

  let files: StickerFlagFile[] = []
  try {
    const { data } = await getServiceClient()
      .from('sticker_flag_files')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    files = data || []
  } catch {}

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      {/* Header */}
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <p className="text-xs tracking-widest uppercase text-warm-gray mb-4" style={{ letterSpacing: '0.25em' }}>
          Free Download
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">מדבקות & דגלים</h1>
        <p className="text-sm text-warm-gray mt-4 max-w-md mx-auto leading-relaxed">
          הורידו את הקבצים, הדפיסו בבית — ושאו את הסיפור איתכם לכל מקום
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Files grid */}
        {files.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-warm-gray">קבצים בדרך...</p>
            <p className="text-sm text-warm-gray/60 mt-3">בקרוב יועלו מדבקות ודגלים להורדה חינם</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {files.map((f) => (
                <div key={f.id} className="bg-white group flex flex-col">
                  {/* Preview */}
                  <div className="relative aspect-square bg-cream-dark overflow-hidden">
                    {f.preview_image ? (
                      <Image
                        src={f.preview_image}
                        alt={f.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tag size={40} className="text-light-gray" strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="text-xs px-2 py-1 bg-charcoal text-cream">
                        {TYPE_LABELS[f.type] || f.type}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-serif text-lg text-charcoal leading-tight">{f.name}</h3>
                    {f.description && (
                      <p className="text-xs text-warm-gray mt-1 line-clamp-2">{f.description}</p>
                    )}
                    <div className="mt-auto pt-4">
                      <a
                        href={f.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 border border-charcoal text-xs tracking-wider uppercase text-charcoal hover:bg-charcoal hover:text-cream transition-colors"
                        style={{ letterSpacing: '0.15em' }}
                      >
                        <Download size={13} />
                        הורדה חינם
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="my-20 flex items-center gap-6">
          <div className="flex-1 h-px bg-light-gray" />
          <p className="text-xs tracking-widest uppercase text-warm-gray" style={{ letterSpacing: '0.25em' }}>
            הוסף הדפס שלך
          </p>
          <div className="flex-1 h-px bg-light-gray" />
        </div>

        {/* Custom print section */}
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-charcoal mb-3">יש לך עיצוב משלך?</h2>
            <p className="text-sm text-warm-gray leading-relaxed">
              העלו קובץ, ציינו את המידות וסוג ההדפס — אנחנו נבדוק אותו ונעלה אותו לאתר
              כדי שכולם יוכלו להוריד.
            </p>
          </div>
          <CustomPrintForm />
        </div>
      </div>
    </div>
  )
}
