'use client'

import type { SizeChart } from '@/lib/supabase'
import { cellStyleToCss, resolveCellStyle } from '@/lib/sizeChartStyle'

const UNIT_NOTE: Record<'cm' | 'in', string> = {
  cm: 'כל המידות בסנטימטרים',
  in: 'כל המידות באינצ׳ים',
}

export default function SizeChartDisplay({ chart, compact = false }: { chart: SizeChart; compact?: boolean }) {
  const rows = chart.data?.rows || []
  if (rows.length === 0) return null

  const [headRow, ...bodyRows] = rows
  const colWidths = chart.data.colWidths || []

  return (
    <div dir="rtl" className={compact ? '' : 'space-y-3'}>
      {!compact && (
        <div>
          <p className="font-serif text-lg text-charcoal">{chart.title}</p>
          {chart.description && (
            <p className="text-xs text-warm-gray mt-1 leading-relaxed">{chart.description}</p>
          )}
        </div>
      )}
      <p className="text-[11px] tracking-wide text-warm-gray uppercase">{UNIT_NOTE[chart.unit]}</p>

      <div className="relative">
        <div className="overflow-x-auto -mx-1 px-1" role="group" aria-label={`${chart.title} - ניתן לגלול לצדדים`}>
          <table className="w-full border-collapse text-charcoal" style={{ minWidth: headRow.length * 90 }}>
            <colgroup>
              {headRow.map((_, i) => (
                <col key={i} style={colWidths[i] ? { width: colWidths[i] } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b-2 border-charcoal/20">
                {headRow.map((c, i) => {
                  const r = resolveCellStyle(c.style)
                  return (
                    <th
                      key={i}
                      scope="col"
                      className={`${i === 0 ? 'sticky right-0 bg-cream z-10' : ''} ${r.border && i > 0 ? 'border-r border-light-gray' : ''}`}
                      style={cellStyleToCss(c.style)}
                    >
                      {c.value}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className={ri < bodyRows.length - 1 ? 'border-b border-light-gray' : ''}>
                  {row.map((c, ci) => {
                    const r = resolveCellStyle(c.style)
                    const CellTag: 'th' | 'td' = ci === 0 ? 'th' : 'td'
                    return (
                      <CellTag
                        key={ci}
                        {...(ci === 0 ? { scope: 'row' } : {})}
                        className={`${ci === 0 ? 'sticky right-0 bg-cream z-10' : ''} ${r.border && ci > 0 ? 'border-r border-light-gray' : ''}`}
                        style={cellStyleToCss(c.style)}
                      >
                        {c.value}
                      </CellTag>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* subtle edge fade hinting horizontal scroll on mobile */}
        <div className="md:hidden pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-cream to-transparent" />
      </div>
    </div>
  )
}
