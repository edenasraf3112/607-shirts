'use client'

import { useState } from 'react'
import { Truck, FileSpreadsheet, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const SHIPPING_COST = 20

export default function DeliverySheetExport() {
  const [loading, setLoading] = useState(false)

  function buildItemsString(items: any[]): string {
    if (!Array.isArray(items)) return ''
    return items
      .map(i => `${i.product_name || i.name || ''}${i.size ? ` (${i.size})` : ''}${i.color ? ` / ${i.color}` : ''} ×${i.quantity || 1}`)
      .join(', ')
  }

  async function fetchOrders() {
    const res = await fetch('/api/admin/delivery-sheet')
    if (!res.ok) throw new Error('שגיאה בטעינת נתונים')
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.orders || []
  }

  async function exportXlsx() {
    setLoading(true)
    try {
      const orders = await fetchOrders()
      if (!orders.length) { toast.error('אין הזמנות משלוח'); setLoading(false); return }

      const headers = ['שם המזמין', 'טלפון', 'כתובת', 'פריטים', 'הערות', 'סכום הזמנה', 'דמי משלוח', 'סכום כולל']
      const rows = orders.map((o: any) => {
        const orderTotal = Number(o.total) || 0
        return [
          o.customer_name,
          o.customer_phone,
          o.customer_address || '',
          buildItemsString(o.items),
          o.notes || '',
          orderTotal,
          SHIPPING_COST,
          orderTotal + SHIPPING_COST,
        ]
      })

      const totalRow = [
        `סה"כ: ${orders.length} משלוחים`, '', '', '', '',
        orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0),
        orders.length * SHIPPING_COST,
        orders.reduce((s: number, o: any) => s + (Number(o.total) || 0) + SHIPPING_COST, 0),
      ]
      rows.push(totalRow)

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      ws['!cols'] = [
        { wch: 20 }, // שם
        { wch: 14 }, // טלפון
        { wch: 30 }, // כתובת
        { wch: 40 }, // פריטים
        { wch: 24 }, // הערות
        { wch: 12 }, // סכום הזמנה
        { wch: 12 }, // דמי משלוח
        { wch: 12 }, // סכום כולל
      ]

      // Bold header + total row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let C = range.s.c; C <= range.e.c; C++) {
        const h = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
        if (h) h.s = { font: { bold: true } }
        const t = ws[XLSX.utils.encode_cell({ r: rows.length, c: C })]
        if (t) t.s = { font: { bold: true } }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'רשימת משלוחים')
      XLSX.writeFile(wb, `delivery-sheet-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success(`הורד — ${orders.length} משלוחים`)
    } catch (err: any) {
      toast.error(err?.message || 'שגיאה בייצוא')
    }
    setLoading(false)
  }

  function openPrint() {
    window.open('/admin/orders/delivery-print', '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportXlsx}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 rounded-lg"
      >
        <FileSpreadsheet size={14} />
        {loading ? '...' : 'Excel'}
      </button>
      <button
        onClick={openPrint}
        className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 transition-colors rounded-lg"
      >
        <Printer size={14} />
        PDF
      </button>
    </div>
  )
}
