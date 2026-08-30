'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrderNotesEditor({ orderId, initialNotes }: { orderId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: draft }),
    })
    const data = await res.json()
    if (data.ok) {
      setNotes(draft)
      setEditing(false)
      toast.success('הערה נשמרה')
    } else {
      toast.error('שגיאה בשמירה')
    }
    setSaving(false)
  }

  function cancel() {
    setDraft(notes)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-start gap-1.5 min-w-[150px]">
        <textarea
          ref={ref}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={2}
          className="flex-1 text-xs border border-charcoal/30 rounded px-2 py-1.5 focus:outline-none focus:border-charcoal resize-none"
          dir="rtl"
          onKeyDown={e => {
            if (e.key === 'Escape') cancel()
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
          }}
        />
        <div className="flex flex-col gap-1 pt-0.5">
          <button
            onClick={save}
            disabled={saving}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
            title="שמור"
          >
            <Check size={13} />
          </button>
          <button onClick={cancel} className="p-1 text-warm-gray hover:text-charcoal" title="ביטול">
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-start gap-1.5 group cursor-pointer max-w-[160px]"
      onClick={() => { setDraft(notes); setEditing(true) }}
      title="לחץ לעריכת הערה"
    >
      {notes ? (
        <span className="text-xs text-warm-gray line-clamp-2 leading-relaxed">{notes}</span>
      ) : (
        <span className="text-xs text-light-gray italic group-hover:text-warm-gray/60 transition-colors">הוסף הערה</span>
      )}
      <Pencil size={11} className="text-light-gray group-hover:text-warm-gray flex-shrink-0 mt-0.5 transition-colors" />
    </div>
  )
}
