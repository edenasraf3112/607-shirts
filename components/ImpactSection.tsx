import Link from 'next/link'
import Image from 'next/image'

const DEFAULT_HEADING = 'כשאתה קונה,\nאתה חלק מהסיפור'
const DEFAULT_TEXT = 'כל רכישה תומכת ישירות במשפחה ובהנצחת הזיכרון של נהוראי.\nזה לא רק בגד — זה ביטוי של אהבה, של שייכות, של זיכרון שממשיך לחיות.'
const DEFAULT_QUOTE = 'לובשים אותו, זוכרים אותו'
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80'

interface Props {
  heading?: string
  text?: string
  quote?: string
  imageUrl?: string
  label?: string
}

export default function ImpactSection({ heading, text, quote, imageUrl, label }: Props) {
  const headingLines = (heading || DEFAULT_HEADING).split('\n')
  const textLines = (text || DEFAULT_TEXT).split('\n')

  return (
    <section className="py-24 px-6 bg-cream" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={imageUrl || DEFAULT_IMAGE}
              alt="Impact"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-charcoal/10" />
          </div>

          {/* Text */}
          <div className="space-y-8">
            <p className="text-xs tracking-widest uppercase text-warm-gray" style={{ letterSpacing: '0.3em' }}>
              {label || 'כל רכישה — שווה יותר'}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light leading-tight">
              {headingLines.map((line, i) => (
                <span key={i}>
                  {i === headingLines.length - 1 ? <em>{line}</em> : <>{line}<br /></>}
                </span>
              ))}
            </h2>
            <p className="text-base text-warm-gray leading-relaxed">
              {textLines.map((line, i) => (
                <span key={i}>{line}{i < textLines.length - 1 && <br />}</span>
              ))}
            </p>
            <div className="h-px w-16 bg-light-gray" />
            <p className="text-sm text-warm-gray italic font-serif text-xl">
              &quot;{quote || DEFAULT_QUOTE}&quot;
            </p>
            <div className="flex gap-4">
              <Link href="/story" className="btn-primary">
                הסיפור שלו
              </Link>
              <Link href="/contact" className="btn-ghost">
                הודעה למשפחה
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
