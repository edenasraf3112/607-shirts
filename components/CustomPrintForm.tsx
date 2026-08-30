'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type PrintType = 'sticker' | 'flag' | 'both'

const PRINT_TYPES: { value: PrintType; label: string; desc: string }[] = [
  { value: 'sticker', label: 'מדבקה', desc: 'מדבקה להדפסה ביתית' },
  { value: 'flag', label: 'דגל', desc: 'דגל להדפסה ביתית' },
  { value: 'both', label: 'גם וגם', desc: 'הקובץ מתאים לשניהם' },
]

export default function CustomPrintForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    width: '', height: '',
    print_type: 'sticker' as PrintType,
    notes: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { toast.error('הקובץ גדול מדי — מקסימום 20MB'); return }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { toast.error('יש לצרף קובץ'); return }
    if (!form.name) { toast.error('יש למלא שם'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', form.name)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('width', form.width)
      fd.append('height', form.height)
      fd.append('print_type', form.print_type)
      fd.append('notes', form.notes)

      const res = await fetch('/api/submit-custom-print', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשליחה')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <CheckCircle className="mx-auto mb-4 text-charcoal" size={40} strokeWidth={1.5} />
        <h3 className="font-serif text-3xl text-charcoal mb-3">הקובץ נשלח!</h3>
        <p className="text-warm-gray text-sm max-w-sm mx-auto leading-relaxed">
          הקובץ נשלח לבדיקה שלנו. ברגע שנעלה אותו לאתר — תקבלו עדכון.
        </p>
        <button
          onClick={() => { setSubmitted(false); setFile(null); setForm({ name: '', email: '', phone: '', width: '', height: '', print_type: 'sticker', notes: '' }) }}
          className="mt-8 text-xs tracking-widest uppercase text-warm-gray hover:text-charcoal transition-colors"
          style={{ letterSpacing: '0.15em' }}
        >
          שלח קובץ נוסף
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* File upload */}
      <div>
        <label className="form-label">קובץ * <span className="text-warm-gray/60 font-normal">(PNG, JPG, SVG, PDF — עד 20MB)</span></label>
        <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleFile} className="hidden" />
        {file ? (
          <div className="flex items-center gap-3 p-4 border border-charcoal bg-white">
            <div className="flex-1 text-sm text-charcoal truncate">{file.name}</div>
            <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }} className="text-warm-gray hover:text-red-brand transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-light-gray hover:border-charcoal transition-colors p-8 flex flex-col items-center gap-3 bg-cream-dark hover:bg-cream"
          >
            <Upload size={24} className="text-warm-gray" strokeWidth={1.5} />
            <span className="text-sm text-warm-gray">לחצו להעלאת קובץ</span>
          </button>
        )}
      </div>

      {/* Print type */}
      <div>
        <label className="form-label">סוג ההדפס *</label>
        <div className="grid grid-cols-3 gap-3">
          {PRINT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, print_type: t.value }))}
              className={`p-4 border text-center transition-colors ${form.print_type === t.value ? 'border-charcoal bg-charcoal text-cream' : 'border-light-gray bg-white text-charcoal hover:border-charcoal'}`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className={`text-xs mt-1 ${form.print_type === t.value ? 'text-cream/70' : 'text-warm-gray'}`}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <label className="form-label">מידות (ב-CM) — אופציונלי</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="רוחב"
              value={form.width}
              onChange={e => setForm(f => ({ ...f, width: e.target.value }))}
            />
          </div>
          <div>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="גובה"
              value={form.height}
              onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">שם *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="form-label">טלפון</label>
          <input
            className="form-input"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">אימייל <span className="text-warm-gray/60 font-normal">(לקבלת עדכון כשיועלה לאתר)</span></label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">הערות — אופציונלי</label>
        <textarea
          className="form-input h-24 resize-none"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="תיאור, מקור, שימוש מיועד..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-charcoal text-cream text-sm tracking-widest uppercase hover:bg-charcoal/80 transition-colors disabled:opacity-50"
        style={{ letterSpacing: '0.2em' }}
      >
        {loading ? 'שולח...' : 'שלח לבדיקה'}
      </button>
    </form>
  )
}
