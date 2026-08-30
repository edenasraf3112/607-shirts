'use client'

import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import { getStatusLabel } from '@/lib/utils'

type HistoryEntry = { status: string; changed_at: string }

export default function OrderTimeline({
  orderId,
  history,
  currentStatus,
  createdAt,
}: {
  orderId: string
  history: HistoryEntry[]
  currentStatus: string
  createdAt: string
}) {
  const [open, setOpen] = useState(false)

  // Merge created_at as the initial "received" entry if history is empty or doesn't start with it
  const timeline: HistoryEntry[] = history?.length
    ? history
    : [{ status: currentStatus, changed_at: createdAt }]

  // Always prepend the "received" entry from createdAt if history doesn't include it
  const fullTimeline = timeline[0]?.status !== 'received'
    ? [{ status: 'received', changed_at: createdAt }, ...timeline]
    : timeline

  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
        title="היסטוריית סטטוסים"
      >
        <Clock size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-sm mx-4 rounded-xl shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-light-gray" dir="rtl">
              <h2 className="font-semibold text-charcoal text-sm">היסטוריית סטטוסים</h2>
              <button onClick={() => setOpen(false)} className="text-warm-gray hover:text-charcoal">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4" dir="rtl">
              {fullTimeline.length === 0 ? (
                <p className="text-sm text-warm-gray text-center py-4">אין היסטוריה</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute right-[7px] top-2 bottom-2 w-px bg-light-gray" />
                  <div className="space-y-4">
                    {[...fullTimeline].reverse().map((entry, i) => (
                      <div key={i} className="flex items-start gap-4 pr-6 relative">
                        {/* Dot */}
                        <div className={`absolute right-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${i === 0 ? 'bg-charcoal border-charcoal' : 'bg-white border-light-gray'}`} />
                        <div>
                          <div className={`text-sm font-medium ${i === 0 ? 'text-charcoal' : 'text-warm-gray'}`}>
                            {getStatusLabel(entry.status)}
                          </div>
                          <div className="text-xs text-warm-gray/70 mt-0.5">
                            {formatDateTime(entry.changed_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!history?.length && (
                <p className="text-xs text-warm-gray/60 mt-4 border-t border-light-gray pt-3">
                  * היסטוריה מלאה תיתכן לאחר הרצת migration SQL
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
