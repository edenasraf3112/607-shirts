'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NewDiscountForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', expires_at: '', max_uses: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.value) { toast.error('יש למלא קוד וערך'); return }
    setLoading(true)
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        expires_at: form.expires_at || null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      }),
    })
    if (!res.ok) toast.error('שגיאה')
    else { toast.success('קוד נוצר!'); setForm({ code: '', type: 'percent', value: '', expires_at: '', max_uses: '' }); router.refresh() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
      <div>
        <label className="form-label">קוד</label>
        <input className="form-input uppercase" placeholder="LEIZER10" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
      </div>
      <div>
        <label className="form-label">סוג</label>
        <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
          <option value="percent">אחוז %</option>
          <option value="fixed">סכום קבוע ₪</option>
        </select>
      </div>
      <div>
        <label className="form-label">ערך</label>
        <input className="form-input" type="number" placeholder="10" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required min="0" />
      </div>
      <div>
        <label className="form-label">תפוגה</label>
        <input className="form-input" type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} />
      </div>
      <div>
        <label className="form-label">מקס שימושים</label>
        <input className="form-input" type="number" placeholder="∞" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} min="1" />
      </div>
      <div className="md:col-span-5">
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {loading ? '...' : 'צור קוד'}
        </button>
      </div>
    </form>
  )
}
