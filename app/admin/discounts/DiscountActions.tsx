'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DiscountActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/admin/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive }),
    })
    if (!res.ok) toast.error('שגיאה')
    else { toast.success('עודכן'); router.refresh() }
    setLoading(false)
  }

  async function remove() {
    if (!confirm('למחוק קוד זה?')) return
    setLoading(true)
    const res = await fetch('/api/admin/discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) toast.error('שגיאה')
    else { toast.success('נמחק'); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button onClick={toggle} disabled={loading} className="text-xs text-warm-gray hover:text-charcoal underline">
        {isActive ? 'כבה' : 'הפעל'}
      </button>
      <button onClick={remove} disabled={loading} className="text-xs text-red-500 hover:text-red-700">מחק</button>
    </div>
  )
}
