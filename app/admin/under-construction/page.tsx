'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { type UnderConstructionKey, PAGE_LABELS } from '@/lib/underConstruction'
import toast from 'react-hot-toast'

type StateMap = Record<UnderConstructionKey, boolean>

const PAGE_KEYS = Object.keys(PAGE_LABELS) as UnderConstructionKey[]

const defaults: StateMap = Object.fromEntries(PAGE_KEYS.map(k => [k, false])) as StateMap

export default function UnderConstructionAdmin() {
  const [state, setState] = useState<StateMap>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/under-construction')
        if (res.ok) {
          const data = await res.json()
          setState({ ...defaults, ...data })
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/under-construction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      const data = await res.json()
      if (data.ok) toast.success('נשמר!')
      else toast.error(data.error || 'שגיאה בשמירה')
    } catch (err: any) {
      toast.error('שגיאה בשמירה: ' + (err?.message || ''))
    }
    setSaving(false)
  }

  const activeCount = Object.values(state).filter(Boolean).length

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">שיפוצים</h1>
          <p className="text-sm text-warm-gray">סמנו דפים שנמצאים בשיפוצים — המבקרים יראו דף "בשיפוצים" במקום</p>
        </div>

        <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-warm-gray text-sm">טוען...</div>
          ) : (
            <div className="divide-y divide-light-gray">
              {PAGE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between p-5">
                  <div>
                    <div className="text-sm font-medium text-charcoal">{PAGE_LABELS[key]}</div>
                    {state[key] && (
                      <div className="text-xs text-red-brand mt-0.5">מוצג כ"בשיפוצים" למבקרים</div>
                    )}
                  </div>
                  <button
                    onClick={() => setState(s => ({ ...s, [key]: !s[key] }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${state[key] ? 'bg-charcoal' : 'bg-light-gray'}`}
                    aria-label={`${PAGE_LABELS[key]} — ${state[key] ? 'פעיל' : 'כבוי'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${state[key] ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg">
            <span className="font-medium">{activeCount}</span> דף{activeCount !== 1 ? 'ים' : ''} בשיפוצים כרגע
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 bg-charcoal text-cream text-sm tracking-widest uppercase hover:bg-charcoal/80 transition-colors disabled:opacity-50"
          style={{ letterSpacing: '0.15em' }}
        >
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </AdminShell>
  )
}
