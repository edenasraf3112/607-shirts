'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function OrderNotes({ orderId, initialNotes }: { orderId: string; initialNotes?: string }) {
  const [open, setOpen] = useState(!!initialNotes)
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (!res.ok) toast.error('שגיאה בשמירת ההערה')
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-warm-gray hover:text-charcoal underline">
        + הערה פנימית
      </button>
    )
  }

  return (
    <textarea
      className="form-input text-xs h-16 resize-none w-40"
      placeholder="הערה פנימית (למנהל בלבד)"
      value={notes}
      onChange={e => setNotes(e.target.value)}
      onBlur={save}
      disabled={saving}
    />
  )
}
