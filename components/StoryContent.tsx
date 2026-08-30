'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AutoVideo from './AutoVideo'
import CommunityQuotesSection from './CommunityQuotesSection'

export type StoryBlock =
  | { id: string; type: 'short_text'; text: string }
  | { id: string; type: 'long_text'; text: string }
  | { id: string; type: 'gallery'; images: string[] }
  | { id: string; type: 'video'; url: string }
  | { id: string; type: 'timeline'; items: { year: string; text: string }[] }
  | { id: string; type: 'community_quotes'; images: string[] }

export type StoryData = {
  heroImage: string
  heroTitle: string
  heroSubtitle: string
  blocks: StoryBlock[]
}

export default function StoryContent({ data }: { data: StoryData }) {
  const sectionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.15 }
    )
    const els = sectionsRef.current?.querySelectorAll('.story-section')
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionsRef} className="pt-24 md:pt-40 bg-cream overflow-hidden" dir="rtl">
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-end pb-20">
        <Image src={data.heroImage} alt="Nehoray Leizer" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-transparent to-charcoal/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-cream story-section">
          <p className="text-xs tracking-widest uppercase text-cream/60 mb-4" style={{ letterSpacing: '0.3em' }}>
            הסיפור שלו
          </p>
          <h1 className="font-serif text-6xl md:text-8xl font-light leading-tight">{data.heroTitle}</h1>
          <p className="mt-4 text-lg text-cream/80 font-serif italic">— {data.heroSubtitle}</p>
        </div>
      </section>

      {/* Blocks, in admin-defined order */}
      {data.blocks.map((block) => {
        if (block.type === 'timeline') {
          return (
            <section key={block.id} className="py-24 px-6 bg-cream">
              <div className="max-w-3xl mx-auto">
                <div className="story-section text-center mb-16">
                  <p className="text-xs tracking-widest uppercase text-warm-gray mb-4" style={{ letterSpacing: '0.3em' }}>
                    הסיפור
                  </p>
                  <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light">מאדם למותג</h2>
                </div>
                <div className="space-y-12">
                  {block.items.map((item, i) => (
                    <div key={i} className="story-section flex gap-8 items-start">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="font-serif text-2xl text-warm-gray/50">{item.year}</span>
                      </div>
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-charcoal" />
                      </div>
                      <div className="flex-1 pb-12 border-b border-light-gray last:border-0">
                        <p className="text-base text-warm-gray leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        }

        if (block.type === 'community_quotes') {
          return <CommunityQuotesSection key={block.id} backgroundImages={block.images.length > 0 ? block.images : [data.heroImage]} />
        }

        if (block.type === 'gallery') {
          return (
            <section key={block.id} className="py-20 bg-charcoal story-section">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {block.images.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                      <Image src={src} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        }

        return (
          <section key={block.id} className="py-16 px-6 bg-cream story-section">
            <div className="max-w-3xl mx-auto">
              {block.type === 'short_text' && (
                <p className="font-serif text-2xl md:text-3xl text-charcoal text-center leading-relaxed">{block.text}</p>
              )}
              {block.type === 'long_text' && (
                <p className="text-base text-warm-gray leading-relaxed whitespace-pre-line">{block.text}</p>
              )}
              {block.type === 'video' && <AutoVideo src={block.url} />}
            </div>
          </section>
        )
      })}

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-cream story-section">
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light mb-6">הצטרף לסיפור שלו</h2>
        <p className="text-warm-gray mb-10 max-w-md mx-auto">כל בגד שאתה לובש הוא חלק מהמורשת שלו.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop/all" className="btn-primary">Shop Collection</Link>
          <Link href="/contact" className="btn-outline">הודעה למשפחה</Link>
        </div>
      </section>
    </div>
  )
}
