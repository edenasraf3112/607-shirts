'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

interface Props {
  tagline?: string
  description?: string
}

const DEFAULT_DESCRIPTION = 'כל פריט שתבחר הוא חלק מסיפור. מותג שנוסד על ידי המשפחה והחברים, כדי לשמור את הרוח חיה — בבגדים, בצבעים, בעיצוב. לא אתר הנצחה — אלא מותג אמיתי, שחי ונושם.'

export default function BrandSection({ tagline, description }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible'))
      },
      { threshold: 0.2 }
    )
    const els = ref.current?.querySelectorAll('.story-section')
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 md:py-36 px-6 max-w-5xl mx-auto text-center" dir="rtl">
      <div className="story-section">
        <p className="text-xs tracking-widest uppercase text-warm-gray mb-8" style={{ letterSpacing: '0.3em' }}>
          Nehoray Leizer
        </p>
        <h2 className="font-serif text-4xl md:text-6xl text-charcoal font-light mb-8 leading-tight">
          {tagline || (
            <>מותג שנולד מאהבה,<br /><em>לזכרו של נהוראי</em></>
          )}
        </h2>
        <p className="text-base md:text-lg text-warm-gray leading-relaxed max-w-2xl mx-auto mb-10">
          {description || DEFAULT_DESCRIPTION}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop/all"
            className="btn-primary"
          >
            Shop Collection
          </Link>
          <Link
            href="/story"
            className="btn-outline"
          >
            הסיפור שלו
          </Link>
        </div>
      </div>

      {/* Stats / values */}
      <div className="story-section grid grid-cols-3 gap-3 md:gap-8 mt-16 md:mt-24 pt-12 md:pt-16 border-t border-light-gray">
        {[
          { number: '01', label: 'קולקציה ראשונה' },
          { number: '∞', label: 'זיכרונות' },
          { number: '♡', label: 'מיוצר באהבה' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="font-serif text-4xl md:text-5xl text-charcoal mb-2">{item.number}</div>
            <div className="text-xs tracking-wider text-warm-gray uppercase" style={{ letterSpacing: '0.15em' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
