'use client'

import { Download } from 'lucide-react'

export default function ExportCustomersButton({ customers }: { customers: any[] }) {
  function exportCSV() {
    const headers = ['שם', 'טלפון', 'מייל', 'הזמנות', 'סה"כ']
    const rows = customers.map(c => [c.customer_name, c.customer_phone, c.customer_email, c.order_count, c.total_spent])
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `customers_${Date.now()}.csv`; a.click()
  }
  return (
    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg">
      <Download size={14} /> ייצוא CSV
    </button>
  )
}
