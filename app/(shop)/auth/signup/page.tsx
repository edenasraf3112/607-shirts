'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { signUp, signInWithProvider, resendConfirmation } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true)
    const { error, needsConfirmation } = await signUp(email, password, name, phone)
    if (error) {
      if (error.includes('already registered')) {
        toast.error('אימייל זה כבר רשום — אנא התחבר')
      } else {
        toast.error('שגיאה בהרשמה, נסה שוב')
      }
    } else if (needsConfirmation) {
      setAwaitingConfirmation(true)
    } else {
      toast.success('נרשמת בהצלחה!')
      router.push('/account')
    }
    setLoading(false)
  }

  async function handleResend() {
    const { error } = await resendConfirmation(email)
    if (error) toast.error('שגיאה בשליחה, נסה שוב')
    else toast.success('נשלח מייל אימות חדש')
  }

  if (awaitingConfirmation) {
    return (
      <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center px-6" dir="rtl">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="font-serif text-4xl text-charcoal font-light mb-2">כמעט שם</h1>
          <p className="text-sm text-charcoal">
            שלחנו מייל אימות לכתובת <span className="font-medium">{email}</span>. לחץ על הקישור במייל כדי להשלים את ההרשמה ולהתחבר.
          </p>
          <button
            onClick={handleResend}
            className="text-sm text-warm-gray underline hover:no-underline"
          >
            לא קיבלת מייל? שלח שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center px-6" dir="rtl">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-charcoal font-light mb-2">הרשמה</h1>
          <p className="text-sm text-warm-gray">צור חשבון ועקוב אחר ההזמנות שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">שם מלא</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
          <div>
            <label className="form-label">טלפון <span className="normal-case font-normal text-warm-gray">(אופציונלי — כדי לחבר הזמנות קודמות שלך)</span></label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
              dir="ltr"
            />
          </div>
          <div>
            <label className="form-label">סיסמה <span className="normal-case font-normal text-warm-gray">(לפחות 6 תווים)</span></label>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 mt-2"
          >
            {loading ? 'נרשם...' : 'יצירת חשבון'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-light-gray" />
            <span className="text-xs text-warm-gray">או הירשם עם</span>
            <div className="flex-1 h-px bg-light-gray" />
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signInWithProvider('google')}
              className="w-full flex items-center justify-center gap-3 border border-light-gray rounded-lg py-2.5 px-4 text-sm text-charcoal hover:bg-cream-dark transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              הירשם עם Google
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-warm-gray">
            כבר יש לך חשבון?{' '}
            <Link href="/auth/login" className="text-charcoal underline hover:no-underline">
              כניסה
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
