'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeleteOrderButton({ id, deleted }: { id: string; deleted: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSoftDelete() {
    if (!confirm('למחוק את ההזמנה? ניתן לשחזר אחר כך.')) return
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('ההזמנה נמחקה'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  async function handleRestore() {
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted_at: null }),
    })
    const data = await res.json()
    if (data.ok) { toast.success('ההזמנה שוחזרה'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  async function handlePermanentDelete() {
    if (!confirm('למחוק לצמיתות? פעולה זו אינה הפיכה.')) return
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${id}?permanent=1`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('ההזמנה נמחקה לצמיתות'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  if (deleted) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleRestore}
          disabled={loading}
          className="p-1.5 rounded transition-colors disabled:opacity-50 text-green-600 hover:bg-green-50"
          title="שחזר הזמנה"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={handlePermanentDelete}
          disabled={loading}
          className="p-1.5 rounded transition-colors disabled:opacity-50 text-red-brand hover:bg-red-50"
          title="מחק לצמיתות"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSoftDelete}
      disabled={loading}
      className="p-1.5 rounded transition-colors disabled:opacity-50 text-warm-gray hover:text-red-brand hover:bg-red-50"
      title="מחק הזמנה"
    >
      <Trash2 size={14} />
    </button>
  )
}
