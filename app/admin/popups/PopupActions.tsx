'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function PopupActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/admin/popups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    const data = await res.json()
    if (data.ok) { toast.success('עודכן'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  async function remove() {
    if (!confirm('למחוק?')) return
    setLoading(true)
    const res = await fetch(`/api/admin/popups/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('נמחק'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  return (
    <>
      <button onClick={toggle} disabled={loading} className="text-xs text-warm-gray hover:text-charcoal underline disabled:opacity-50">
        {isActive ? 'כבה' : 'הפעל'}
      </button>
      <button onClick={remove} disabled={loading} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">מחק</button>
    </>
  )
}
