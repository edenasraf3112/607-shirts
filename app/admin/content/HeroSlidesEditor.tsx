'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { HeroSlide } from '@/components/HeroSlider'

export default function HeroSlidesEditor({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const router = useRouter()
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [loading, setLoading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  function updateSlide(i: number, field: keyof HeroSlide, value: string) {
    setSlides(s => s.map((slide, idx) => idx === i ? { ...slide, [field]: value } : slide))
  }

  function addSlide() {
    setSlides(s => [...s, { image: '', title: '', subtitle: '', cta: 'Shop Collection', href: '/shop/all' }])
  }

  function removeSlide(i: number) {
    setSlides(s => s.filter((_, idx) => idx !== i))
  }

  async function uploadSlideImage(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(i)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'story')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      updateSlide(i, 'image', result.url)
      toast.success('תמונה הועלתה')
    } catch {
      toast.error('שגיאה בהעלאה')
    }
    setUploadingIndex(null)
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: [{ key: 'hero_slides', value: JSON.stringify(slides) }] }),
    })
    if (res.ok) {
      toast.success('נשמר! השקופיות יופיעו באתר')
      router.refresh()
    } else {
      toast.error('שגיאה בשמירה')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {slides.map((slide, i) => (
        <div key={i} className="border border-light-gray rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-charcoal">שקופית {i + 1}</span>
            <button type="button" onClick={() => removeSlide(i)} className="p-1.5 text-warm-gray hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="relative h-40 w-full overflow-hidden rounded bg-cream-dark">
            {slide.image && <Image src={slide.image} alt="" fill className="object-cover" />}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-light-gray text-sm cursor-pointer hover:border-charcoal transition-colors rounded">
            <Upload size={14} />
            {uploadingIndex === i ? 'מעלה...' : 'העלה תמונה'}
            <input type="file" accept="image/*" className="hidden" onChange={e => uploadSlideImage(i, e)} disabled={uploadingIndex !== null} />
          </label>
          <input
            className="form-input text-xs"
            placeholder="או הדבק URL תמונה"
            value={slide.image}
            onChange={e => updateSlide(i, 'image', e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">כותרת</label>
              <input className="form-input" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} />
            </div>
            <div>
              <label className="form-label">כיתוב משנה</label>
              <input className="form-input" value={slide.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} />
            </div>
            <div>
              <label className="form-label">טקסט כפתור</label>
              <input className="form-input" value={slide.cta} onChange={e => updateSlide(i, 'cta', e.target.value)} />
            </div>
            <div>
              <label className="form-label">קישור כפתור</label>
              <input className="form-input" placeholder="/shop/all" value={slide.href} onChange={e => updateSlide(i, 'href', e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSlide} className="flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60">
        <Plus size={14} /> הוסף שקופית
      </button>

      <div className="pt-4 border-t border-light-gray">
        <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {loading ? 'שומר...' : 'שמור שקופיות'}
        </button>
      </div>
    </div>
  )
}
