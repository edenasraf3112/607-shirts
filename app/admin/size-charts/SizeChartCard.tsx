'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Copy, Trash2, Pencil } from 'lucide-react'
import type { SizeChart } from '@/lib/supabase'
import { SIZE_CHART_CATEGORIES } from '@/lib/sizeChartTemplates'
import { resolveCellStyle } from '@/lib/sizeChartStyle'

type CardChart = SizeChart & { product_count: number }

export default function SizeChartCard({ chart }: { chart: CardChart }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const previewRows = (chart.data?.rows || []).slice(0, 3)
  const categoryLabel = SIZE_CHART_CATEGORIES.find(c => c.value === chart.category)?.label

  async function duplicate() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/size-charts/${chart.id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('הטבלה שוכפלה')
      router.refresh()
    } catch {
      toast.error('שגיאה בשכפול')
    }
    setBusy(false)
  }

  async function remove() {
    const warning = chart.product_count > 0
      ? `הטבלה "${chart.title}" משויכת כרגע ל-${chart.product_count} מוצרים. מחיקתה תסיר את השיוך מאותם מוצרים. למחוק בכל זאת?`
      : `למחוק את הטבלה "${chart.title}"?`
    if (!confirm(warning)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/size-charts/${chart.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('נמחקה')
      router.refresh()
    } catch {
      toast.error('שגיאה במחיקה')
    }
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray overflow-hidden hover:border-charcoal/30 transition-colors flex flex-col">
      <div className="p-4 border-b border-light-gray">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-charcoal">{chart.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${chart.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-cream-dark text-warm-gray'}`}>
            {chart.status === 'published' ? '● מפורסם' : '○ טיוטה'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] text-warm-gray">
          {categoryLabel && <span className="bg-cream-dark px-2 py-0.5 rounded">{categoryLabel}</span>}
          <span className="bg-cream-dark px-2 py-0.5 rounded">{chart.unit === 'cm' ? 'ס"מ' : 'אינצ׳ים'}</span>
          <span className="bg-cream-dark px-2 py-0.5 rounded">{chart.product_count} מוצרים</span>
        </div>
      </div>

      {/* Mini preview */}
      <div className="p-3 bg-cream-dark/40 overflow-hidden" style={{ maxHeight: 110 }} aria-hidden="true">
        <div className="text-[9px] leading-tight" dir="rtl">
          {previewRows.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-0.5">
              {row.slice(0, 4).map((c, ci) => {
                const r = resolveCellStyle(c.style)
                return (
                  <span key={ci} className="truncate flex-1 text-charcoal" style={{ fontWeight: r.fontWeight, fontFamily: r.fontFamily === 'serif' ? 'Cormorant Garamond, serif' : 'Inter, sans-serif' }}>
                    {c.value || '—'}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 text-[11px] text-warm-gray space-y-1 flex-1">
        <p>נוצר: {new Date(chart.created_at).toLocaleDateString('he-IL')}</p>
        <p>עודכן: {new Date(chart.updated_at).toLocaleDateString('he-IL')}</p>
      </div>

      <div className="flex gap-3 px-4 py-3 border-t border-light-gray">
        <Link href={`/admin/size-charts/${chart.id}`} className="flex items-center gap-1 text-xs text-charcoal hover:underline font-medium">
          <Pencil size={12} /> ערוך
        </Link>
        <button type="button" onClick={duplicate} disabled={busy} className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal disabled:opacity-50">
          <Copy size={12} /> שכפל
        </button>
        <button type="button" onClick={remove} disabled={busy} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 mr-auto">
          <Trash2 size={12} /> מחק
        </button>
      </div>
    </div>
  )
}
