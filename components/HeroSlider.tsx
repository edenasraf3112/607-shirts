'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type HeroSlide = {
  image: string
  title: string
  subtitle: string
  cta: string
  href: string
}

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85',
    title: '607 חולצות',
    subtitle: 'איכות, נוחות ועיצוב בכל פריט',
    cta: 'לחנות',
    href: '/shop/all',
  },
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=85',
    title: 'הזמנות מיוחדות',
    subtitle: 'חולצות וכובעים, מיוצרים לפי הזמנה',
    cta: 'לצפייה במוצרים',
    href: '/shop/all',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=85',
    title: 'מיוצר לפי הזמנה',
    subtitle: 'איכות בלתי מתפשרת',
    cta: 'הצטרפו',
    href: '/shop/all',
  },
]

export default function HeroSlider({ slides }: { slides?: HeroSlide[] }) {
  const SLIDES = slides && slides.length > 0 ? slides : DEFAULT_SLIDES
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [SLIDES.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [SLIDES.length])

  useEffect(() => {
    setLoaded(true)
    const timer = setInterval(next, 5500)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="relative mt-16 md:mt-36 h-[calc(100vh-7rem)] md:h-[calc(100vh-9rem)] min-h-[500px] overflow-hidden bg-charcoal">
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1200"
          style={{ opacity: i === current ? 1 : 0, transitionDuration: '1200ms' }}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-charcoal/30" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-center text-cream px-6 transition-all duration-800 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          dir="rtl"
        >
          <p
            className="text-xs tracking-widest uppercase mb-6 text-cream/70"
            style={{ letterSpacing: '0.35em' }}
          >
            607 חולצות
          </p>
          <h1
            key={current}
            className="font-serif text-4xl md:text-7xl lg:text-8xl font-light text-cream mb-6 animate-fade-up"
            style={{ lineHeight: '1.1' }}
          >
            {SLIDES[current].title}
          </h1>
          <p
            key={`sub-${current}`}
            className="text-sm md:text-base text-cream/80 mb-10 animate-fade-up delay-200 tracking-wide"
          >
            {SLIDES[current].subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link
              href={SLIDES[current].href}
              className="inline-flex items-center justify-center px-10 py-4 text-xs tracking-widest uppercase border border-cream text-cream hover:bg-cream hover:text-charcoal transition-all duration-300"
              style={{ letterSpacing: '0.25em' }}
            >
              {SLIDES[current].cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute top-1/2 right-6 -translate-y-1/2 text-cream/70 hover:text-cream transition-colors p-2 hidden md:block"
        aria-label="הקודם"
      >
        <ChevronRight size={28} />
      </button>
      <button
        onClick={next}
        className="absolute top-1/2 left-6 -translate-y-1/2 text-cream/70 hover:text-cream transition-colors p-2 hidden md:block"
        aria-label="הבא"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-400 rounded-full ${
              i === current ? 'w-8 h-1.5 bg-cream' : 'w-1.5 h-1.5 bg-cream/40'
            }`}
            aria-label={`שקופית ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-cream/30 relative overflow-hidden">
          <div className="absolute top-0 w-full h-4 bg-cream animate-[scrollDown_2s_ease-in-out_infinite]" />
        </div>
        <style>{`
          @keyframes scrollDown {
            0% { top: -100%; }
            100% { top: 100%; }
          }
        `}</style>
      </div>
    </section>
  )
}
