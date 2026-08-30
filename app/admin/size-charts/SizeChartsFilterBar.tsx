'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { SIZE_CHART_CATEGORIES } from '@/lib/sizeChartTemplates'

type Props = {
  initialQuery?: string
  category?: string
  status?: string
  unit?: string
  sort?: string
}

export default function SizeChartsFilterBar({ initialQuery, category, status, unit, sort }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery || '')

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { q, category, status, unit, sort, ...next }
    if (merged.q) params.set('q', merged.q)
    if (merged.category) params.set('category', merged.category)
    if (merged.status) params.set('status', merged.status)
    if (merged.unit) params.set('unit', merged.unit)
    if (merged.sort) params.set('sort', merged.sort)
    const query = params.toString()
    router.push(`/admin/size-charts${query ? `?${query}` : ''}`)
  }

  useEffect(() => {
    const timeout = setTimeout(() => pushParams({ q }), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full md:w-64">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input className="form-input pr-9" placeholder="חיפוש לפי שם" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <select className="form-select w-auto" value={category || ''} onChange={e => pushParams({ category: e.target.value || undefined })}>
        <option value="">כל סוגי הבגד</option>
        {SIZE_CHART_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select className="form-select w-auto" value={status || ''} onChange={e => pushParams({ status: e.target.value || undefined })}>
        <option value="">כל הסטטוסים</option>
        <option value="published">מפורסם</option>
        <option value="draft">טיוטה</option>
      </select>
      <select className="form-select w-auto" value={unit || ''} onChange={e => pushParams({ unit: e.target.value || undefined })}>
        <option value="">כל היחידות</option>
        <option value="cm">סנטימטרים</option>
        <option value="in">אינצ׳ים</option>
      </select>
      <select className="form-select w-auto" value={sort || 'updated_desc'} onChange={e => pushParams({ sort: e.target.value })}>
        <option value="updated_desc">עדכון אחרון</option>
        <option value="created_desc">תאריך יצירה</option>
        <option value="products_desc">מס' מוצרים משויכים</option>
      </select>
    </div>
  )
}
