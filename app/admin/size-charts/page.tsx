export const dynamic = 'force-dynamic'

import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import type { SizeChart } from '@/lib/supabase'
import SizeChartsFilterBar from './SizeChartsFilterBar'
import SizeChartCard from './SizeChartCard'

type CardChart = SizeChart & { product_count: number }

export default async function SizeChartsAdmin({ searchParams }: { searchParams: { q?: string; category?: string; status?: string; unit?: string; sort?: string } }) {
  const db = getServiceClient()
  let charts: CardChart[] = []
  let tableMissing = false

  try {
    const [{ data: rows, error }, { data: products }] = await Promise.all([
      db.from('size_charts').select('*'),
      db.from('products').select('size_chart_id'),
    ])
    if (error) throw error
    const counts: Record<string, number> = {}
    for (const p of products || []) {
      if (p.size_chart_id) counts[p.size_chart_id] = (counts[p.size_chart_id] || 0) + 1
    }
    charts = (rows || []).map(c => ({ ...c, product_count: counts[c.id] || 0 }))
  } catch {
    tableMissing = true
  }

  const { q, category, status, unit, sort = 'updated_desc' } = searchParams

  let filtered = charts
  if (q) {
    const needle = q.trim().toLowerCase()
    filtered = filtered.filter(c => c.title.toLowerCase().includes(needle) || c.internal_name.toLowerCase().includes(needle))
  }
  if (category) filtered = filtered.filter(c => c.category === category)
  if (status) filtered = filtered.filter(c => c.status === status)
  if (unit) filtered = filtered.filter(c => c.unit === unit)

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'products_desc') return b.product_count - a.product_count
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">טבלאות מידות</h1>
            <p className="text-sm text-warm-gray">{charts.length} טבלאות · שייכו טבלה מוכנה לכל מוצר בעמוד עריכת המוצר</p>
          </div>
          <Link href="/admin/size-charts/new" className="px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
            + צור טבלה חדשה
          </Link>
        </div>

        {tableMissing ? (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-xl p-6">
            טבלאות המידות עדיין לא מוגדרות במסד הנתונים. יש להריץ את סקריפט ה-SQL שסופק כדי להפעיל את התכונה.
          </div>
        ) : (
          <>
            <SizeChartsFilterBar initialQuery={q} category={category} status={status} unit={unit} sort={sort} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl p-12 text-center border border-light-gray">
                  <p className="font-serif text-xl text-warm-gray mb-4">אין טבלאות מידות תואמות</p>
                  <Link href="/admin/size-charts/new" className="text-sm text-charcoal underline">צור טבלה ראשונה</Link>
                </div>
              ) : filtered.map(c => <SizeChartCard key={c.id} chart={c} />)}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}
