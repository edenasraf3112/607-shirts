'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email && !phone) return
    setLoading(true)
    await supabase.from('messages').insert({
      name: 'עדכונים',
      email,
      phone,
      type: 'general',
      message: 'הצטרפות לרשימת עדכונים',
      subscribe: true,
    })
    setDone(true)
    setLoading(false)
    toast.success('נרשמת בהצלחה! נעדכן אותך על קולקציות חדשות.')
  }

  return (
    <section className="py-24 px-6 bg-charcoal text-cream" dir="rtl">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs tracking-widest uppercase text-cream/40 mb-6" style={{ letterSpacing: '0.3em' }}>
          הצטרפו אלינו
        </p>
        <h2 className="font-serif text-4xl md:text-5xl font-light mb-4">
          קבלו עדכונים ראשונים
        </h2>
        <p className="text-sm text-cream/60 mb-10 leading-relaxed">
          היו הראשונים לדעת על פתיחת קולקציות חדשות, מהדורות מוגבלות ועוד.
        </p>

        {done ? (
          <div className="text-cream/80 font-serif text-2xl italic animate-fade-in">
            תודה. נדאג לעדכן אותך ❤
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="כתובת מייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3.5 bg-cream/10 border border-cream/20 text-cream placeholder-cream/40 text-sm focus:outline-none focus:border-cream/60 transition-colors"
            />
            <input
              type="tel"
              placeholder="טלפון (אופציונלי)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 px-4 py-3.5 bg-cream/10 border border-cream/20 text-cream placeholder-cream/40 text-sm focus:outline-none focus:border-cream/60 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-cream text-charcoal text-xs tracking-widest uppercase hover:bg-cream/90 transition-colors disabled:opacity-50"
              style={{ letterSpacing: '0.2em' }}
            >
              {loading ? '...' : 'הצטרפו'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
