'use client'

import { useState } from 'react'
import { Send, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WaitlistActions({ count }: { count: number }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function sendCampaign() {
    if (!subject.trim() || !body.trim()) { toast.error('מלא נושא ותוכן'); return }
    if (!confirm(`לשלוח את "${subject}" ל-${count} נרשמים ברשימת ההמתנה?`)) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: 'waitlist', subject, body }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`נשלח ל-${data.sent} נמענים!`)
        setOpen(false)
        setSubject('')
        setBody('')
      } else {
        toast.error(data.error || 'שגיאה')
      }
    } catch {
      toast.error('שגיאה בשליחה')
    }
    setSending(false)
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          disabled={count === 0}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-40"
        >
          <Send size={14} />
          שלח אימייל לרשימה
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4" dir="rtl">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-light-gray flex items-center justify-between">
              <h2 className="font-semibold text-charcoal">שלח אימייל לרשימת ההמתנה</h2>
              <p className="text-sm text-warm-gray">{count} נמענים</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">נושא</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="נושא האימייל..."
                  className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">תוכן</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={7}
                  placeholder={'כתוב את ההודעה כאן...\n\nהפתיח "שלום [שם]" מתווסף אוטומטית.'}
                  className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right resize-none"
                  dir="rtl"
                />
              </div>
              <p className="text-xs text-warm-gray">הפתיח &quot;שלום [שם]&quot; מתווסף אוטומטית לכל הודעה.</p>
            </div>
            <div className="p-6 border-t border-light-gray flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-warm-gray hover:text-charcoal border border-light-gray rounded-lg hover:border-charcoal transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={sendCampaign}
                disabled={sending || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-40"
              >
                <Send size={14} />
                {sending ? 'שולח...' : `שלח ל-${count} נמענים`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
