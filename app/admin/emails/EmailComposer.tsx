'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

const SEGMENTS = [
  { value: 'all', label: 'כל הלקוחות' },
  { value: 'waitlist', label: 'רשימת המתנה (נרשמו לעדכונים)' },
  { value: 'collection', label: 'לקוחות שקנו מקולקציה מסוימת' },
  { value: 'pending_payment', label: 'לקוחות שממתינים לתשלום' },
  { value: 'paid', label: 'לקוחות ששילמו' },
  { value: 'incomplete_payment', label: 'לקוחות שלא השלימו תשלום' },
]

export default function EmailComposer({ collections }: { collections: { id: string; name: string }[] }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [segment, setSegment] = useState('all')
  const [collectionId, setCollectionId] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!subject || !body) { toast.error('יש למלא נושא ותוכן'); return }
    if (segment === 'collection' && !collectionId) { toast.error('יש לבחור קולקציה'); return }
    if (!confirm('לשלוח את המייל לקבוצה שנבחרה?')) return
    setLoading(true)
    const res = await fetch('/api/admin/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, segment, collectionId: segment === 'collection' ? collectionId : undefined }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error || 'שגיאה בשליחה')
    else { toast.success(`נשלח ל-${data.sent} נמענים`); setSubject(''); setBody('') }
    setLoading(false)
  }

  return (
    <div dir="rtl" className="bg-white rounded-xl border border-light-gray p-6 space-y-4 max-w-2xl">
      <div>
        <label className="form-label">קבוצת יעד</label>
        <select className="form-select" value={segment} onChange={e => setSegment(e.target.value)}>
          {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {segment === 'collection' && (
        <div>
          <label className="form-label">קולקציה</label>
          <select className="form-select" value={collectionId} onChange={e => setCollectionId(e.target.value)}>
            <option value="">בחר קולקציה...</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="form-label">נושא</label>
        <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="נושא המייל" />
      </div>
      <div>
        <label className="form-label">תוכן ההודעה</label>
        <textarea className="form-input h-48 resize-none" value={body} onChange={e => setBody(e.target.value)} placeholder="תוכן המייל..." />
      </div>
      <button
        onClick={handleSend}
        disabled={loading}
        className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg"
      >
        {loading ? 'שולח...' : 'שלח קמפיין'}
      </button>
    </div>
  )
}
