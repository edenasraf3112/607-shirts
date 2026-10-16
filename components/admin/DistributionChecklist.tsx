'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

type Row = { customer_name: string; variant: string; quantity: number }

export default function DistributionChecklist({
  productId,
  rows,
  totalQty,
  variantLabel,
  initialCheckedKeys,
  missingTable,
}: {
  productId: string
  rows: Row[]
  totalQty: number
  variantLabel: string
  initialCheckedKeys: string[]
  missingTable: boolean
}) {
  const keyOf = (row: Row) => `${productId}:${row.customer_name}:${row.variant}`
  const [checked, setChecked] = useState<Set<string>>(new Set(initialCheckedKeys))
  const [pending, setPending] = useState<Set<string>>(new Set())

  const checkedCount = rows.filter(r => checked.has(keyOf(r))).length

  async function toggle(row: Row) {
    const key = keyOf(row)
    const wasChecked = checked.has(key)
    const nextChecked = !wasChecked

    // Optimistic update
    setChecked(prev => {
      const next = new Set(prev)
      if (nextChecked) next.add(key); else next.delete(key)
      return next
    })
    setPending(prev => new Set(prev).add(key))

    try {
      const res = await fetch('/api/admin/distribution-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, checked: nextChecked }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on failure
      setChecked(prev => {
        const next = new Set(prev)
        if (wasChecked) next.add(key); else next.delete(key)
        return next
      })
      toast.error(missingTable ? 'טבלת הסימונים עוד לא מוגדרת — ראה הודעה למעלה' : 'שגיאה בשמירת הסימון')
    } finally {
      setPending(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="no-print" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 13, color: '#6B6560' }}>
        <span>סימון מי קיבל — נשמר אוטומטית</span>
        <strong style={{ color: '#1A1A1A' }}>{checkedCount} / {rows.length} נמסרו</strong>
      </div>

      {missingTable && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 12.5, color: '#9A3412', lineHeight: 1.7 }}>
          הסימונים לא יישמרו עדיין — צריך להריץ פעם אחת SQL ב-Supabase כדי ליצור את הטבלה. תגיד לעדן לבקש את זה.
        </div>
      )}

      <div style={{ border: '1px solid #E8E5E0', borderRadius: 8, overflow: 'hidden' }}>
        {rows.map((row, i) => {
          const key = keyOf(row)
          const isChecked = checked.has(key)
          const isPending = pending.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(row)}
              disabled={isPending}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                border: 'none',
                borderBottom: i < rows.length - 1 ? '1px solid #E8E5E0' : 'none',
                background: isChecked ? '#F0FDF4' : (i % 2 === 0 ? '#fff' : '#FAFAF8'),
                cursor: 'pointer',
                textAlign: 'right',
                opacity: isPending ? 0.6 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: isChecked ? '2px solid #16A34A' : '2px solid #D1CFC9',
                  background: isChecked ? '#16A34A' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {isChecked ? '✓' : ''}
              </span>
              <span style={{ flexShrink: 0, fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: 'center', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1 }}>
                {row.quantity}
              </span>
              <span style={{ flex: 1, fontSize: 15, textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1 }}>
                {row.customer_name}
              </span>
              <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#6B6560', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1 }}>
                {row.variant}
              </span>
            </button>
          )
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F2F0EC', fontWeight: 700, fontSize: 14 }}>
          <span>סה&quot;כ ({variantLabel})</span>
          <span>{totalQty}</span>
        </div>
      </div>
    </div>
  )
}
