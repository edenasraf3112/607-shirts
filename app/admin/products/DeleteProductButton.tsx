'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`למחוק את "${name}"?`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) toast.error(data.error || 'שגיאה במחיקה')
    else { toast.success('נמחק'); router.refresh() }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'מחק'}
    </button>
  )
}
