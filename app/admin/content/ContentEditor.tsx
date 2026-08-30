'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload } from 'lucide-react'

const BRAND_FIELDS = [
  { key: 'brand_tagline', label: 'סלוגן המותג (כותרת גדולה)', type: 'text' },
  { key: 'brand_description', label: 'תיאור המותג (פסקה)', type: 'textarea' },
]

const IMPACT_FIELDS = [
  { key: 'impact_label', label: 'תגית קטנה מעל הכותרת', type: 'text', placeholder: 'כל רכישה — שווה יותר' },
  { key: 'impact_heading', label: 'כותרת ראשית (שורה חדשה = \\n)', type: 'textarea', placeholder: 'כשאתה קונה,\nאתה חלק מהסיפור' },
  { key: 'impact_text', label: 'פסקת טקסט', type: 'textarea', placeholder: 'כל רכישה תומכת ישירות...' },
  { key: 'impact_quote', label: 'ציטוט (ללא מרכאות)', type: 'text', placeholder: 'לובשים אותו, זוכרים אותו' },
]

const FOOTER_FIELDS = [
  { key: 'footer_instagram', label: 'קישור אינסטגרם', type: 'text' },
  { key: 'footer_whatsapp', label: 'מספר וואטסאפ', type: 'text' },
  { key: 'whatsapp_message', label: 'הודעת פתיחה וואטסאפ', type: 'text' },
]

export default function ContentEditor({ content }: { content: Record<string, string> }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>(content)
  const [loading, setLoading] = useState(false)
  const [uploadingImpact, setUploadingImpact] = useState(false)

  async function handleSave() {
    setLoading(true)
    const entries = Object.entries(form).map(([key, value]) => ({ key, value }))
    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })
    if (res.ok) {
      toast.success('נשמר!')
      router.refresh()
    } else {
      toast.error('שגיאה בשמירה')
    }
    setLoading(false)
  }

  async function uploadImpactImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImpact(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'story')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { toast.error('שגיאה בהעלאה'); setUploadingImpact(false); return }
    setForm(f => ({ ...f, impact_image: data.url }))
    setUploadingImpact(false)
    toast.success('תמונה הועלתה')
  }

  function renderFields(fields: typeof BRAND_FIELDS) {
    return fields.map(field => (
      <div key={field.key}>
        <label className="form-label">{field.label}</label>
        {field.type === 'textarea' ? (
          <textarea
            className="form-input h-24 resize-none"
            value={form[field.key] || ''}
            placeholder={(field as any).placeholder || ''}
            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
          />
        ) : (
          <input
            className="form-input"
            value={form[field.key] || ''}
            placeholder={(field as any).placeholder || ''}
            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
          />
        )}
      </div>
    ))
  }

  return (
    <div dir="rtl" className="space-y-8">

      {/* Brand section */}
      <div>
        <p className="text-sm font-semibold text-charcoal mb-4 pb-2 border-b border-light-gray">קטע המותג (אמצע דף הבית)</p>
        <div className="space-y-4">{renderFields(BRAND_FIELDS)}</div>
      </div>

      {/* Impact section */}
      <div>
        <p className="text-sm font-semibold text-charcoal mb-4 pb-2 border-b border-light-gray">קטע "כשאתה קונה" (Impact)</p>
        <div className="space-y-4">
          {renderFields(IMPACT_FIELDS)}
          {/* Image upload */}
          <div>
            <label className="form-label">תמונה בצד שמאל</label>
            <div className="flex items-start gap-4 mt-2">
              {form.impact_image && (
                <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded bg-cream-dark">
                  <Image src={form.impact_image} alt="" fill className="object-cover" sizes="96px" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className={`flex items-center gap-2 px-4 py-2.5 border border-dashed border-light-gray text-sm text-warm-gray cursor-pointer hover:border-charcoal transition-colors rounded ${uploadingImpact ? 'opacity-50' : ''}`}>
                  <Upload size={16} />
                  {uploadingImpact ? 'מעלה...' : 'העלה תמונה'}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImpactImage} disabled={uploadingImpact} />
                </label>
                <input
                  className="form-input text-xs"
                  placeholder="או הכנס URL ישירות"
                  value={form.impact_image || ''}
                  onChange={e => setForm(f => ({ ...f, impact_image: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / contact */}
      <div>
        <p className="text-sm font-semibold text-charcoal mb-4 pb-2 border-b border-light-gray">פוטר ויצירת קשר</p>
        <div className="space-y-4">{renderFields(FOOTER_FIELDS)}</div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg"
      >
        {loading ? 'שומר...' : 'שמור הכל'}
      </button>
    </div>
  )
}
