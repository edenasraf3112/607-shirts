'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Customer = {
  customer_name: string
  customer_phone: string
  customer_email: string
  order_count: number
  total_spent: number
  total_items: number
  last_order: string
  first_order: string
}

export default function CustomersList({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? customers.filter(c => {
        const q = query.toLowerCase()
        return (
          c.customer_name?.toLowerCase().includes(q) ||
          c.customer_phone?.includes(q) ||
          c.customer_email?.toLowerCase().includes(q)
        )
      })
    : customers

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
        <input
          type="text"
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:border-charcoal bg-white text-right"
          dir="rtl"
        />
      </div>

      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-warm-gray">
            <p className="text-lg font-serif">{query ? 'לא נמצאו תוצאות' : 'אין לקוחות עדיין'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-light-gray bg-cream-dark">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-warm-gray">לקוח</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray hidden md:table-cell">טלפון</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray hidden lg:table-cell">אימייל</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray">הזמנות</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray">פריטים</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray">סה"כ</th>
                <th className="text-right py-3 px-4 font-medium text-warm-gray hidden lg:table-cell">אחרונה</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-charcoal">{c.customer_name}</p>
                    <p className="text-xs text-warm-gray mt-0.5 md:hidden">{c.customer_phone}</p>
                  </td>
                  <td className="py-3 px-4 text-warm-gray hidden md:table-cell">{c.customer_phone}</td>
                  <td className="py-3 px-4 text-warm-gray hidden lg:table-cell text-xs">{c.customer_email}</td>
                  <td className="py-3 px-4 text-center font-medium text-charcoal">{c.order_count}</td>
                  <td className="py-3 px-4 text-center text-warm-gray">{c.total_items}</td>
                  <td className="py-3 px-4 font-medium text-charcoal">₪{c.total_spent.toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs text-warm-gray hidden lg:table-cell">{formatDate(c.last_order)}</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/customers/${encodeURIComponent(c.customer_phone || c.customer_email)}`}
                      className="text-xs text-warm-gray hover:text-charcoal underline whitespace-nowrap"
                    >
                      פרופיל
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {query && (
        <p className="text-xs text-warm-gray text-center">{filtered.length} מתוך {customers.length} לקוחות</p>
      )}
    </div>
  )
}
