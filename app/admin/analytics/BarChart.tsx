type DataPoint = { label: string; value: number }

export default function BarChart({ data, color = '#1A1A1A', horizontal = false }: { data: DataPoint[]; color?: string; horizontal?: boolean }) {
  if (data.length === 0) return <p className="text-sm text-warm-gray text-center py-8">אין נתונים</p>
  const max = Math.max(...data.map(d => d.value), 1)

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-warm-gray flex-shrink-0">{d.label}</span>
            <div className="flex-1 bg-cream-dark rounded h-4 overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
            </div>
            <span className="w-10 text-left text-charcoal font-medium flex-shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="w-full rounded-t" style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`, background: color }} />
          <span className="text-[9px] text-warm-gray mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
