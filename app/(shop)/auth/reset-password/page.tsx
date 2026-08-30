'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      toast.error('קישור האיפוס לא תקין או שפג תוקפו')
      router.push('/auth/forgot-password')
    }
  }, [user, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    if (password !== confirm) { toast.error('הסיסמאות לא תואמות'); return }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      toast.error('שגיאה בעדכון הסיסמה, נסה שוב')
      return
    }
    toast.success('הסיסמה עודכנה בהצלחה!')
    router.push('/account')
  }

  if (loading || !user) {
    return (
      <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center px-6" dir="rtl">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-charcoal font-light mb-2">סיסמה חדשה</h1>
          <p className="text-sm text-warm-gray">בחר סיסמה חדשה לחשבון שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">סיסמה חדשה <span className="normal-case font-normal text-warm-gray">(לפחות 6 תווים)</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pl-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">אימות סיסמה</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pl-10"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 mt-2"
          >
            {submitting ? 'שומר...' : 'עדכן סיסמה'}
          </button>
        </form>
      </div>
    </div>
  )
}
