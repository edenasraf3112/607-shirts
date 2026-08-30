'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('שם משתמש או סיסמה שגויים')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image src="/assets/branding/brand-logo.png" alt="Nehoray Leizer" width={80} height={40} className="h-12 w-auto object-contain mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-charcoal">ניהול האתר</h1>
          <p className="text-sm text-warm-gray mt-2">כניסה לאדמין של Nehoray Leizer</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 space-y-4">
          <div>
            <label className="form-label">שם משתמש</label>
            <input
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="form-label">סיסמה</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-brand text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-charcoal text-cream text-sm tracking-widest uppercase hover:bg-charcoal/80 transition-colors disabled:opacity-50"
            style={{ letterSpacing: '0.2em' }}
          >
            {loading ? '...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
