'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, signInWithProvider, resendConfirmation } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginFailed, setLoginFailed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setLoginFailed(true)
      toast.error('אימייל או סיסמה שגויים — או שטרם אימתת את המייל שלך')
    } else {
      setLoginFailed(false)
      toast.success('ברוך הבא!')
      router.push('/account')
    }
    setLoading(false)
  }

  async function handleResend() {
    if (!email) { toast.error('הזן קודם את כתובת המייל למעלה'); return }
    const { error } = await resendConfirmation(email)
    if (error) toast.error('שגיאה בשליחה, נסה שוב')
    else toast.success('אם החשבון קיים ולא אומת — נשלח אליו מייל אימות חדש')
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center px-6" dir="rtl">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-charcoal font-light mb-2">כניסה</h1>
          <p className="text-sm text-warm-gray">האזור האישי שלך</p>
        </div>

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
          <div>
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">סיסמה</label>
              <Link href="/auth/forgot-password" className="text-xs text-warm-gray underline hover:no-underline">
                שכחת סיסמה?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pl-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        {loginFailed && (
          <p className="text-center text-xs text-warm-gray mt-3">
            לא אימתת את המייל בעת ההרשמה?{' '}
            <button onClick={handleResend} className="text-charcoal underline hover:no-underline">
              שלח מייל אימות מחדש
            </button>
          </p>
        )}

        <div className="mt-6">
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-light-gray" />
            <span className="text-xs text-warm-gray">או המשך עם</span>
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
              המשך עם Google
            </button>
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-warm-gray">
            אין לך חשבון?{' '}
            <Link href="/auth/signup" className="text-charcoal underline hover:no-underline">
              הרשמה
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
