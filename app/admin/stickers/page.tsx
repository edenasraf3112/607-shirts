'use client'

import { useState, useEffect, useRef } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import type { StickerFlagFile, CustomPrintSubmission } from '@/lib/supabase'
import { Plus, Trash2, ExternalLink, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

const TYPE_OPTIONS = [
  { value: 'sticker', label: 'מדבקה' },
  { value: 'flag', label: 'דגל' },
  { value: 'both', label: 'גם וגם' },
]
const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-800',
  approved: 'bg-green-50 text-green-800',
  rejected: 'bg-red-50 text-red-800',
}

const EMPTY_FORM = { name: '', description: '', type: 'sticker', display_order: 0 }

export default function StickersAdmin() {
  const [files, setFiles] = useState<StickerFlagFile[]>([])
  const [submissions, setSubmissions] = useState<CustomPrintSubmission[]>([])
  const [tab, setTab] = useState<'files' | 'submissions'>('files')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFiles(); loadSubmissions() }, [])

  async function loadFiles() {
    const res = await fetch('/api/admin/stickers')
    const data = await res.json()
    setFiles(data.files || [])
  }
  async function loadSubmissions() {
    const res = await fetch('/api/admin/custom-prints')
    const data = await res.json()
    setSubmissions(data.submissions || [])
  }

  async function uploadFile(input: HTMLInputElement, bucket: 'stickers-flags', onDone: (url: string) => void) {
    const f = input.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    fd.append('bucket', bucket)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) onDone(data.url)
    else toast.error('שגיאה בהעלאה')
  }

  async function saveFile() {
    if (!form.name || !fileUrl) { toast.error('שם וקובץ הם שדות חובה'); return }
    setLoading(true)
    const payload = { ...form, file_url: fileUrl, preview_image: previewUrl || null }
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { id: editId, ...payload } : payload
    const res = await fetch('/api/admin/stickers', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.ok) {
      toast.success(editId ? 'עודכן' : 'נוסף')
      setShowForm(false); setForm(EMPTY_FORM); setEditId(null); setFileUrl(''); setPreviewUrl('')
      loadFiles()
    } else toast.error(data.error || 'שגיאה')
    setLoading(false)
  }

  async function deleteFile(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    const res = await fetch('/api/admin/stickers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (data.ok) { toast.success('נמחק'); loadFiles() }
    else toast.error(data.error || 'שגיאה')
  }

  async function updateSubmissionStatus(id: string, status: string) {
    const res = await fetch('/api/admin/custom-prints', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    const data = await res.json()
    if (data.ok) { toast.success('סטטוס עודכן'); loadSubmissions() }
    else toast.error(data.error || 'שגיאה')
  }

  function startEdit(f: StickerFlagFile) {
    setForm({ name: f.name, description: f.description || '', type: f.type, display_order: f.display_order })
    setFileUrl(f.file_url)
    setPreviewUrl(f.preview_image || '')
    setEditId(f.id)
    setShowForm(true)
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-5xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">מדבקות & דגלים</h1>
            <p className="text-sm text-warm-gray">ניהול קבצים להורדה ובדיקת הגשות לקוחות</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-light-gray">
          <button
            onClick={() => setTab('files')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'files' ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'}`}
          >
            קבצים להורדה ({files.length})
          </button>
          <button
            onClick={() => setTab('submissions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${tab === 'submissions' ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'}`}
          >
            הגשות לקוחות ({submissions.length})
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-brand text-cream text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* FILES TAB */}
        {tab === 'files' && (
          <div className="space-y-4">
            <button
              onClick={() => { setShowForm(s => !s); setEditId(null); setForm(EMPTY_FORM); setFileUrl(''); setPreviewUrl('') }}
              className="flex items-center gap-2 px-4 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors"
            >
              <Plus size={16} /> הוסף קובץ חדש
            </button>

            {/* Add/Edit form */}
            {showForm && (
              <div className="bg-white rounded-xl border border-light-gray p-6 space-y-5">
                <h3 className="font-semibold text-charcoal">{editId ? 'עריכת קובץ' : 'קובץ חדש'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="form-label">שם *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">תיאור</label>
                    <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">סוג</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">סדר תצוגה</label>
                    <input className="form-input" type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <label className="form-label">קובץ להורדה *</label>
                  <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.zip" className="hidden"
                    onChange={() => uploadFile(fileInputRef.current!, 'stickers-flags', setFileUrl)} />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 border border-charcoal text-sm hover:bg-charcoal hover:text-cream transition-colors">
                      {fileUrl ? 'החלף קובץ' : 'העלה קובץ'}
                    </button>
                    {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-warm-gray hover:text-charcoal flex items-center gap-1"><ExternalLink size={12} /> תצוגה מקדימה</a>}
                  </div>
                </div>

                {/* Preview image */}
                <div>
                  <label className="form-label">תמונת תצוגה מקדימה</label>
                  <input ref={previewInputRef} type="file" accept="image/*" className="hidden"
                    onChange={() => uploadFile(previewInputRef.current!, 'stickers-flags', setPreviewUrl)} />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => previewInputRef.current?.click()}
                      className="px-4 py-2.5 border border-light-gray text-sm hover:border-charcoal transition-colors">
                      {previewUrl ? 'החלף תמונה' : 'העלה תמונה'}
                    </button>
                    {previewUrl && (
                      <div className="relative w-16 h-16 border border-light-gray overflow-hidden">
                        <Image src={previewUrl} alt="" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={saveFile} disabled={loading}
                    className="px-6 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50">
                    {loading ? 'שומר...' : editId ? 'עדכן' : 'הוסף'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null) }}
                    className="px-6 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors">
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Files list */}
            <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
              {files.length === 0 ? (
                <div className="text-center py-12 text-warm-gray text-sm">אין קבצים עדיין</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-cream-dark border-b border-light-gray">
                    <tr>
                      <th className="text-right p-4 font-medium text-warm-gray">קובץ</th>
                      <th className="text-right p-4 font-medium text-warm-gray">סוג</th>
                      <th className="text-right p-4 font-medium text-warm-gray">סדר</th>
                      <th className="text-right p-4 font-medium text-warm-gray">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, i) => (
                      <tr key={f.id} className={`border-b border-light-gray/50 ${i % 2 === 0 ? '' : 'bg-cream/30'}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {f.preview_image && (
                              <div className="relative w-10 h-10 bg-cream-dark flex-shrink-0 overflow-hidden">
                                <Image src={f.preview_image} alt="" fill className="object-cover" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-charcoal">{f.name}</div>
                              {f.description && <div className="text-xs text-warm-gray">{f.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-warm-gray">{TYPE_OPTIONS.find(o => o.value === f.type)?.label}</td>
                        <td className="p-4 text-warm-gray">{f.display_order}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-warm-gray hover:text-charcoal" title="הורד"><Download size={14} /></a>
                            <button onClick={() => startEdit(f)} className="text-xs text-warm-gray hover:text-charcoal">ערוך</button>
                            <button onClick={() => deleteFile(f.id, f.name)} className="text-xs text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SUBMISSIONS TAB */}
        {tab === 'submissions' && (
          <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-warm-gray text-sm">אין הגשות עדיין</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-cream-dark border-b border-light-gray">
                  <tr>
                    <th className="text-right p-4 font-medium text-warm-gray">פרטים</th>
                    <th className="text-right p-4 font-medium text-warm-gray">קובץ</th>
                    <th className="text-right p-4 font-medium text-warm-gray">מידות</th>
                    <th className="text-right p-4 font-medium text-warm-gray">סטטוס</th>
                    <th className="text-right p-4 font-medium text-warm-gray">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s.id} className={`border-b border-light-gray/50 ${i % 2 === 0 ? '' : 'bg-cream/30'}`}>
                      <td className="p-4">
                        <div className="font-medium text-charcoal">{s.name}</div>
                        {s.email && <div className="text-xs text-warm-gray">{s.email}</div>}
                        {s.phone && <div className="text-xs text-warm-gray">{s.phone}</div>}
                        <div className="text-xs text-warm-gray/60 mt-1">{new Date(s.created_at).toLocaleDateString('he-IL')}</div>
                        {s.notes && <div className="text-xs text-warm-gray mt-1 italic">{s.notes}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-warm-gray mb-1">{s.file_name || 'קובץ'}</div>
                        <a
                          href={s.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-charcoal hover:underline"
                        >
                          <ExternalLink size={11} /> פתח קובץ
                        </a>
                        <div className="text-xs text-warm-gray mt-1">{TYPE_OPTIONS.find(o => o.value === s.print_type)?.label}</div>
                      </td>
                      <td className="p-4 text-warm-gray text-xs">
                        {s.width_cm && s.height_cm
                          ? `${s.width_cm} × ${s.height_cm} cm`
                          : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>
                          {STATUS_LABELS[s.status]}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {s.status !== 'approved' && (
                            <button onClick={() => updateSubmissionStatus(s.id, 'approved')}
                              className="text-xs text-green-700 hover:underline">אשר</button>
                          )}
                          {s.status !== 'rejected' && (
                            <button onClick={() => updateSubmissionStatus(s.id, 'rejected')}
                              className="text-xs text-red-500 hover:underline">דחה</button>
                          )}
                          {s.status !== 'pending' && (
                            <button onClick={() => updateSubmissionStatus(s.id, 'pending')}
                              className="text-xs text-warm-gray hover:underline">ממתין</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
