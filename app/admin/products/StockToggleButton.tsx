'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function StockToggleButton({ id, inStock }: { id: string; inStock: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ in_stock: !inStock }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(inStock ? 'סומן כאזל מהמלאי' : 'סומן כבמלאי')
        router.refresh()
      } else {
        toast.error(data.error || 'שגיאה')
      }
    } catch {
      toast.error('שגיאה בעדכון')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium disabled:opacity-50 ${
        inStock
          ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
          : 'border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300'
      }`}
    >
      {loading ? '...' : inStock ? 'סמן אזל' : 'החזר למלאי'}
    </button>
  )
}
