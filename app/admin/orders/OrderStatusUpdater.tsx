'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStatusLabel, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUSES = ['received', 'pending_payment', 'paid', 'production', 'packing', 'shipped', 'delivered']

export default function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function update(newStatus: string) {
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (data.ok) { setStatus(newStatus); toast.success('סטטוס עודכן'); router.refresh() }
    else toast.error('שגיאה')
    setLoading(false)
  }

  return (
    <select
      value={status}
      onChange={e => update(e.target.value)}
      disabled={loading}
      className={`text-xs px-2 py-1.5 rounded border-0 cursor-pointer ${getStatusColor(status)} disabled:opacity-50`}
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{getStatusLabel(s)}</option>
      ))}
    </select>
  )
}
