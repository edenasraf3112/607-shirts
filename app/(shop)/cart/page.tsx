'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Minus, Plus, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const { user, profile } = useAuth()
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  const [loading, setLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    if (user && step === 'checkout') {
      setForm(f => ({
        ...f,
        email: f.email || user.email || '',
        name: f.name || profile?.name || '',
        phone: f.phone || profile?.phone || '',
        address: f.address || profile?.address || '',
      }))
    }
  }, [step, user, profile])

  async function applyDiscount() {
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!data) { toast.error('קוד הנחה לא תקין'); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error('קוד פג תוקף'); return
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      toast.error('קוד הגיע למקסימום שימושים'); return
    }
    const amount = data.type === 'percent' ? total * (data.value / 100) : data.value
    setDiscountAmount(Math.min(amount, total))
    toast.success(`הנחה של ${data.type === 'percent' ? data.value + '%' : formatPrice(data.value)} הופעלה!`)
  }

  async function submitOrder() {
    if (!form.name || !form.phone || !form.email) {
      toast.error('יש למלא שם, טלפון ואימייל')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, items, total, discountCode, discountAmount }),
      })
      const data = await res.json()
      if (!data.ok) {
        toast.error(data.error || 'שגיאה בשליחת ההזמנה. נסה שוב.')
        setLoading(false)
        return
      }
    } catch {
      toast.error('שגיאה בשליחת ההזמנה. נסה שוב.')
      setLoading(false)
      return
    }
    clearCart()
    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="pt-16 md:pt-40 min-h-screen flex items-center justify-center px-6" dir="rtl">
        <div className="text-center max-w-lg animate-fade-up">
          <div className="font-serif text-6xl mb-6">✓</div>
          <h1 className="font-serif text-4xl text-charcoal mb-4">ההזמנה התקבלה</h1>
          <p className="text-warm-gray leading-relaxed mb-8">
            תודה רבה! ההזמנה שלך התקבלה בהצלחה.<br />
            שלחנו לך אישור לאימייל — בדוק גם בספאם אם לא מצאת.
          </p>
          <Link href="/shop/all" className="btn-primary">
            להמשך קנייה
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pt-16 md:pt-40 min-h-screen flex items-center justify-center px-6" dir="rtl">
        <div className="text-center">
          <p className="font-serif text-3xl text-warm-gray mb-6">הסל ריק</p>
          <Link href="/shop/all" className="btn-primary">לקולקציה</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-serif text-4xl text-charcoal mb-10">
          {step === 'cart' ? 'סל הקניות' : 'פרטי הזמנה'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: items or form */}
          <div className="lg:col-span-2">
            {step === 'cart' ? (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex gap-4 p-4 bg-white">
                    <div className="relative w-24 h-32 flex-shrink-0 bg-cream-dark">
                      <Image
                        src={item.product.images[0] || ''}
                        alt={item.product.name}
                        fill className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg text-charcoal">{item.product.name}</h3>
                      <div className="text-xs text-warm-gray mt-1 space-y-0.5">
                        {item.size && <p>מידה: {item.size}</p>}
                        {item.color && <p>צבע: {item.color}</p>}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-light-gray">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)} className="w-8 h-8 flex items-center justify-center hover:bg-cream-dark">
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)} className="w-8 h-8 flex items-center justify-center hover:bg-cream-dark">
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{formatPrice((item.product.sale_price || item.product.price) * item.quantity)}</span>
                          <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="text-warm-gray hover:text-red-brand transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 bg-white p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="form-label">שם מלא *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="form-label">טלפון *</label>
                    <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">אימייל * <span className="normal-case font-normal text-warm-gray">(ישלח אליך אישור הזמנה)</span></label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">כתובת למשלוח</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">הערות</label>
                    <textarea className="form-input h-24 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                  </div>
                </div>
                <div className="bg-cream-dark p-4 text-xs text-warm-gray mt-4">
                  <p className="font-medium text-charcoal mb-1">Pre-Order — הזמנה מוקדמת</p>
                  <p>הקולקציה מיוצרת לפי הזמנה לאחר סגירת המכירה. נעדכן אותך בכל שלב.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <div className="bg-white p-6 space-y-4">
              <h3 className="font-serif text-xl text-charcoal">סיכום הזמנה</h3>
              <div className="h-px bg-light-gray" />
              <div className="space-y-2 text-sm">
                {items.map((i) => (
                  <div key={`${i.product.id}-s`} className="flex justify-between text-warm-gray">
                    <span>{i.product.name} × {i.quantity}</span>
                    <span>{formatPrice((i.product.sale_price || i.product.price) * i.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Discount */}
              <div className="flex gap-2">
                <input
                  className="form-input flex-1 text-xs"
                  placeholder="קוד הנחה"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                />
                <button onClick={applyDiscount} className="px-4 py-2 border border-charcoal text-xs hover:bg-charcoal hover:text-cream transition-colors">
                  אשר
                </button>
              </div>
              <div className="h-px bg-light-gray" />
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>הנחה</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-charcoal">
                <span>סה"כ לתשלום</span>
                <span className="font-serif text-xl">{formatPrice(total - discountAmount)}</span>
              </div>
              <p className="text-xs text-warm-gray">+ משלוח — יחושב בסיום</p>
            </div>

            {step === 'cart' ? (
              <button onClick={() => { trackEvent('checkout_start'); setStep('checkout') }} className="w-full btn-primary">
                המשך להזמנה <ArrowRight size={16} className="mr-2 rtl:rotate-180" />
              </button>
            ) : (
              <div className="space-y-2">
                <button onClick={submitOrder} disabled={loading} className="w-full btn-primary disabled:opacity-50">
                  {loading ? 'שולח...' : 'שלח הזמנה'}
                </button>
                <button onClick={() => setStep('cart')} className="w-full btn-ghost text-sm">
                  חזור לסל
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
