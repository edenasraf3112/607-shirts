'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { Send, Users, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

type Group = { value: string; label: string; description: string }

const GROUPS: Group[] = [
  { value: 'all_customers', label: 'כל הלקוחות', description: 'כל מי שהזמין באתר ויש לו מייל' },
  { value: 'waitlist', label: 'רשימת המתנה', description: 'נרשמו דרך פופאפ' },
  { value: 'pending_payment', label: 'ממתינים לתשלום', description: 'הזמנות בסטטוס "התקבלה" או "ממתינה לתשלום"' },
  { value: 'paid', label: 'לקוחות ששילמו', description: 'שולמה, בייצור, נארזת, נשלחה, נמסרה' },
  { value: 'by_collection', label: 'לפי קולקציה', description: 'לקוחות שהזמינו מקולקציה מסוימת' },
]

export default function EmailCampaignsPage() {
  const [group, setGroup] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  useEffect(() => {
    fetch('/api/collections-list')
      .then(r => r.json())
      .then(d => setCollections(d.collections || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!group) { setRecipientCount(null); return }
    if (group === 'by_collection' && !collectionId) { setRecipientCount(null); return }
    setLoadingCount(true)
    const params = new URLSearchParams({ group })
    if (collectionId) params.set('collection_id', collectionId)
    fetch(`/api/admin/emails?${params}`)
      .then(r => r.json())
      .then(d => setRecipientCount(d.count ?? null))
      .catch(() => setRecipientCount(null))
      .finally(() => setLoadingCount(false))
  }, [group, collectionId])

  async function send() {
    if (!group || !subject.trim() || !body.trim()) {
      toast.error('מלא את כל השדות')
      return
    }
    if (!confirm(`לשלוח "${subject}" ל-${recipientCount ?? '?'} נמענים?`)) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, collection_id: collectionId || undefined, subject, body }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult({ sent: data.sent, failed: data.failed, total: data.total })
        toast.success(`נשלח ל-${data.sent} נמענים!`)
      } else {
        toast.error(data.error || 'שגיאה')
      }
    } catch {
      toast.error('שגיאה בשליחה')
    }
    setSending(false)
  }

  const selectedGroup = GROUPS.find(g => g.value === group)

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">אימיילים ושיווק</h1>
          <p className="text-sm text-warm-gray">שליחת הודעות לקבוצות לקוחות</p>
        </div>

        <div className="bg-white rounded-xl border border-light-gray divide-y divide-light-gray">
          {/* Group selector */}
          <div className="p-6">
            <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">קבוצת נמענים</label>
            <div className="space-y-2">
              {GROUPS.map(g => (
                <label key={g.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="group"
                    value={g.value}
                    checked={group === g.value}
                    onChange={() => { setGroup(g.value); setCollectionId('') }}
                    className="accent-charcoal mt-0.5 w-4 h-4 flex-shrink-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-charcoal group-hover:text-charcoal">{g.label}</div>
                    <div className="text-xs text-warm-gray mt-0.5">{g.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {group === 'by_collection' && (
              <div className="mt-4">
                <select
                  value={collectionId}
                  onChange={e => setCollectionId(e.target.value)}
                  className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right bg-white"
                  dir="rtl"
                >
                  <option value="">— בחר קולקציה —</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {group && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Users size={14} className="text-warm-gray flex-shrink-0" />
                {loadingCount ? (
                  <span className="text-warm-gray">טוען...</span>
                ) : recipientCount !== null ? (
                  <span className="text-charcoal font-medium">{recipientCount} נמענים ייחודיים</span>
                ) : (
                  <span className="text-warm-gray">בחר קבוצה</span>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="p-6">
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

          {/* Body */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider">תוכן ההודעה</label>
              <button
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 text-xs text-warm-gray hover:text-charcoal transition-colors"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'ערוך' : 'תצוגה מקדימה'}
              </button>
            </div>
            {preview ? (
              <div
                className="border border-light-gray rounded-lg p-4 text-sm text-charcoal leading-relaxed min-h-[160px] bg-cream/30"
                dir="rtl"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                <div className="text-warm-gray mb-3 text-xs">שלום [שם הלקוח],</div>
                {body || <span className="text-warm-gray/50 italic">תוכן ריק</span>}
              </div>
            ) : (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder={'כתוב את תוכן ההודעה כאן...\n\nשורות ריקות הופכות לרווחים.\nהשם של הלקוח יתווסף אוטומטית בפתיח.'}
                className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right resize-none"
                dir="rtl"
              />
            )}
            <p className="text-xs text-warm-gray mt-1.5">
              הפתיח &quot;שלום [שם]&quot; מתווסף אוטומטית. עבור רשימת המתנה שם הלקוח עשוי להיות ריק.
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                ✓ נשלח ל-<strong>{result.sent}</strong> נמענים
                {result.failed > 0 && <span className="text-orange-600 mr-2">({result.failed} נכשלו)</span>}
              </div>
            </div>
          )}

          {/* Send button */}
          <div className="p-6">
            <button
              onClick={send}
              disabled={sending || !group || !subject.trim() || !body.trim() || (group === 'by_collection' && !collectionId)}
              className="flex items-center gap-2 px-6 py-3 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg disabled:opacity-50 w-full justify-center"
            >
              <Send size={15} />
              {sending ? 'שולח...' : `שלח ל${recipientCount !== null ? `-${recipientCount}` : ''} נמענים`}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
