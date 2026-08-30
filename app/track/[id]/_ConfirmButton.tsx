'use client'

import { useState } from 'react'
import { PackageCheck, CheckCircle } from 'lucide-react'

export default function ConfirmButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function confirm() {
    setState('loading')
    try {
      const res = await fetch(`/api/track/${orderId}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) setState('done')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle size={52} className="mx-auto text-green-600 mb-4" strokeWidth={1.5} />
        <p className="font-serif text-2xl text-charcoal mb-2">תודה!</p>
        <p className="text-sm text-warm-gray font-sans">קבלת החבילה אושרה בהצלחה</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-center py-6">
        <p className="text-red-700 text-sm mb-3">משהו השתבש — נסה שוב</p>
        <button onClick={() => setState('idle')} className="text-xs text-warm-gray underline underline-offset-2">
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={confirm}
      disabled={state === 'loading'}
      className="w-full bg-charcoal text-cream py-4 px-6 font-sans text-sm tracking-widest uppercase hover:bg-charcoal/90 active:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
    >
      {state === 'loading' ? (
        <span className="opacity-60">מעדכן…</span>
      ) : (
        <>
          <PackageCheck size={18} strokeWidth={1.5} />
          קיבלתי את החבילה
        </>
      )}
    </button>
  )
}
