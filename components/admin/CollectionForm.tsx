'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Collection } from '@/lib/supabase'
import { Upload } from 'lucide-react'
import Image from 'next/image'
import { COLLECTION_PROGRESS_STEPS, type ProgressSteps } from '@/lib/clothing-categories'

type SimpleProduct = { id: string; name: string; images: string[]; collection_id?: string | null }
type Props = { collection?: Partial<Collection>; products?: SimpleProduct[] }

export default function CollectionForm({ collection, products = [] }: Props) {
  const router = useRouter()
  const isNew = !collection?.id
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    products.filter(p => p.collection_id === collection?.id).map(p => p.id)
  )
  const [progressSteps, setProgressSteps] = useState<ProgressSteps>(
    (collection?.progress_steps as ProgressSteps) || {}
  )
  const [form, setForm] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    cover_image: collection?.cover_image || '',
    open_date: collection?.open_date?.slice(0, 10) || '',
    close_date: collection?.close_date?.slice(0, 10) || '',
    status: collection?.status || 'open',
    estimated_delivery: collection?.estimated_delivery || '',
    is_active: collection?.is_active !== false,
  })

  function toggleProgressStep(key: string) {
    setProgressSteps(prev => ({ ...prev, [key]: !prev[key as keyof ProgressSteps] }))
  }

  function toggleProduct(id: string) {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'collections')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { toast.error('שגיאה בהעלאה'); setUploading(false); return }
    setForm(f => ({ ...f, cover_image: data.url }))
    setUploading(false)
    toast.success('תמונה הועלתה')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.open_date || !form.close_date) {
      toast.error('יש למלא שם ותאריכים')
      return
    }
    setLoading(true)
    const res = isNew
      ? await fetch('/api/admin/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, progress_steps: progressSteps, selectedProducts }),
        })
      : await fetch('/api/admin/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: collection!.id, ...form, progress_steps: progressSteps, selectedProducts }),
        })

    if (!res.ok) toast.error('שגיאה בשמירה')
    else { toast.success(isNew ? 'קולקציה נוצרה!' : 'נשמר!'); router.push('/admin/collections'); router.refresh() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-5 max-w-2xl">
      <div>
        <label className="form-label">שם קולקציה *</label>
        <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      <div>
        <label className="form-label">תיאור</label>
        <textarea className="form-input h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>

      {/* Cover image */}
      <div>
        <label className="form-label">תמונת נושא</label>
        {form.cover_image && (
          <div className="relative h-40 w-full mb-2 overflow-hidden rounded">
            <Image src={form.cover_image} alt="" fill className="object-cover" />
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm cursor-pointer hover:border-charcoal transition-colors rounded">
          <Upload size={14} />
          {uploading ? 'מעלה...' : 'העלה תמונה'}
          <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploading} />
        </label>
        <input
          className="form-input mt-2 text-xs"
          placeholder="או URL תמונה"
          value={form.cover_image}
          onChange={e => setForm({...form, cover_image: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">תאריך פתיחה *</label>
          <input className="form-input" type="date" value={form.open_date} onChange={e => setForm({...form, open_date: e.target.value})} required />
        </div>
        <div>
          <label className="form-label">תאריך סגירה *</label>
          <input className="form-input" type="date" value={form.close_date} onChange={e => setForm({...form, close_date: e.target.value})} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">סטטוס</label>
          <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
            <option value="open">פתוחה להזמנות</option>
            <option value="closed">נסגרה</option>
            <option value="production">בייצור</option>
            <option value="shipped">נשלחה</option>
          </select>
        </div>
        <div>
          <label className="form-label">זמן אספקה משוער</label>
          <input className="form-input" placeholder="למשל: 3-4 שבועות" value={form.estimated_delivery} onChange={e => setForm({...form, estimated_delivery: e.target.value})} />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-charcoal" />
        <span className="text-sm text-charcoal">הצג באתר</span>
      </label>

      {/* Collection Progress Steps */}
      <div className="border border-light-gray rounded-lg p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-charcoal">התקדמות קולקציה</p>
          <p className="text-xs text-warm-gray mt-0.5">סמן שלבים שהושלמו — הלקוחות יראו זאת בחשבון שלהם</p>
        </div>
        <div className="space-y-3">
          {COLLECTION_PROGRESS_STEPS.map(step => {
            const isDone = !!progressSteps[step.key as keyof ProgressSteps]
            return (
              <label key={step.key} className="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => toggleProgressStep(step.key)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors text-sm ${
                    isDone
                      ? 'bg-charcoal border-charcoal text-cream'
                      : 'border-light-gray group-hover:border-charcoal/50 text-warm-gray'
                  }`}
                >
                  {isDone ? '✓' : step.emoji}
                </button>
                <div>
                  <p className={`text-sm font-medium transition-colors ${isDone ? 'text-charcoal' : 'text-warm-gray'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-warm-gray/70">{step.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {products.length > 0 && (
        <div className="border-t border-light-gray pt-5">
          <label className="form-label">מוצרים בקולקציה זו</label>
          <p className="text-xs text-warm-gray mb-3">סמן את המוצרים שמשתייכים לקולקציה הזו</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
            {products.map(p => (
              <label
                key={p.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer text-sm transition-colors ${
                  selectedProducts.includes(p.id) ? 'border-charcoal bg-cream-dark' : 'border-light-gray hover:border-charcoal/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="w-4 h-4 accent-charcoal flex-shrink-0"
                />
                {p.images?.[0] && (
                  <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden">
                    <Image src={p.images[0]} alt="" fill className="object-cover" />
                  </div>
                )}
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-light-gray">
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {loading ? 'שומר...' : isNew ? 'צור קולקציה' : 'שמור שינויים'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
          ביטול
        </button>
      </div>
    </form>
  )
}
