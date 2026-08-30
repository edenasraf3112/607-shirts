'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { CommunityQuote } from '@/lib/supabase'

const MAX_LEN = 50

export default function CommunityQuotesSection({ backgroundImages }: { backgroundImages: string[] }) {
  const [quotes, setQuotes] = useState<CommunityQuote[]>([])
  const [bgIndex, setBgIndex] = useState(0)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('community_quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => setQuotes(data || []))
  }, [])

  useEffect(() => {
    if (backgroundImages.length < 2) return
    const timer = setInterval(() => {
      setBgIndex(i => (i + 1) % backgroundImages.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [backgroundImages.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !text.trim()) {
      toast.error('יש למלא שם ואמירה')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase
      .from('community_quotes')
      .insert({ name: name.trim(), text: text.trim() })
      .select()
      .single()
    if (error) {
      toast.error('שגיאה בשליחה, נסה שוב')
    } else {
      setQuotes(q => [data, ...q])
      setName('')
      setText('')
      setOpen(false)
      toast.success('האמירה שלך נוספה — תודה ♡')
    }
    setSubmitting(false)
  }

  return (
    <section className="relative py-28 overflow-hidden bg-charcoal">
      {/* Blurred crossfading background */}
      {backgroundImages.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{ opacity: i === bgIndex ? 1 : 0 }}
        >
          <Image src={src} alt="" fill className="object-cover" style={{ filter: 'blur(18px)' }} />
        </div>
      ))}
      <div className="absolute inset-0 bg-charcoal/70" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-12 story-section">
          <p className="text-xs tracking-widest uppercase text-cream/50 mb-4" style={{ letterSpacing: '0.3em' }}>
            הקול שלכם
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-cream font-light">
            כל אחד יכול לכתוב משהו עליו
          </h2>
        </div>

        {/* Floating quotes cloud */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {quotes.map((q, i) => (
            <div
              key={q.id}
              className="bg-cream/10 backdrop-blur-sm border border-cream/15 rounded-2xl px-5 py-4 max-w-[220px] animate-float"
              style={{ animationDelay: `${(i % 6) * 0.4}s`, animationDuration: `${5 + (i % 4)}s` }}
            >
              <p className="font-serif text-cream text-sm leading-snug">"{q.text}"</p>
              <p className="text-cream/50 text-xs mt-2">— {q.name}</p>
            </div>
          ))}
          {quotes.length === 0 && (
            <p className="text-cream/40 text-sm">היו הראשונים לכתוב משהו עליו ♡</p>
          )}
        </div>

        {/* Add statement */}
        <div className="text-center">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center px-10 py-4 text-xs tracking-widest uppercase border border-cream text-cream hover:bg-cream hover:text-charcoal transition-all duration-300"
              style={{ letterSpacing: '0.25em' }}
            >
              הוסף אמירה
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-cream/95 p-6 rounded-xl space-y-3 text-right" dir="rtl">
              <div>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
                  placeholder="כתבו אמירה קצרה עליו..."
                  className="w-full border border-light-gray bg-white px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:border-charcoal rounded"
                  maxLength={MAX_LEN}
                  autoFocus
                />
                <p className="text-xs text-warm-gray mt-1">{text.length}/{MAX_LEN}</p>
              </div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="שם מלא"
                className="w-full border border-light-gray bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal rounded"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-charcoal text-cream text-sm py-2.5 rounded hover:bg-charcoal/80 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'שולח...' : 'פרסם אמירה'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm text-warm-gray border border-light-gray rounded hover:border-charcoal transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
