'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

const PRESET_TAGS = ['VIP', 'לקוח חוזר', 'ידוע אישית', 'משפחה', 'בעיית תשלום', 'להתקשר', 'ברשימה שחורה']

type Props = {
  phone: string
  initialNotes: string
  initialTags: string[]
}

export default function CustomerNotesClient({ phone, initialNotes, initialTags }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [saving, setSaving] = useState(false)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/customer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, admin_notes: notes, admin_tags: tags }),
      })
      if (!res.ok) throw new Error()
      toast.success('נשמר')
    } catch {
      toast.error('שגיאה בשמירה')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray p-6 space-y-4">
      <h3 className="font-semibold text-charcoal text-sm">הערות ותגיות (פנימי)</h3>

      <div>
        <label className="block text-xs text-warm-gray mb-2">תגיות</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                tags.includes(tag)
                  ? 'bg-charcoal text-cream border-charcoal'
                  : 'border-light-gray text-warm-gray hover:border-charcoal'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-warm-gray mb-2">הערות</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal resize-none h-28 text-right bg-white"
          dir="rtl"
          placeholder="הערות פנימיות על הלקוח..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-50"
      >
        <Save size={13} />
        {saving ? 'שומר...' : 'שמור'}
      </button>
    </div>
  )
}
