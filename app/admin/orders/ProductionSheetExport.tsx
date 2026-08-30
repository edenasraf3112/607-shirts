'use client'

import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { getStatusLabel } from '@/lib/utils'

type Option = { id: string; name: string }

const ALL_STATUSES = ['received', 'pending_payment', 'paid', 'production', 'packing', 'shipped', 'delivered']
const PAID_STATUSES = ['paid', 'production', 'packing', 'shipped', 'delivered']

export default function ProductionSheetExport({ collections, products }: { collections: Option[]; products: Option[] }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<'he' | 'en'>('he')
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx')
  const [collectionId, setCollectionId] = useState('')
  const [productId, setProductId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statuses, setStatuses] = useState<string[]>(PAID_STATUSES)
  const [loading, setLoading] = useState(false)

  function toggleStatus(status: string) {
    setStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
  }

  async function handleExport() {
    if (statuses.length === 0) { toast.error('יש לבחור לפחות סטטוס אחד'); return }
    setLoading(true)
    const params = new URLSearchParams({ lang, format, statuses: statuses.join(',') })
    if (collectionId) params.set('collectionId', collectionId)
    if (productId) params.set('productId', productId)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    try {
      const res = await fetch(`/api/admin/production-sheet?${params.toString()}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `production-sheet-${lang}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch {
      toast.error('שגיאה בייצוא')
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
      >
        <FileSpreadsheet size={14} /> ייצוא מידות למפעל
      </button>
      {open && (
        <div dir="rtl" className="absolute left-0 z-20 mt-2 w-80 bg-white border border-light-gray rounded-xl shadow-lg p-4 space-y-3">
          <div>
            <label className="form-label">שפת הקובץ</label>
            <select className="form-select" value={lang} onChange={e => setLang(e.target.value as 'he' | 'en')}>
              <option value="he">עברית</option>
              <option value="en">אנגלית</option>
            </select>
          </div>
          <div>
            <label className="form-label">פורמט קובץ</label>
            <select className="form-select" value={format} onChange={e => setFormat(e.target.value as 'xlsx' | 'pdf')}>
              <option value="xlsx">Excel (xlsx)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div>
            <label className="form-label">קולקציה</label>
            <select className="form-select" value={collectionId} onChange={e => setCollectionId(e.target.value)}>
              <option value="">כל הקולקציות</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">מוצר</label>
            <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">כל המוצרים</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="form-label">מתאריך</label>
              <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label">עד תאריך</label>
              <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">סטטוסים לכלול</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    statuses.includes(s) ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'
                  }`}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg"
          >
            {loading ? '...' : 'הורד קובץ'}
          </button>
        </div>
      )}
    </div>
  )
}
