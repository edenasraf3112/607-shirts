'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'

export default function DuplicateProductButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function duplicate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('מוצר שוכפל')
      router.refresh()
    } catch {
      toast.error('שגיאה בשכפול')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={duplicate}
      disabled={loading}
      title="שכפל מוצר"
      className="text-xs text-warm-gray hover:text-charcoal transition-colors disabled:opacity-50 flex items-center gap-1"
    >
      <Copy size={12} />
      {loading ? '...' : 'שכפל'}
    </button>
  )
}
