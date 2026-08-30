'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

const SUGGESTED = ['VIP', 'משפחה', 'איסוף עצמי', 'בעיה בתשלום', 'להתקשר ללקוח', 'הזמנה גדולה']

export default function OrderTags({ orderId, initialTags }: { orderId: string; initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(next: string[]) {
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: next }),
    })
    if (!res.ok) toast.error('שגיאה בשמירת תגיות (ודא שהרצת את מיגרציית ה-SQL להוספת עמודת tags)')
    else setTags(next)
    setSaving(false)
  }

  function addTag(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    save([...tags, t])
    setInput('')
  }

  function removeTag(tag: string) {
    save(tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs bg-charcoal text-cream rounded-full">
            {tag}
            <button onClick={() => removeTag(tag)} disabled={saving} className="hover:opacity-70">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="form-input text-xs flex-1"
          placeholder="תגית חדשה..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input) } }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED.filter(s => !tags.includes(s)).map(s => (
          <button key={s} onClick={() => addTag(s)} disabled={saving} className="px-2 py-1 text-xs border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal rounded-full transition-colors">
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}
