'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Check, AlertCircle, X, Link as LinkIcon } from 'lucide-react'

interface Props {
  currentLogoUrl: string
}

type Tab = 'url' | 'file'

export default function LogoUploader({ currentLogoUrl }: Props) {
  const [tab, setTab] = useState<Tab>('url')

  // Shared state
  const [liveUrl, setLiveUrl] = useState(currentLogoUrl)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // URL tab
  const [urlInput, setUrlInput] = useState('')
  const [urlPreview, setUrlPreview] = useState('')

  // File tab
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── URL tab handlers ──────────────────────────────────────
  function handleUrlPreview() {
    if (!urlInput.trim()) return
    setUrlPreview(urlInput.trim())
    setStatus('idle')
  }

  async function handleSaveUrl() {
    if (!urlInput.trim()) return
    setUploading(true)
    setStatus('idle')
    try {
      await fetch('/api/admin/set-logo-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      setLiveUrl(urlInput.trim() + '?t=' + Date.now())
      setUrlInput('')
      setUrlPreview('')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('שגיאה בשמירה')
    } finally {
      setUploading(false)
    }
  }

  // ── File tab handlers ─────────────────────────────────────
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('יש לבחור קובץ תמונה (PNG, JPG, SVG)')
      setStatus('error')
      return
    }
    setSelectedFile(file)
    setStatus('idle')
    setErrorMsg('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [])

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setStatus('idle')
    try {
      const formData = new FormData()
      formData.append('logo', selectedFile)
      const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setLiveUrl(data.url + '?t=' + Date.now())
      setStatus('success')
      setPreview(null)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'שגיאה בהעלאה')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Current logo */}
      <div>
        <p className="text-xs text-warm-gray mb-2 font-medium tracking-wide uppercase">לוגו נוכחי</p>
        <div className="border border-light-gray rounded-lg p-6 bg-gray-50 flex items-center justify-center h-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={liveUrl} alt="לוגו נוכחי" className="max-h-20 max-w-full object-contain" key={liveUrl} />
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-light-gray mb-5">
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'url' ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            <LinkIcon size={14} /> קישור URL
          </button>
          <button
            onClick={() => setTab('file')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'file' ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            <Upload size={14} /> העלאת קובץ
          </button>
        </div>

        {/* ── URL tab ── */}
        {tab === 'url' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
              העלו את הלוגו לכל שירות תמונות (Google Drive, Imgur, Dropbox וכו׳) והדביקו כאן את הקישור הישיר לתמונה.
            </div>
            <div>
              <label className="text-xs text-warm-gray font-medium block mb-1.5">קישור לתמונת הלוגו</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setUrlPreview('') }}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 border border-light-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
                  dir="ltr"
                />
                <button
                  onClick={handleUrlPreview}
                  disabled={!urlInput.trim()}
                  className="px-3 py-2 border border-light-gray rounded-lg text-sm text-charcoal hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap"
                >
                  תצוגה
                </button>
              </div>
            </div>
            {urlPreview && (
              <div className="border border-light-gray rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-warm-gray mb-3">תצוגה מקדימה</p>
                <div className="flex items-center justify-center h-20 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlPreview} alt="preview" className="max-h-16 max-w-full object-contain"
                    onError={() => { setStatus('error'); setErrorMsg('לא ניתן לטעון את התמונה מהקישור הזה') }} />
                </div>
                <button
                  onClick={handleSaveUrl}
                  disabled={uploading}
                  className="w-full py-2 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" /> שומר...</> : '✓ קבע כלוגו'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── File upload tab ── */}
        {tab === 'file' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
              העלאת קובץ דורשת חיבור Supabase Storage. בינתיים השתמשו בטאב "קישור URL".
            </div>
            {!preview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-charcoal bg-charcoal/5' : 'border-light-gray hover:border-charcoal/40'
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Upload size={28} className="mx-auto text-warm-gray mb-3" />
                <p className="text-sm text-charcoal font-medium mb-1">גרור לכאן או לחץ לבחירת קובץ</p>
                <p className="text-xs text-warm-gray">PNG, JPG, SVG — רקע שקוף מומלץ</p>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
            ) : (
              <div className="border border-light-gray rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between mb-3">
                  <p className="text-xs text-warm-gray font-medium">תצוגה מקדימה</p>
                  <button onClick={() => { setPreview(null); setSelectedFile(null) }} className="text-warm-gray hover:text-charcoal"><X size={16} /></button>
                </div>
                <div className="flex items-center justify-center h-20 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="preview" className="max-h-16 max-w-full object-contain" />
                </div>
                <button onClick={handleUpload} disabled={uploading}
                  className="w-full py-2.5 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" /> מעלה...</> : <><Upload size={15} /> החלף לוגו</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <Check size={16} /> הלוגו עודכן בהצלחה!
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
    </div>
  )
}
