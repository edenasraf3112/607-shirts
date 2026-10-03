'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import type { OrderItem } from '@/lib/supabase'

export default function OrderItemsEditor({
  orderId,
  initialItems,
  discountAmount,
}: {
  orderId: string
  initialItems: OrderItem[]
  discountAmount?: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [saving, setSaving] = useState(false)

  function updateItem(i: number, patch: Partial<OrderItem>) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  function startEditing() {
    setItems(initialItems)
    setEditing(true)
  }

  function cancel() {
    setItems(initialItems)
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const rawTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = Math.max(rawTotal - (discountAmount || 0), 0)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total }),
      })
      if (!res.ok) throw new Error()
      toast.success('ההזמנה עודכנה')
      setEditing(false)
      router.refresh()
    } catch {
      toast.error('שגיאה בשמירת השינויים')
    }
    setSaving(false)
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) - (discountAmount || 0)

  return (
    <div className="bg-white rounded-xl border border-light-gray p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-charcoal tracking-wider uppercase">פריטים</h2>
        {!editing ? (
          <button
            onClick={startEditing}
            className="flex items-center gap-1.5 text-xs text-warm-gray hover:text-charcoal transition-colors"
          >
            <Pencil size={13} /> ערוך מידה / צבע / כמות
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal px-2 py-1"
            >
              <X size={13} /> ביטול
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-charcoal text-cream px-3 py-1.5 rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-50"
            >
              <Check size={13} /> {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        )}
      </div>

      <table className="w-full text-sm">
        <thead className="border-b border-light-gray">
          <tr>
            <th className="text-right py-2 font-medium text-warm-gray">מוצר</th>
            <th className="text-right py-2 font-medium text-warm-gray">מידה</th>
            <th className="text-right py-2 font-medium text-warm-gray">צבע</th>
            <th className="text-right py-2 font-medium text-warm-gray">כמות</th>
            <th className="text-right py-2 font-medium text-warm-gray">מחיר</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-light-gray last:border-0">
              <td className="py-2">{item.product_name}</td>
              <td className="py-2">
                {editing ? (
                  <input
                    className="form-input text-sm w-20 py-1"
                    value={item.size || ''}
                    onChange={e => updateItem(i, { size: e.target.value })}
                  />
                ) : (item.size || '-')}
              </td>
              <td className="py-2">
                {editing ? (
                  <input
                    className="form-input text-sm w-24 py-1"
                    value={item.color || ''}
                    onChange={e => updateItem(i, { color: e.target.value })}
                  />
                ) : (item.color || '-')}
              </td>
              <td className="py-2">
                {editing ? (
                  <input
                    type="number"
                    min={1}
                    className="form-input text-sm w-16 py-1"
                    value={item.quantity}
                    onChange={e => updateItem(i, { quantity: Math.max(Number(e.target.value) || 1, 1) })}
                  />
                ) : item.quantity}
              </td>
              <td className="py-2">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between pt-4 mt-4 border-t border-light-gray font-medium text-charcoal">
        <span>סה&quot;כ</span>
        <span>{formatPrice(Math.max(total, 0))}</span>
      </div>
      {editing && (
        <p className="text-xs text-warm-gray mt-3">
          שינוי כמות משנה את הסכום הכולל של ההזמנה. שינוי מידה/צבע לא משפיע על המחיר.
        </p>
      )}
    </div>
  )
}
