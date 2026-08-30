'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { X, Upload, Plus, Trash2, ChevronUp, ChevronDown, Eye, ExternalLink, RefreshCw } from 'lucide-react'
import type { Product, Collection, FAQItem, SizeChart } from '@/lib/supabase'
import { CLOTHING_CATEGORIES } from '@/lib/clothing-categories'
import SizeChartDisplay from '@/components/SizeChartDisplay'

type Props = {
  product?: Partial<Product>
  collections: Collection[]
  sizeCharts?: SizeChart[]
}

const TAG_OPTIONS = ['all', 'גברים', 'נשים', 'אקססוריז', 'limited', 'sale']

export default function ProductForm({ product, collections, sizeCharts = [] }: Props) {
  const router = useRouter()
  const isNew = !product?.id
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [faqs, setFaqs] = useState<FAQItem[]>(product?.faqs || [])
  const [uploading, setUploading] = useState(false)
  const [chartsList, setChartsList] = useState<SizeChart[]>(sizeCharts)
  const [refreshingCharts, setRefreshingCharts] = useState(false)
  const [sizeChartPreviewOpen, setSizeChartPreviewOpen] = useState(false)
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price?.toString() || '',
    sale_price: product?.sale_price?.toString() || '',
    short_description: product?.short_description || '',
    full_description: product?.full_description || '',
    sizes: (product?.sizes || []).join(', '),
    colors: (product?.colors || []).join(', '),
    tags: product?.tags || ['all'],
    clothing_category: product?.clothing_category || '',
    collection_id: product?.collection_id || '',
    display_order: product?.display_order?.toString() || '0',
    in_stock: product?.in_stock !== false,
    out_of_stock_sizes: product?.out_of_stock_sizes || [],
    out_of_stock_colors: product?.out_of_stock_colors || [],
    available_from: product?.available_from ? product.available_from.slice(0, 10) : '',
    available_until: product?.available_until ? product.available_until.slice(0, 10) : '',
    size_chart_id: product?.size_chart_id || '',
  })

  const selectedSizeChart = chartsList.find(c => c.id === form.size_chart_id)

  async function refreshSizeCharts() {
    setRefreshingCharts(true)
    try {
      const res = await fetch('/api/admin/size-charts')
      const data = await res.json()
      if (res.ok) setChartsList(data.data || [])
    } catch {}
    setRefreshingCharts(false)
  }

  const sizeList = form.sizes.split(',').map(s => s.trim()).filter(Boolean)
  const colorList = form.colors.split(',').map(s => s.trim()).filter(Boolean)

  function toggleOutOfStockSize(size: string) {
    setForm(f => ({
      ...f,
      out_of_stock_sizes: f.out_of_stock_sizes.includes(size)
        ? f.out_of_stock_sizes.filter(s => s !== size)
        : [...f.out_of_stock_sizes, size],
    }))
  }

  function toggleOutOfStockColor(color: string) {
    setForm(f => ({
      ...f,
      out_of_stock_colors: f.out_of_stock_colors.includes(color)
        ? f.out_of_stock_colors.filter(c => c !== color)
        : [...f.out_of_stock_colors, color],
    }))
  }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  function addFaq() {
    setFaqs(f => [...f, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, question: '', answer: '' }])
  }
  function updateFaq(id: string, patch: Partial<FAQItem>) {
    setFaqs(f => f.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  function removeFaq(id: string) {
    setFaqs(f => f.filter(item => item.id !== id))
  }
  function moveFaq(index: number, dir: -1 | 1) {
    setFaqs(f => {
      const next = [...f]
      const target = index + dir
      if (target < 0 || target >= next.length) return f
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'products')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { toast.error('שגיאה בהעלאה'); setUploading(false); return }
    setImages(prev => [...prev, data.url])
    setUploading(false)
    toast.success('תמונה הועלתה')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('יש למלא שם ומחיר'); return }
    setLoading(true)

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      short_description: form.short_description,
      full_description: form.full_description,
      images,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.includes('all') ? form.tags : ['all', ...form.tags],
      clothing_category: form.clothing_category || null,
      collection_id: form.collection_id || null,
      display_order: parseInt(form.display_order) || 0,
      in_stock: form.in_stock,
      out_of_stock_sizes: form.out_of_stock_sizes.filter(s => sizeList.includes(s)),
      out_of_stock_colors: form.out_of_stock_colors.filter(c => colorList.includes(c)),
      available_from: form.available_from ? new Date(form.available_from).toISOString() : null,
      available_until: form.available_until ? new Date(form.available_until).toISOString() : null,
      size_chart_id: form.size_chart_id || null,
      faqs: faqs.filter(f => f.question.trim() || f.answer.trim()),
    }

    const res = isNew
      ? await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product!.id, ...payload }),
        })

    if (!res.ok) {
      toast.error('שגיאה בשמירה')
    } else {
      toast.success(isNew ? 'מוצר נוצר!' : 'נשמר!')
      router.push('/admin/products')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">שם מוצר *</label>
          <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div>
          <label className="form-label">מחיר (₪) *</label>
          <input className="form-input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" step="0.01" />
        </div>
        <div>
          <label className="form-label">מחיר מבצע (₪)</label>
          <input className="form-input" type="number" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} min="0" step="0.01" />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">תיאור קצר</label>
          <input className="form-input" value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">תיאור מלא</label>
          <textarea className="form-input h-32 resize-none" value={form.full_description} onChange={e => setForm({...form, full_description: e.target.value})} />
        </div>
        <div>
          <label className="form-label">מידות (מופרדות בפסיק)</label>
          <input className="form-input" placeholder="S, M, L, XL" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} />
        </div>
        <div>
          <label className="form-label">צבעים (מופרדים בפסיק)</label>
          <input className="form-input" placeholder="לבן, שחור" value={form.colors} onChange={e => setForm({...form, colors: e.target.value})} />
        </div>
        {sizeList.length > 0 && (
          <div className="md:col-span-2">
            <label className="form-label">סמן מידות שאזלו</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {sizeList.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleOutOfStockSize(size)}
                  className={`px-3 py-1.5 text-xs border transition-colors rounded ${
                    form.out_of_stock_sizes.includes(size)
                      ? 'bg-red-50 text-red-600 border-red-300 line-through'
                      : 'border-light-gray text-warm-gray hover:border-charcoal'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
        {colorList.length > 0 && (
          <div className="md:col-span-2">
            <label className="form-label">סמן צבעים שאזלו</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colorList.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleOutOfStockColor(color)}
                  className={`px-3 py-1.5 text-xs border transition-colors rounded ${
                    form.out_of_stock_colors.includes(color)
                      ? 'bg-red-50 text-red-600 border-red-300 line-through'
                      : 'border-light-gray text-warm-gray hover:border-charcoal'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="form-label">קטגוריית לבוש</label>
          <select
            className="form-select"
            value={form.clothing_category}
            onChange={e => setForm({...form, clothing_category: e.target.value})}
          >
            <option value="">— בחר קטגוריה —</option>
            {CLOTHING_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-xs text-warm-gray mt-1">משמש לזיהוי מידה מועדפת לפי קטגוריה עבור כל לקוח</p>
        </div>
        <div>
          <label className="form-label">קולקציה</label>
          <select className="form-select" value={form.collection_id} onChange={e => setForm({...form, collection_id: e.target.value})}>
            <option value="">ללא קולקציה</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">סדר הופעה</label>
          <input className="form-input" type="number" value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} min="0" />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="form-label">תגיות</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 text-xs border transition-colors rounded ${
                form.tags.includes(tag) ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="form-label">תמונות</label>
        <div className="flex flex-wrap gap-3 mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 group">
              <Image src={img} alt="" fill className="object-cover rounded" sizes="96px" />
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <label className={`w-24 h-24 border-2 border-dashed border-light-gray flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors rounded text-warm-gray ${uploading ? 'opacity-50' : ''}`}>
            <Upload size={18} />
            <span className="text-xs mt-1">{uploading ? 'מעלה...' : 'העלה'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
          </label>
        </div>
        <div className="mt-2">
          <input
            className="form-input text-xs"
            placeholder="או הוסף URL תמונה ישירות"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const val = (e.target as HTMLInputElement).value.trim()
                if (val) { setImages(prev => [...prev, val]); (e.target as HTMLInputElement).value = '' }
              }
            }}
          />
          <p className="text-xs text-warm-gray mt-1">לחץ Enter להוספה</p>
        </div>
      </div>

      {/* Stock */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.in_stock}
          onChange={e => setForm({...form, in_stock: e.target.checked})}
          className="w-4 h-4 accent-charcoal"
        />
        <span className="text-sm text-charcoal">במלאי</span>
      </label>

      {/* Availability dates */}
      <div className="border border-light-gray rounded-lg p-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-charcoal mb-1">זמינות לפי תאריך (אופציונלי)</p>
          <p className="text-xs text-warm-gray">השאר ריק כדי שהמוצר יהיה זמין תמיד. אם מוגדר — תצוין תגית "בקרוב" לפני התאריך ו"אזל" אחריו.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">זמין מ-</label>
            <input
              className="form-input"
              type="date"
              value={form.available_from}
              onChange={e => setForm({...form, available_from: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">זמין עד</label>
            <input
              className="form-input"
              type="date"
              value={form.available_until}
              onChange={e => setForm({...form, available_until: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Size chart */}
      <div className="border border-light-gray rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="form-label mb-0">טבלת מידות</label>
          <button type="button" onClick={refreshSizeCharts} disabled={refreshingCharts} className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal disabled:opacity-50">
            <RefreshCw size={12} className={refreshingCharts ? 'animate-spin' : ''} /> רענן רשימה
          </button>
        </div>
        <select
          className="form-select"
          value={form.size_chart_id}
          onChange={e => setForm({ ...form, size_chart_id: e.target.value })}
        >
          <option value="">ללא טבלת מידות</option>
          {chartsList.map(c => (
            <option key={c.id} value={c.id}>{c.title}{c.status === 'draft' ? ' (טיוטה — לא מוצג ללקוח)' : ''}</option>
          ))}
        </select>
        {selectedSizeChart && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button type="button" onClick={() => setSizeChartPreviewOpen(true)} className="flex items-center gap-1 text-charcoal hover:underline">
              <Eye size={12} /> תצוגה מקדימה
            </button>
            <a href={`/admin/size-charts/${selectedSizeChart.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-charcoal hover:underline">
              <ExternalLink size={12} /> פתח לעריכה בטאב חדש
            </a>
            <button type="button" onClick={() => setForm({ ...form, size_chart_id: '' })} className="text-red-500 hover:text-red-700">
              הסר שיוך
            </button>
          </div>
        )}
        <a href="/admin/size-charts/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60 w-fit">
          <Plus size={14} /> צור טבלת מידות חדשה (בטאב חדש)
        </a>
        {sizeChartPreviewOpen && selectedSizeChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSizeChartPreviewOpen(false)} />
            <div className="relative z-10 bg-cream rounded-xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6">
              <button type="button" onClick={() => setSizeChartPreviewOpen(false)} aria-label="סגור" className="absolute left-4 top-4 text-warm-gray hover:text-charcoal">
                <X size={18} />
              </button>
              <SizeChartDisplay chart={selectedSizeChart} />
            </div>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="border border-light-gray rounded-lg p-4 space-y-3">
        <label className="form-label">שאלות ותשובות</label>
        {faqs.map((faq, i) => (
          <div key={faq.id} className="border border-light-gray rounded p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  className="form-input text-sm"
                  placeholder="שאלה"
                  value={faq.question}
                  onChange={e => updateFaq(faq.id, { question: e.target.value })}
                />
                <textarea
                  className="form-input text-sm h-20 resize-none"
                  placeholder="תשובה"
                  value={faq.answer}
                  onChange={e => updateFaq(faq.id, { answer: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => moveFaq(i, -1)} disabled={i === 0} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => removeFaq(faq.id)} className="p-1.5 text-warm-gray hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addFaq}
          className="flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60"
        >
          <Plus size={14} /> הוסף שאלה
        </button>
      </div>

      <div className="flex gap-3 pt-4 border-t border-light-gray">
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {loading ? 'שומר...' : isNew ? 'צור מוצר' : 'שמור שינויים'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
          ביטול
        </button>
      </div>
    </form>
  )
}
