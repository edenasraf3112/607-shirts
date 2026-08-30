'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      toast.error('שגיאה בשליחת המייל, נסה שוב')
      return
    }
    setSent(true)
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center px-6" dir="rtl">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-charcoal font-light mb-2">שכחת סיסמה?</h1>
          <p className="text-sm text-warm-gray">נשלח לך קישור לאיפוס</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-charcoal">
              אם קיים חשבון עם הכתובת <span className="font-medium">{email}</span>, נשלח אליו מייל עם קישור לאיפוס הסיסמה.
            </p>
            <Link href="/auth/login" className="text-sm text-charcoal underline hover:no-underline">
              חזרה להתחברות
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">אימייל</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 mt-2"
              >
                {loading ? 'שולח...' : 'שלח קישור איפוס'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link href="/auth/login" className="text-sm text-warm-gray underline hover:no-underline">
                חזרה להתחברות
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
