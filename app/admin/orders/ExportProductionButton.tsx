'use client'

import { useState } from 'react'
import { X, FileSpreadsheet, Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { DEMO_EMAIL } from '@/lib/demo'

type Item = { id: string; name: string }

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']

export default function ExportProductionButton({ collections, products = [] }: { collections: Item[]; products?: Item[] }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<'he' | 'en'>('he')
  const [filter, setFilter] = useState<'all_paid' | 'collection' | 'product' | 'date_range'>('all_paid')
  const [collectionId, setCollectionId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [productId, setProductId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [excludeDemo, setExcludeDemo] = useState(true)

  async function exportSheet() {
    setLoading(true)
    try {
      // all_paid → paid (uses paid_at IS NOT NULL on the server)
      const apiFilter = filter === 'all_paid' ? 'paid' : filter
      const params = new URLSearchParams({ filter: apiFilter, lang })
      if (filter === 'collection' && collectionId) params.set('collection_id', collectionId)
      if (filter === 'product') {
        const selectedProduct = products.find(p => p.id === productId)
        const query = selectedProduct ? selectedProduct.name : productQuery
        if (query) params.set('product', query)
      }
      if (filter === 'date_range') {
        if (dateFrom) params.set('date_from', dateFrom)
        if (dateTo) params.set('date_to', dateTo)
      }
      if (excludeDemo) params.set('exclude_demo', 'true')

      const res = await fetch(`/api/admin/orders/production-sheet?${params}`)
      const data = await res.json()
      if (!data.rows?.length) {
        toast.error(lang === 'he' ? 'אין נתונים לייצוא' : 'No data to export')
        setLoading(false)
        return
      }

      const sorted = [...data.rows].sort((a: any, b: any) => {
        if (a.product_name !== b.product_name) return a.product_name.localeCompare(b.product_name)
        if (a.color !== b.color) return a.color.localeCompare(b.color)
        const ai = SIZE_ORDER.indexOf((a.size || '').toUpperCase())
        const bi = SIZE_ORDER.indexOf((b.size || '').toUpperCase())
        if (ai !== -1 && bi !== -1) return ai - bi
        return (a.size || '').localeCompare(b.size || '')
      })

      const isHe = lang === 'he'
      const headers = isHe
        ? ['שם מוצר', 'צבע', 'מידה', 'כמות']
        : ['Product Name', 'Color', 'Size', 'Quantity']

      const rows = sorted.map((r: any) => [
        r.product_name,
        r.color || '—',
        r.size || '—',
        r.quantity,
      ])

      const totalQty = sorted.reduce((s: number, r: any) => s + r.quantity, 0)
      rows.push([isHe ? 'סה"כ פריטים' : 'Total Shirts', '', '', totalQty])

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      ws['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 10 }, { wch: 10 }]

      // Bold the header row and total row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let C = range.s.c; C <= range.e.c; C++) {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
        if (headerCell) headerCell.s = { font: { bold: true } }
        const totalCell = ws[XLSX.utils.encode_cell({ r: rows.length, c: C })]
        if (totalCell) totalCell.s = { font: { bold: true } }
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, isHe ? 'קובץ ייצור' : 'Production Sheet')

      const filename = isHe ? 'production-sheet-he.xlsx' : 'production-sheet-en.xlsx'
      XLSX.writeFile(wb, filename)

      setOpen(false)
      toast.success(isHe ? `הורד בהצלחה — ${totalQty} פריטים` : `Downloaded — ${totalQty} items`)
    } catch {
      toast.error('שגיאה בייצוא')
    }
    setLoading(false)
  }

  const canExport =
    (filter !== 'collection' || collectionId !== '') &&
    (filter !== 'product' || productId !== '' || productQuery !== '')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
      >
        <FileSpreadsheet size={14} />
        ייצוא למפעל
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md mx-4 rounded-xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray flex-shrink-0" dir="rtl">
              <div>
                <h2 className="font-semibold text-charcoal">ייצוא קובץ ייצור</h2>
                <p className="text-xs text-warm-gray mt-0.5">כמויות מאוחדות לפי מוצר / צבע / מידה</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-warm-gray hover:text-charcoal p-1">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1" dir="rtl">
              {/* Language */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-2 uppercase tracking-wider">שפת הקובץ</label>
                <div className="flex gap-2">
                  {(['he', 'en'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${lang === l ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
                    >
                      {l === 'he' ? 'עברית' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter */}
              <div>
                <label className="block text-xs font-medium text-charcoal mb-2 uppercase tracking-wider">סינון הזמנות</label>
                <div className="space-y-2.5">
                  {([
                    { value: 'all_paid', label: 'כל ההזמנות ששולמו' },
                    { value: 'collection', label: 'לפי קולקציה' },
                    { value: 'product', label: 'לפי מוצר' },
                    { value: 'date_range', label: 'לפי טווח תאריכים' },
                  ] as const).map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="prod-filter"
                        value={opt.value}
                        checked={filter === opt.value}
                        onChange={() => { setFilter(opt.value); setProductId(''); setProductQuery('') }}
                        className="accent-charcoal w-4 h-4"
                      />
                      <span className="text-sm text-charcoal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional inputs */}
              {filter === 'collection' && (
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">בחר קולקציה</label>
                  <select
                    value={collectionId}
                    onChange={e => setCollectionId(e.target.value)}
                    className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right bg-white"
                    dir="rtl"
                  >
                    <option value="">— בחר קולקציה —</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {filter === 'product' && (
                <div className="space-y-2">
                  {products.length > 0 ? (
                    <div>
                      <label className="block text-xs text-warm-gray mb-1.5">בחר מוצר</label>
                      <select
                        value={productId}
                        onChange={e => { setProductId(e.target.value); setProductQuery('') }}
                        className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right bg-white"
                        dir="rtl"
                      >
                        <option value="">— כל המוצרים —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-warm-gray mb-1.5">שם מוצר (חיפוש חלקי)</label>
                      <input
                        type="text"
                        value={productQuery}
                        onChange={e => setProductQuery(e.target.value)}
                        placeholder="לדוגמה: T-Shirt"
                        className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal text-right"
                        dir="rtl"
                      />
                    </div>
                  )}
                </div>
              )}

              {filter === 'date_range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-warm-gray mb-1.5">מתאריך</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-warm-gray mb-1.5">עד תאריך</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="w-full border border-light-gray rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-light-gray space-y-3 flex-shrink-0" dir="rtl">
              {/* Exclude demo toggle */}
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={excludeDemo}
                  onChange={e => setExcludeDemo(e.target.checked)}
                  className="w-4 h-4 accent-charcoal flex-shrink-0"
                />
                <div>
                  <p className="text-sm text-charcoal">ללא דמו</p>
                  <p className="text-xs text-warm-gray">מסנן הזמנות של {DEMO_EMAIL}</p>
                </div>
              </label>
              {/* Print/PDF — primary on mobile */}
              <a
                href={`/admin/orders/production-print?status=${filter === 'all_paid' ? 'paid' : filter === 'collection' ? 'all' : filter === 'date_range' ? 'all' : filter === 'product' ? 'all' : 'all'}${filter === 'collection' && collectionId ? `&collection_id=${collectionId}` : ''}&exclude_demo=${excludeDemo}&lang=${lang}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg w-full"
              >
                <Printer size={14} />
                הדפס / שמור PDF
              </a>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
                >
                  ביטול
                </button>
                <button
                  onClick={exportSheet}
                  disabled={loading || !canExport}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2 border border-charcoal text-charcoal text-sm hover:bg-charcoal hover:text-cream transition-colors rounded-lg disabled:opacity-50"
                >
                  <Download size={14} />
                  {loading ? 'מייצא...' : 'Excel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
