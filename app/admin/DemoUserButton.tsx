'use client'

import { useState } from 'react'
import { UserCheck, UserX, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo'

export default function DemoUserButton() {
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<{ email: string; password: string; status: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function setup() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/demo-user', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInfo({ email: data.email, password: data.password, status: data.status })
      toast.success(data.message)
    } catch (e: any) {
      toast.error(e.message || 'שגיאה')
    }
    setLoading(false)
  }

  function copyCredentials() {
    const text = `אימייל: ${DEMO_EMAIL}\nסיסמה: ${DEMO_PASSWORD}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray p-5 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-charcoal">משתמש דמו</p>
          <p className="text-xs text-warm-gray mt-0.5">לבדיקת האתר כלקוח — ההזמנות שלו מסוננות מייצואים</p>
        </div>
        <UserCheck size={18} className="text-warm-gray/50 flex-shrink-0" />
      </div>

      {!info ? (
        <button
          onClick={setup}
          disabled={loading}
          className="w-full py-2.5 bg-charcoal text-cream text-sm rounded-lg hover:bg-charcoal/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'יוצר...' : 'הגדר משתמש דמו'}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="bg-cream-dark rounded-lg p-3 text-xs font-mono space-y-1">
            <p><span className="text-warm-gray">אימייל: </span><span className="text-charcoal select-all">{info.email}</span></p>
            <p><span className="text-warm-gray">סיסמה: </span><span className="text-charcoal select-all">{info.password}</span></p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyCredentials}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-light-gray text-xs text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'הועתק!' : 'העתק פרטים'}
            </button>
            <a
              href="/"
              target="_blank"
              className="flex-1 py-2 text-center border border-charcoal text-xs text-charcoal hover:bg-charcoal hover:text-cream transition-colors rounded-lg"
            >
              כניסה לאתר ←
            </a>
          </div>
        </div>
      )}

      <p className="text-xs text-warm-gray/60 border-t border-light-gray pt-3">
        בחירת "ללא דמו" בייצוא תסנן הזמנות מ־{DEMO_EMAIL}
      </p>
    </div>
  )
}
