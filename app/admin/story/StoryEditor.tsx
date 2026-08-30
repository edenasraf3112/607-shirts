'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { StoryData, StoryBlock } from '@/components/StoryContent'
import type { CommunityQuote } from '@/lib/supabase'

const BLOCK_LABELS: Record<StoryBlock['type'], string> = {
  short_text: 'פסקה קצרה',
  long_text: 'פסקה ארוכה',
  gallery: 'רצף תמונות',
  video: 'סרטון',
  timeline: 'ציר זמן',
  community_quotes: 'קיר אמירות מהקהל',
}

function newBlock(type: StoryBlock['type']): StoryBlock {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  if (type === 'short_text') return { id, type, text: '' }
  if (type === 'long_text') return { id, type, text: '' }
  if (type === 'gallery') return { id, type, images: [] }
  if (type === 'timeline') return { id, type, items: [] }
  if (type === 'community_quotes') return { id, type, images: [] }
  return { id, type: 'video', url: '' }
}

export default function StoryEditor({ initialData, initialQuotes }: { initialData: StoryData; initialQuotes: CommunityQuote[] }) {
  const router = useRouter()
  const [data, setData] = useState<StoryData>(initialData)
  const [quotes, setQuotes] = useState<CommunityQuote[]>(initialQuotes)
  const [loading, setLoading] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null)

  async function uploadToStoryBucket(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'story')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Upload failed')
    return result.url as string
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    try {
      const url = await uploadToStoryBucket(file)
      setData(d => ({ ...d, heroImage: url }))
      toast.success('תמונת הרקע הועלתה')
    } catch {
      toast.error('שגיאה בהעלאה')
    }
    setUploadingHero(false)
  }

  function addBlock(type: StoryBlock['type']) {
    setData(d => ({ ...d, blocks: [...d.blocks, newBlock(type)] }))
  }
  function removeBlock(id: string) {
    if (!confirm('להסיר את הבלוק הזה לגמרי מהאתר?')) return
    setData(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== id) }))
  }
  function moveBlock(index: number, dir: -1 | 1) {
    setData(d => {
      const blocks = [...d.blocks]
      const target = index + dir
      if (target < 0 || target >= blocks.length) return d
      ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
      return { ...d, blocks }
    })
  }
  function updateBlock(id: string, updater: (b: StoryBlock) => StoryBlock) {
    setData(d => ({ ...d, blocks: d.blocks.map(b => b.id === id ? updater(b) : b) }))
  }

  async function uploadBlockImage(id: string, file: File) {
    setUploadingBlock(id)
    try {
      const url = await uploadToStoryBucket(file)
      updateBlock(id, b => (b.type === 'gallery' || b.type === 'community_quotes') ? { ...b, images: [...b.images, url] } : b)
      toast.success('הועלה בהצלחה')
    } catch {
      toast.error('שגיאה בהעלאה')
    }
    setUploadingBlock(null)
  }

  async function uploadBlockVideo(id: string, file: File) {
    setUploadingBlock(id)
    try {
      const url = await uploadToStoryBucket(file)
      updateBlock(id, b => b.type === 'video' ? { ...b, url } : b)
      toast.success('הסרטון הועלה')
    } catch {
      toast.error('שגיאה בהעלאה')
    }
    setUploadingBlock(null)
  }

  async function deleteQuote(id: string) {
    const res = await fetch(`/api/admin/quotes?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuotes(q => q.filter(quote => quote.id !== id))
      toast.success('האמירה הוסרה')
    } else {
      toast.error('שגיאה במחיקה')
    }
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: [{ key: 'story_data', value: JSON.stringify(data) }] }),
    })
    if (res.ok) {
      toast.success('נשמר! השינויים יופיעו באתר')
      router.refresh()
    } else {
      toast.error('שגיאה בשמירה')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Hero */}
      <div>
        <h2 className="font-semibold text-charcoal mb-4">תמונת רקע ראשית (Hero)</h2>
        <div className="relative h-48 w-full mb-3 overflow-hidden rounded bg-cream-dark">
          {data.heroImage && <Image src={data.heroImage} alt="" fill className="object-cover" />}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-light-gray text-sm cursor-pointer hover:border-charcoal transition-colors rounded">
          <Upload size={14} />
          {uploadingHero ? 'מעלה...' : 'העלה תמונת רקע'}
          <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} disabled={uploadingHero} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="form-label">כותרת ראשית</label>
            <input className="form-input" value={data.heroTitle} onChange={e => setData(d => ({ ...d, heroTitle: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">כיתוב משנה</label>
            <input className="form-input" value={data.heroSubtitle} onChange={e => setData(d => ({ ...d, heroSubtitle: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Blocks — full control: add, remove, reorder */}
      <div className="border-t border-light-gray pt-8">
        <h2 className="font-semibold text-charcoal mb-1">תוכן הדף</h2>
        <p className="text-xs text-warm-gray mb-4">כל חלק בדף הוא בלוק נפרד — אפשר להזיז, למחוק, ולהוסיף בכל סדר שתרצה</p>

        <div className="space-y-4 mb-4">
          {data.blocks.map((block, i) => (
            <div key={block.id} className="border border-light-gray rounded-lg p-4 bg-cream-dark/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-warm-gray uppercase tracking-wide">{BLOCK_LABELS[block.type]}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === data.blocks.length - 1} className="p-1.5 text-warm-gray hover:text-charcoal disabled:opacity-30">▼</button>
                  <button type="button" onClick={() => removeBlock(block.id)} className="p-1.5 text-warm-gray hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {block.type === 'short_text' && (
                <textarea
                  className="form-input h-16 resize-none"
                  placeholder="פסקה קצרה ובולטת..."
                  value={block.text}
                  onChange={e => updateBlock(block.id, b => b.type === 'short_text' ? { ...b, text: e.target.value } : b)}
                />
              )}

              {block.type === 'long_text' && (
                <textarea
                  className="form-input h-32 resize-none"
                  placeholder="פסקה ארוכה ומפורטת..."
                  value={block.text}
                  onChange={e => updateBlock(block.id, b => b.type === 'long_text' ? { ...b, text: e.target.value } : b)}
                />
              )}

              {block.type === 'gallery' && (
                <div className="flex flex-wrap gap-3">
                  {block.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 group">
                      <Image src={img} alt="" fill className="object-cover rounded" sizes="80px" />
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, b => b.type === 'gallery' ? { ...b, images: b.images.filter((_, j) => j !== idx) } : b)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-light-gray flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors rounded text-warm-gray">
                    <Upload size={16} />
                    <span className="text-xs mt-1">{uploadingBlock === block.id ? '...' : 'הוסף'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingBlock !== null} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBlockImage(block.id, f) }} />
                  </label>
                </div>
              )}

              {block.type === 'video' && (
                <div className="space-y-2">
                  {block.url && <video src={block.url} controls className="w-full max-h-64 rounded bg-black" />}
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-light-gray text-sm cursor-pointer hover:border-charcoal transition-colors rounded">
                    <Upload size={14} />
                    {uploadingBlock === block.id ? 'מעלה...' : block.url ? 'החלף סרטון' : 'העלה סרטון'}
                    <input type="file" accept="video/*" className="hidden" disabled={uploadingBlock !== null} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBlockVideo(block.id, f) }} />
                  </label>
                  <p className="text-xs text-warm-gray">הסרטון יתאים את עצמו אוטומטית — לאורך או לרוחב, ללא חיתוך</p>
                </div>
              )}

              {block.type === 'timeline' && (
                <div className="space-y-2">
                  {block.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        className="form-input w-20 flex-shrink-0"
                        placeholder="שנה"
                        value={item.year}
                        onChange={e => updateBlock(block.id, b => b.type === 'timeline' ? { ...b, items: b.items.map((it, j) => j === idx ? { ...it, year: e.target.value } : it) } : b)}
                      />
                      <input
                        className="form-input flex-1"
                        placeholder="טקסט"
                        value={item.text}
                        onChange={e => updateBlock(block.id, b => b.type === 'timeline' ? { ...b, items: b.items.map((it, j) => j === idx ? { ...it, text: e.target.value } : it) } : b)}
                      />
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, b => b.type === 'timeline' ? { ...b, items: b.items.filter((_, j) => j !== idx) } : b)}
                        className="p-2 text-warm-gray hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateBlock(block.id, b => b.type === 'timeline' ? { ...b, items: [...b.items, { year: '', text: '' }] } : b)}
                    className="flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60"
                  >
                    <Plus size={14} /> הוסף שלב בציר הזמן
                  </button>
                </div>
              )}

              {block.type === 'community_quotes' && (
                <div>
                  <p className="text-xs text-warm-gray mb-3">תמונות רקע (בלור מתחלף) לקיר האמירות — אם לא תעלה תמונות, ישתמש בתמונת ה-Hero</p>
                  <div className="flex flex-wrap gap-3">
                    {block.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 group">
                        <Image src={img} alt="" fill className="object-cover rounded" sizes="80px" />
                        <button
                          type="button"
                          onClick={() => updateBlock(block.id, b => b.type === 'community_quotes' ? { ...b, images: b.images.filter((_, j) => j !== idx) } : b)}
                          className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed border-light-gray flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors rounded text-warm-gray">
                      <Upload size={16} />
                      <span className="text-xs mt-1">{uploadingBlock === block.id ? '...' : 'הוסף'}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingBlock !== null} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBlockImage(block.id, f) }} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as StoryBlock['type'][]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="flex items-center gap-1.5 text-sm text-charcoal border border-light-gray px-3 py-1.5 rounded hover:border-charcoal/60"
            >
              <Plus size={14} /> {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-light-gray">
        <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {loading ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      {/* Community quotes moderation */}
      <div className="border-t border-light-gray pt-8">
        <h2 className="font-semibold text-charcoal mb-1">אמירות מהקהל</h2>
        <p className="text-xs text-warm-gray mb-4">האמירות שמבקרים כתבו בקיר האמירות — אפשר להסיר אמירות לא מתאימות</p>
        {quotes.length === 0 ? (
          <p className="text-sm text-warm-gray">אין אמירות עדיין</p>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <div key={q.id} className="flex items-center justify-between gap-3 bg-cream-dark p-3 rounded">
                <div>
                  <p className="text-sm text-charcoal">"{q.text}"</p>
                  <p className="text-xs text-warm-gray mt-0.5">— {q.name}</p>
                </div>
                <button type="button" onClick={() => deleteQuote(q.id)} className="p-2 text-warm-gray hover:text-red-600 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
