'use client'

import { Download } from 'lucide-react'
import type { Order } from '@/lib/supabase'

export default function ExportOrdersButton({ orders }: { orders: Order[] }) {
  function exportCSV() {
    const headers = ['שם', 'טלפון', 'אימייל', 'כתובת', 'פריטים', 'סכום', 'סטטוס', 'תאריך']
    const rows = orders.map(o => [
      o.customer_name,
      o.customer_phone,
      o.customer_email || '',
      o.customer_address || '',
      (o.items as any[]).map((i: any) => `${i.product_name}×${i.quantity}`).join(' | '),
      o.total,
      o.status,
      new Date(o.created_at).toLocaleDateString('he-IL'),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${Date.now()}.csv`
    a.click()
  }

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
    >
      <Download size={14} />
      ייצוא CSV
    </button>
  )
}
