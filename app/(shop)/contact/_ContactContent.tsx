'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const MESSAGE_TYPES = [
  { value: 'family_message', label: 'הודעה למשפחה', description: 'שתפו מחשבה, זיכרון, או מילה' },
  { value: 'collection_request', label: 'בקשת קולקציה', description: 'רוצים שקולקציה ישנה תחזור?' },
  { value: 'general', label: 'שאלה כללית', description: 'שאלות על מוצרים, הזמנות, משלוחים' },
]

export default function ContactContent() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    type: 'general', message: '', subscribe: false,
  })
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/collections-list')
      .then(r => r.json())
      .then(d => setCollections(d.collections || []))
      .catch(() => {})
  }, [])

  function toggleCollection(id: string) {
    setSelectedCollections(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error('יש למלא שם'); return }
    if (form.type !== 'collection_request' && !form.message) { toast.error('יש למלא הודעה'); return }
    if (form.type === 'collection_request' && !form.message && selectedCollections.length === 0) {
      toast.error('יש למלא הודעה או לבחור קולקציה'); return
    }
    setLoading(true)
    const selectedNames = collections.filter(c => selectedCollections.includes(c.id)).map(c => c.name)
    const { error } = await supabase.from('messages').insert({
      name: form.name,
      phone: form.phone,
      email: form.email,
      type: form.type,
      message: form.message,
      subscribe: form.subscribe,
      requested_collections: selectedNames,
    })
    if (error) toast.error('שגיאה בשליחה, נסה שוב')
    else { setDone(true); toast.success('ההודעה נשלחה!') }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="pt-16 md:pt-40 min-h-screen flex items-center justify-center px-6" dir="rtl">
        <div className="text-center max-w-lg animate-fade-up">
          <div className="font-serif text-6xl text-warm-gray mb-6">♡</div>
          <h2 className="font-serif text-4xl text-charcoal mb-4">תודה רבה</h2>
          <p className="text-warm-gray leading-relaxed">ההודעה שלך הגיעה אלינו. נחזור אליך בהקדם.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <p className="text-xs tracking-widest uppercase text-warm-gray mb-4" style={{ letterSpacing: '0.25em' }}>Contact</p>
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">הודעה אלינו</h1>
        <p className="text-sm text-warm-gray mt-4 max-w-md mx-auto">
          כל הודעה מתקבלת באהבה — בין אם מילה למשפחה, שאלה על הזמנה, או סתם שיתוף
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {MESSAGE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setForm({ ...form, type: type.value })}
              className={`p-4 text-right border transition-all ${form.type === type.value ? 'border-charcoal bg-charcoal text-cream' : 'border-light-gray bg-white text-charcoal hover:border-charcoal'}`}
            >
              <div className="text-sm font-medium mb-1">{type.label}</div>
              <div className={`text-xs ${form.type === type.value ? 'text-cream/70' : 'text-warm-gray'}`}>{type.description}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">שם מלא *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">טלפון</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">אימייל</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          {form.type === 'collection_request' && collections.length > 0 && (
            <div>
              <label className="form-label">איזה קולקציות תרצו שיחזרו? (אופציונלי)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {collections.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCollection(c.id)}
                    className={`px-4 py-2 text-sm border transition-colors ${selectedCollections.includes(c.id) ? 'border-charcoal bg-charcoal text-cream' : 'border-light-gray text-charcoal hover:border-charcoal'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="form-label">הודעה {form.type === 'collection_request' ? '(אופציונלי)' : '*'}</label>
            <textarea
              className="form-input h-40 resize-none"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder={
                form.type === 'family_message' ? 'שתפו זיכרון, מחשבה, מילה...'
                : form.type === 'collection_request' ? 'אפשר גם לכתוב כמה מילים, או רק לבחור קולקציות מעל...'
                : 'כיצד נוכל לעזור?'
              }
              required={form.type !== 'collection_request'}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.subscribe} onChange={e => setForm({ ...form, subscribe: e.target.checked })} className="w-4 h-4 accent-charcoal" />
            <span className="text-sm text-warm-gray">אני מסכים/ה לקבל עדכונים על קולקציות ומבצעים</span>
          </label>
          <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
            {loading ? 'שולח...' : 'שלח הודעה'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-warm-gray mb-4">מעדיפים וואטסאפ?</p>
          <a
            href="https://wa.me/972503313034?text=אהלן, אשמח לשאלה..."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-charcoal border border-light-gray px-6 py-3 hover:border-charcoal transition-colors"
          >
            שלחו הודעה בוואטסאפ
          </a>
        </div>
      </div>
    </div>
  )
}
