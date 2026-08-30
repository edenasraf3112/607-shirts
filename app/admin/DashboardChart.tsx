'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'

type MonthData = {
  month: string
  label: string
  orders: number
  revenue: number
  items: number
}

export default function DashboardChart({ months }: { months: MonthData[] }) {
  const [view, setView] = useState<'revenue' | 'orders' | 'items'>('revenue')

  const values = months.map(m => view === 'revenue' ? m.revenue : view === 'orders' ? m.orders : m.items)
  const max = Math.max(...values, 1)

  const BAR_H = 120
  const BAR_W = 32
  const GAP = 16
  const totalW = months.length * (BAR_W + GAP) - GAP

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView('revenue')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${view === 'revenue' ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
        >
          הכנסות
        </button>
        <button
          onClick={() => setView('orders')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${view === 'orders' ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
        >
          הזמנות
        </button>
        <button
          onClick={() => setView('items')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${view === 'items' ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
        >
          פריטים
        </button>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto pb-2">
        <svg
          width={Math.max(totalW, 300)}
          height={BAR_H + 40}
          style={{ overflow: 'visible', minWidth: '100%' }}
        >
          {months.map((m, i) => {
            const val = view === 'revenue' ? m.revenue : m.orders
            const barH = max > 0 ? Math.max((val / max) * BAR_H, val > 0 ? 4 : 0) : 0
            const x = i * (BAR_W + GAP)
            const y = BAR_H - barH

            return (
              <g key={m.month}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  rx={4}
                  fill={val > 0 ? '#1A1A1A' : '#E8E5E0'}
                />
                {/* Value label above bar */}
                {val > 0 && (
                  <text
                    x={x + BAR_W / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#6B6560"
                    fontFamily="Arial, sans-serif"
                  >
                    {view === 'revenue' ? `₪${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}` : val}
                  </text>

                )}
                {/* Month label below */}
                <text
                  x={x + BAR_W / 2}
                  y={BAR_H + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6B6560"
                  fontFamily="Arial, sans-serif"
                >
                  {m.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Monthly table */}
      <div className="mt-6 border-t border-light-gray pt-4 space-y-2">
        {[...months].reverse().map(m => (
          <div key={m.month} className="flex items-center justify-between text-sm gap-4">
            <span className="text-warm-gray w-16 flex-shrink-0">{m.label}</span>
            <span className="text-charcoal font-medium flex-shrink-0">{m.orders} הזמנות</span>
            <span className="text-warm-gray flex-shrink-0">{m.items} פריטים</span>
            <span className="font-serif text-charcoal">{formatPrice(m.revenue)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
