'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Popup } from '@/lib/supabase'

const PAGE_OPTIONS = ['all', 'home', 'shop', 'story', 'contact', 'cart']

export default function PopupForm({ popup }: { popup?: Partial<Popup> }) {
  const router = useRouter()
  const isNew = !popup?.id
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [bgImageSettings, setBgImageSettings] = useState<string>(
    popup?.popup_settings?.backgroundImage || popup?.image || ''
  )
  const [form, setForm] = useState({
    title: popup?.title || '',
    text: popup?.text || '',
    image: popup?.popup_settings?.backgroundImage || popup?.image || '',
    button_text: popup?.button_text || '',
    button_link: popup?.button_link || '',
    bg_color: popup?.bg_color || '#FFFFFF',
    text_color: popup?.text_color || '#1A1A1A',
    is_active: popup?.is_active !== false,
    pages: popup?.pages || ['all'],
    trigger: popup?.trigger || 'immediate',
    trigger_delay: popup?.trigger_delay || 3,
  })

  function togglePage(page: string) {
    setForm(f => ({ ...f, pages: f.pages.includes(page) ? f.pages.filter(p => p !== page) : [...f.pages, page] }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'branding')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) { setForm(f => ({ ...f, image: data.url })); setBgImageSettings(data.url); toast.success('תמונה הועלתה') }
    else toast.error('שגיאה בהעלאה')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) { toast.error('יש למלא כותרת'); return }
    setLoading(true)
    const res = isNew
      ? await fetch('/api/admin/popups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/admin/popups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: popup!.id, ...form, bgImageSettings }) })
    const data = await res.json()
    if (data.ok) { toast.success(isNew ? 'פופאפ נוצר!' : 'נשמר!'); router.push('/admin/popups'); router.refresh() }
    else toast.error('שגיאה בשמירה')
    setLoading(false)
  }

  const Preview = () => (
    <div
      className="rounded-lg text-center border overflow-hidden shadow-xl"
      style={{ background: form.bg_color, color: form.text_color, maxWidth: 448 }}
    >
      {form.image && (
        <div className="w-full h-48 overflow-hidden">
          <img src={form.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-8">
        <h3 className="font-serif text-3xl mb-3">{form.title || 'כותרת הפופאפ'}</h3>
        {form.text && <p className="text-sm opacity-80 mb-6">{form.text}</p>}
        {form.button_text && (
          <span className="inline-block px-8 py-3 text-sm tracking-widest uppercase border border-current">
            {form.button_text}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} dir="rtl" className="space-y-4">
        <div>
          <label className="form-label">כותרת *</label>
          <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        </div>
        <div>
          <label className="form-label">טקסט</label>
          <textarea className="form-input h-20 resize-none" value={form.text} onChange={e => setForm({...form, text: e.target.value})} />
        </div>

        {/* Image upload */}
        <div>
          <label className="form-label">
            תמונת רקע
            <span className="normal-case font-normal text-warm-gray mr-2">(רוחב 448px × גובה 192px מומלץ)</span>
          </label>
          <div className="flex gap-2">
            <input
              className="form-input flex-1 text-xs"
              value={form.image}
              onChange={e => { setForm({...form, image: e.target.value}); setBgImageSettings(e.target.value) }}
              placeholder="הדבק קישור או העלה קובץ"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded disabled:opacity-50 whitespace-nowrap"
            >
              <Upload size={14} />
              {uploading ? 'מעלה...' : 'העלה'}
            </button>
            {form.image && (
              <button type="button" onClick={() => { setForm({...form, image: ''}); setBgImageSettings('') }} className="p-2 text-warm-gray hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {form.image && (
            <div className="mt-2 h-20 rounded overflow-hidden border border-light-gray">
              <img src={form.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">טקסט כפתור</label>
            <input className="form-input" value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} />
          </div>
          <div>
            <label className="form-label">קישור כפתור</label>
            <input className="form-input" value={form.button_link} onChange={e => setForm({...form, button_link: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">צבע רקע</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.bg_color} onChange={e => setForm({...form, bg_color: e.target.value})} className="w-10 h-10 cursor-pointer border border-light-gray" />
              <input className="form-input flex-1 text-xs" value={form.bg_color} onChange={e => setForm({...form, bg_color: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="form-label">צבע טקסט</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.text_color} onChange={e => setForm({...form, text_color: e.target.value})} className="w-10 h-10 cursor-pointer border border-light-gray" />
              <input className="form-input flex-1 text-xs" value={form.text_color} onChange={e => setForm({...form, text_color: e.target.value})} />
            </div>
          </div>
        </div>
        <div>
          <label className="form-label">הפעלה</label>
          <select className="form-select" value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value as any})}>
            <option value="immediate">מיד</option>
            <option value="delayed">אחרי X שניות</option>
            <option value="exit">ביציאה מהאתר</option>
          </select>
          {form.trigger === 'delayed' && (
            <input className="form-input mt-2" type="number" min="1" value={form.trigger_delay} onChange={e => setForm({...form, trigger_delay: parseInt(e.target.value)})} placeholder="שניות" />
          )}
        </div>
        <div>
          <label className="form-label">עמודים</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PAGE_OPTIONS.map(page => (
              <button key={page} type="button" onClick={() => togglePage(page)}
                className={`px-3 py-1.5 text-xs border rounded transition-colors ${form.pages.includes(page) ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                {page}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-charcoal" />
          <span className="text-sm text-charcoal">פעיל</span>
        </label>
        <div className="flex gap-3 pt-4 border-t border-light-gray">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
            {loading ? 'שומר...' : isNew ? 'צור פופאפ' : 'שמור'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
            ביטול
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <p className="form-label">תצוגה מקדימה</p>
          <p className="text-xs text-warm-gray">גודל פופאפ: עד 448×∞px | תמונה: 448×192px</p>
        </div>
        <div className="bg-cream-dark rounded-xl p-8 flex items-center justify-center min-h-64">
          <Preview />
        </div>
      </div>
    </div>
  )
}
