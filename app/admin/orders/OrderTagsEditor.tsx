'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESET_TAGS = ['VIP', 'משפחה', 'איסוף עצמי', 'בעיה בתשלום', 'להתקשר', 'הזמנה גדולה']

const TAG_STYLES: Record<string, string> = {
  'VIP': 'bg-yellow-100 text-yellow-800',
  'משפחה': 'bg-pink-100 text-pink-800',
  'איסוף עצמי': 'bg-blue-100 text-blue-800',
  'בעיה בתשלום': 'bg-red-100 text-red-800',
  'להתקשר': 'bg-orange-100 text-orange-800',
  'הזמנה גדולה': 'bg-purple-100 text-purple-800',
}

function tagStyle(tag: string) {
  return TAG_STYLES[tag] || 'bg-cream-dark text-warm-gray'
}

export default function OrderTagsEditor({ orderId, initialTags }: { orderId: string; initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags || [])
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveTags(newTags: string[]) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
      const data = await res.json()
      if (data.ok) {
        setTags(newTags)
      } else {
        toast.error(data.error?.includes('column') ? 'נדרש SQL migration לפני שימוש בתגיות' : 'שגיאה')
      }
    } catch {
      toast.error('שגיאה')
    }
    setSaving(false)
  }

  function addTag(tag: string) {
    if (!tag.trim() || tags.includes(tag)) return
    const next = [...tags, tag.trim()]
    saveTags(next)
    setCustom('')
    setOpen(false)
  }

  function removeTag(tag: string) {
    saveTags(tags.filter(t => t !== tag))
  }

  const available = PRESET_TAGS.filter(t => !tags.includes(t))

  return (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      {tags.map(tag => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${tagStyle(tag)}`}
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            disabled={saving}
            className="hover:opacity-70 disabled:opacity-50 flex-shrink-0"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-0.5 text-xs text-warm-gray/50 hover:text-warm-gray border border-dashed border-light-gray hover:border-warm-gray rounded-full px-1.5 py-0.5 transition-colors"
          title="הוסף תגית"
        >
          <Plus size={10} />
        </button>

        {open && (
          <div
            className="absolute top-full right-0 mt-1 z-30 bg-white rounded-xl border border-light-gray shadow-lg p-3 w-48"
            dir="rtl"
          >
            {available.length > 0 && (
              <div className="space-y-1 mb-2">
                {available.map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className={`w-full text-right text-xs px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity ${tagStyle(tag)}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1 border-t border-light-gray pt-2">
              <input
                type="text"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag(custom)}
                placeholder="תגית מותאמת..."
                className="flex-1 text-xs border border-light-gray rounded px-2 py-1 focus:outline-none focus:border-charcoal text-right"
                dir="rtl"
                autoFocus
              />
              <button
                onClick={() => addTag(custom)}
                className="px-2 py-1 bg-charcoal text-cream text-xs rounded"
              >
                +
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-1.5 left-1.5 text-warm-gray hover:text-charcoal"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
