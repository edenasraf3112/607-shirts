'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function OrdersSearchBar({ status, initialQuery }: { status?: string; initialQuery?: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery || '')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (q) params.set('q', q)
      const query = params.toString()
      router.push(`/admin/orders${query ? `?${query}` : ''}`)
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="relative w-full md:w-72">
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray" />
      <input
        className="form-input pr-9"
        placeholder="חיפוש לפי לקוח, טלפון, מייל, מוצר..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />
    </div>
  )
}
