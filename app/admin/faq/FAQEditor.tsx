'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { FAQItem } from '@/lib/supabase'

export default function FAQEditor({ initialData }: { initialData: FAQItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState<FAQItem[]>(initialData)
  const [loading, setLoading] = useState(false)

  function addItem() {
    setItems(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, question: '', answer: '', is_active: true }])
  }
  function updateItem(id: string, patch: Partial<FAQItem>) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  function removeItem(id: string) {
    if (!confirm('למחוק שאלה זו?')) return
    setItems(prev => prev.filter(item => item.id !== id))
  }
  function moveItem(index: number, dir: -1 | 1) {
    setItems(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: [{ key: 'faq_data', value: JSON.stringify(items) }] }),
    })
    if (res.ok) {
      toast.success('נשמר! השינויים יופיעו באתר')
      router.refresh()
    } else {
      toast.error('שגיאה בשמירה')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className={`border border-light-gray rounded-lg p-4 space-y-2 ${item.is_active === false ? 'opacity-50' : ''}`}>
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                className="form-input text-sm"
                placeholder="שאלה"
                value={item.question}
                onChange={e => updateItem(item.id, { question: e.target.value })}
              />
              <textarea
                className="form-input text-sm h-24 resize-none"
                placeholder="תשובה"
                value={item.answer}
                onChange={e => updateItem(item.id, { answer: e.target.value })}
              />
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={item.is_active !== false}
                  onChange={e => updateItem(item.id, { is_active: e.target.checked })}
                  className="w-4 h-4 accent-charcoal"
                />
                <span className="text-xs text-warm-gray">פעיל (מוצג באתר)</span>
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                <ChevronUp size={14} />
              </button>
              <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                <ChevronDown size={14} />
              </button>
              <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-warm-gray hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60"
      >
        <Plus size={14} /> הוסף שאלה
      </button>

      <div className="pt-4 border-t border-light-gray">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg"
        >
          {loading ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  )
}
