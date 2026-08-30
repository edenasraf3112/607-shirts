'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

export default function SubmissionsTable({ submissions }: { submissions: any[] }) {
  const [filter, setFilter] = useState('')

  const filtered = submissions.filter(s =>
    !filter || s.email?.includes(filter) || s.name?.includes(filter) || (s.popups as any)?.title?.includes(filter)
  )

  function exportCsv() {
    const rows = [
      ['תאריך', 'פופאפ', 'אימייל', 'שם', 'טלפון', 'עמוד'],
      ...filtered.map(s => [
        new Date(s.created_at).toLocaleString('he-IL'),
        (s.popups as any)?.title || '',
        s.email || '',
        s.name || '',
        s.phone || '',
        s.page_url || '',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'popup-submissions.csv'; a.click()
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-light-gray">
        <p className="font-serif text-xl text-warm-gray">אין פניות עדיין</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 px-4 py-2 border border-light-gray text-sm focus:outline-none focus:border-charcoal transition-colors bg-white rounded-lg"
          placeholder="חיפוש לפי אימייל / שם / פופאפ..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg">
          <Download size={14} />CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-light-gray bg-cream-dark">
                <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">תאריך</th>
                <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">פופאפ</th>
                <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">אימייל</th>
                <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">שם</th>
                <th className="text-right px-4 py-3 text-xs text-warm-gray font-medium">טלפון</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/50 transition-colors">
                  <td className="px-4 py-3 text-warm-gray text-xs">{new Date(s.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3 text-charcoal text-xs">{(s.popups as any)?.title || '—'}</td>
                  <td className="px-4 py-3 text-charcoal">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-charcoal">{s.name || '—'}</td>
                  <td className="px-4 py-3 text-charcoal">{s.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
