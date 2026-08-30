'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, Copy, X, History } from 'lucide-react'
import type { SizeChart, SizeChartData, SizeChartStatus, SizeChartUnit } from '@/lib/supabase'
import { SIZE_CHART_CATEGORIES, SIZE_CHART_TEMPLATES } from '@/lib/sizeChartTemplates'
import { validateForSave, validateForPublish } from '@/lib/sizeChartValidation'
import SizeChartGridEditor from './SizeChartGridEditor'
import SizeChartDisplay from '@/components/SizeChartDisplay'

type VersionRow = { id: string; data: SizeChartData; created_at: string }

type Props = {
  chart?: SizeChart
  productCount?: number
  versions?: VersionRow[]
}

const BLANK_TEMPLATE = SIZE_CHART_TEMPLATES.find(t => t.key === 'blank')!

export default function SizeChartEditor({ chart, productCount = 0, versions = [] }: Props) {
  const router = useRouter()
  const isNew = !chart?.id

  const [fields, setFields] = useState({
    internal_name: chart?.internal_name || '',
    title: chart?.title || '',
    description: chart?.description || '',
    category: chart?.category || '',
    unit: (chart?.unit || 'cm') as SizeChartUnit,
  })
  const [status, setStatus] = useState<SizeChartStatus>(chart?.status || 'draft')
  const [gridData, setGridData] = useState<SizeChartData>(chart?.data || BLANK_TEMPLATE.build())
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [dirty, setDirty] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [currentId, setCurrentId] = useState(chart?.id)

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function updateFields(patch: Partial<typeof fields>) {
    setFields(f => ({ ...f, ...patch }))
    setDirty(true)
  }

  function updateGridData(next: SizeChartData) {
    setGridData(next)
    setDirty(true)
  }

  function applyTemplate(key: string) {
    const tpl = SIZE_CHART_TEMPLATES.find(t => t.key === key)
    if (!tpl) return
    if (dirty && !confirm('טעינת תבנית תחליף את תוכן הטבלה הנוכחי. להמשיך?')) return
    updateGridData(tpl.build())
    updateFields({ category: fields.category || tpl.category })
  }

  async function persist(nextStatus: SizeChartStatus) {
    const validationError = nextStatus === 'published'
      ? validateForPublish(fields, gridData)
      : validateForSave(fields, gridData)
    if (validationError) { toast.error(validationError); return }

    setSaving(nextStatus === 'published' ? 'publish' : 'draft')
    const payload = { ...fields, status: nextStatus, data: gridData }
    try {
      const res = currentId
        ? await fetch(`/api/admin/size-charts/${currentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/size-charts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'שגיאה')

      setStatus(nextStatus)
      setDirty(false)
      toast.success(nextStatus === 'published' ? 'נשמר ופורסם בהצלחה' : 'נשמר בהצלחה')

      if (isNew && resData.id) {
        setCurrentId(resData.id)
        router.replace(`/admin/size-charts/${resData.id}`)
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'השמירה נכשלה')
    } finally {
      setSaving(null)
    }
  }

  async function duplicateChart() {
    if (!currentId) return
    try {
      const res = await fetch(`/api/admin/size-charts/${currentId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error()
      toast.success('הטבלה שוכפלה')
      router.push(`/admin/size-charts/${data.id}`)
    } catch {
      toast.error('שגיאה בשכפול')
    }
  }

  function cancelChanges() {
    if (dirty && !confirm('לבטל את כל השינויים שלא נשמרו?')) return
    setFields({
      internal_name: chart?.internal_name || '',
      title: chart?.title || '',
      description: chart?.description || '',
      category: chart?.category || '',
      unit: (chart?.unit || 'cm') as SizeChartUnit,
    })
    setStatus(chart?.status || 'draft')
    setGridData(chart?.data || BLANK_TEMPLATE.build())
    setDirty(false)
  }

  function goBack() {
    if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בכל זאת?')) return
    router.push('/admin/size-charts')
  }

  function restoreVersion(v: VersionRow) {
    if (!confirm(`לשחזר את הגרסה מ-${new Date(v.created_at).toLocaleString('he-IL')}? יש לשמור כדי לאשר.`)) return
    updateGridData(v.data)
    setHistoryOpen(false)
    toast('הגרסה נטענה — לחץ "שמור טיוטה" כדי לאשר', { icon: '↩️' })
  }

  const previewChart: SizeChart = {
    id: currentId || 'preview',
    internal_name: fields.internal_name,
    title: fields.title || 'תצוגה מקדימה',
    description: fields.description,
    category: fields.category,
    unit: fields.unit,
    status,
    data: gridData,
    created_at: chart?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const deviceWidths: Record<typeof previewDevice, string> = {
    desktop: '100%',
    tablet: '700px',
    mobile: '375px',
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">{isNew ? 'טבלת מידות חדשה' : `עריכת טבלה — ${chart?.title}`}</h1>
          {!isNew && (
            <p className="text-sm text-warm-gray mt-1">
              משויכת ל-{productCount} מוצרים · סטטוס: {status === 'published' ? 'מפורסם' : 'טיוטה'}
              {dirty && <span className="text-red-brand"> · שינויים לא נשמרו</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button type="button" onClick={() => setHistoryOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-light-gray rounded-lg text-warm-gray hover:border-charcoal hover:text-charcoal">
              <History size={14} /> היסטוריה
            </button>
          )}
          <button type="button" onClick={() => setPreviewOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-light-gray rounded-lg text-warm-gray hover:border-charcoal hover:text-charcoal">
            <Eye size={14} /> תצוגה מקדימה
          </button>
        </div>
      </div>

      {/* Templates */}
      {isNew && (
        <div className="bg-white border border-light-gray rounded-xl p-4">
          <p className="form-label mb-2">התחל מתבנית</p>
          <div className="flex flex-wrap gap-2">
            {SIZE_CHART_TEMPLATES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => applyTemplate(t.key)}
                className="px-3 py-1.5 text-xs border border-light-gray rounded-full text-charcoal hover:border-charcoal hover:bg-cream-dark transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta fields */}
      <div className="bg-white border border-light-gray rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">שם פנימי *</label>
          <input className="form-input" placeholder="Oversized Shirts" value={fields.internal_name} onChange={e => updateFields({ internal_name: e.target.value })} />
          <p className="text-xs text-warm-gray mt-1">לשימוש פנימי באדמין בלבד, לא מוצג ללקוח</p>
        </div>
        <div>
          <label className="form-label">כותרת ללקוח *</label>
          <input className="form-input" placeholder="טבלת מידות לחולצות אוברסייז" value={fields.title} onChange={e => updateFields({ title: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">תיאור קצר (אופציונלי)</label>
          <input className="form-input" value={fields.description} onChange={e => updateFields({ description: e.target.value })} />
        </div>
        <div>
          <label className="form-label">סוג בגד / קטגוריה</label>
          <select className="form-select" value={fields.category} onChange={e => updateFields({ category: e.target.value })}>
            <option value="">— בחר —</option>
            {SIZE_CHART_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">יחידת מידה</label>
          <select className="form-select" value={fields.unit} onChange={e => updateFields({ unit: e.target.value as SizeChartUnit })}>
            <option value="cm">סנטימטרים (cm)</option>
            <option value="in">אינצ׳ים (in)</option>
          </select>
        </div>
        <div>
          <label className="form-label">מצב פרסום</label>
          <div className="flex items-center gap-2 h-[46px]">
            <span className={`text-xs px-3 py-1.5 rounded-full ${status === 'published' ? 'bg-green-50 text-green-700' : 'bg-cream-dark text-warm-gray'}`}>
              {status === 'published' ? '● מפורסם' : '○ טיוטה'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid editor */}
      <div className="bg-white border border-light-gray rounded-xl p-5">
        <SizeChartGridEditor data={gridData} onChange={updateGridData} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-light-gray">
        <button type="button" disabled={!!saving} onClick={() => persist('draft')} className="px-5 py-2.5 border border-charcoal text-charcoal text-sm hover:bg-cream-dark transition-colors disabled:opacity-50 rounded-lg">
          {saving === 'draft' ? 'שומר...' : 'שמור טיוטה'}
        </button>
        <button type="button" disabled={!!saving} onClick={() => persist('published')} className="px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg">
          {saving === 'publish' ? 'שומר...' : 'שמור ופרסם'}
        </button>
        {!isNew && (
          <button type="button" onClick={duplicateChart} className="flex items-center gap-1.5 px-5 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg">
            <Copy size={14} /> שכפל טבלה
          </button>
        )}
        <button type="button" onClick={cancelChanges} disabled={!dirty} className="px-5 py-2.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg disabled:opacity-40">
          בטל שינויים
        </button>
        <button type="button" onClick={goBack} className="px-5 py-2.5 text-sm text-warm-gray hover:text-charcoal transition-colors">
          חזרה לרשימה
        </button>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setPreviewOpen(false)} />
          <div className="relative z-10 bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-light-gray">
              <div className="flex items-center gap-2">
                {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPreviewDevice(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${previewDevice === d ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
                  >
                    {d === 'desktop' ? 'דסקטופ' : d === 'tablet' ? 'טאבלט' : 'מובייל'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="סגור תצוגה מקדימה" className="p-1.5 text-warm-gray hover:text-charcoal">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-cream-dark p-6 flex justify-center">
              <div style={{ width: deviceWidths[previewDevice], maxWidth: '100%' }} className="bg-cream p-6 rounded-lg h-fit">
                <SizeChartDisplay chart={previewChart} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version history */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setHistoryOpen(false)} />
          <div className="relative z-10 bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-light-gray">
              <p className="font-medium text-charcoal text-sm">היסטוריית גרסאות</p>
              <button type="button" onClick={() => setHistoryOpen(false)} aria-label="סגור" className="p-1 text-warm-gray hover:text-charcoal"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {versions.length === 0 ? (
                <p className="text-xs text-warm-gray p-3">אין עדיין גרסאות קודמות שמורות</p>
              ) : versions.map(v => (
                <div key={v.id} className="flex items-center justify-between border border-light-gray rounded-lg px-3 py-2 text-xs">
                  <span className="text-warm-gray">{new Date(v.created_at).toLocaleString('he-IL')}</span>
                  <button type="button" onClick={() => restoreVersion(v)} className="text-charcoal underline">שחזר</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
