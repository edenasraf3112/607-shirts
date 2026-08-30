'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import toast from 'react-hot-toast'
import type { Product, SizeChart } from '@/lib/supabase'
import { ChevronRight, Minus, Plus, Bell, Ruler } from 'lucide-react'
import Link from 'next/link'
import FAQAccordion from '@/components/FAQAccordion'
import SizeChartDisplay from '@/components/SizeChartDisplay'

const DEMO_PRODUCT: Product = {
  id: 'demo-1',
  name: 'חולצת Collection 01',
  price: 290,
  short_description: 'כותנה פרימיום, גזרה נקייה',
  full_description: 'חולצה מעוצבת בקפידה כחלק מ-Collection 01 של Nehoray Leizer. מיוצרת מכותנה פרימיום 100%, עם לוגו רקום בגב ומספר סדרתי ייחודי. כל חולצה מיוצרת לפי הזמנה לאחר סגירת הקולקציה.',
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80',
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['לבן', 'שחור'],
  tags: ['all', 'גברים'],
  display_order: 1,
  in_stock: true,
  created_at: new Date().toISOString(),
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [sizeChart, setSizeChart] = useState<SizeChart | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyName, setNotifyName] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notified, setNotified] = useState(false)
  const { addItem } = useCart()
  const { user, profile } = useAuth()

  useEffect(() => {
    async function load() {
      if (params.id.startsWith('demo')) {
        setProduct(DEMO_PRODUCT)
        return
      }
      const { data } = await supabase.from('products').select('*').eq('id', params.id).single()
      setProduct(data || DEMO_PRODUCT)
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (user) {
      setNotifyEmail(user.email || '')
      setNotifyName(profile?.name || '')
    }
  }, [user, profile])

  useEffect(() => {
    if (product && !product.id.startsWith('demo')) {
      trackEvent('product_view', { product_id: product.id })
    }
  }, [product])

  useEffect(() => {
    async function loadSizeChart() {
      if (!product?.size_chart_id) { setSizeChart(null); return }
      const { data } = await supabase.from('size_charts').select('*').eq('id', product.size_chart_id).eq('status', 'published').single()
      setSizeChart(data || null)
    }
    loadSizeChart()
  }, [product?.size_chart_id])

  if (!product) {
    return (
      <div className="pt-28 md:pt-40 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  function handleAddToCart() {
    if (!product) return
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('אנא בחר מידה')
      return
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('אנא בחר צבע')
      return
    }
    if (selectedSize && product.out_of_stock_sizes?.includes(selectedSize)) {
      toast.error('המידה הזו אזלה מהמלאי')
      return
    }
    if (selectedColor && product.out_of_stock_colors?.includes(selectedColor)) {
      toast.error('הצבע הזה אזל מהמלאי')
      return
    }
    addItem(product, quantity, selectedSize, selectedColor)
    toast.success(`${product.name} נוסף לסל`)
  }

  const now = new Date()
  const isComingSoon = !!product.available_from && new Date(product.available_from) > now
  const isExpired = !isComingSoon && !!product.available_until && new Date(product.available_until) < now
  const allSizesOut = product.sizes.length > 0 && product.sizes.every(s => product.out_of_stock_sizes?.includes(s))
  const allColorsOut = product.colors.length > 0 && product.colors.every(c => product.out_of_stock_colors?.includes(c))
  const selectedSizeOut = !!selectedSize && !!product.out_of_stock_sizes?.includes(selectedSize)
  const selectedColorOut = !!selectedColor && !!product.out_of_stock_colors?.includes(selectedColor)
  const canAdd = product.in_stock && !isComingSoon && !isExpired && !allSizesOut && !allColorsOut && !selectedSizeOut && !selectedColorOut

  async function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault()
    if (!notifyEmail || !product) { toast.error('אנא הזן אימייל'); return }
    setNotifyLoading(true)
    const res = await fetch('/api/notify-me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, email: notifyEmail, name: notifyName }),
    })
    const data = await res.json()
    if (data.ok) {
      setNotified(true)
      toast.success('נרשמת! נשלח לך עדכון כשהמוצר יהיה זמין')
    } else {
      toast.error('שגיאה, נסה שוב')
    }
    setNotifyLoading(false)
  }

  return (
    <div className="pt-28 md:pt-40 min-h-screen bg-cream pb-20 md:pb-0" dir="rtl">
      {/* Breadcrumb */}
      <div className="px-6 py-4 flex items-center gap-2 text-xs text-warm-gray">
        <Link href="/shop/all" className="hover:text-charcoal transition-colors">חנות</Link>
        <ChevronRight size={12} />
        <span className="text-charcoal">{product.name}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] bg-cream-dark overflow-hidden">
              <Image
                src={product.images[activeImage] || ''}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {!product.in_stock && (
                <div className="absolute inset-0 flex items-center justify-center bg-cream/60">
                  <span className="bg-red-brand text-cream px-6 py-2 text-sm tracking-widest uppercase">
                    אזל מהמלאי
                  </span>
                </div>
              )}
              {isComingSoon && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/50 backdrop-blur-[2px]">
                  <span className="bg-cream text-charcoal px-6 py-2 text-sm tracking-widest uppercase font-medium">
                    בקרוב
                  </span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-square overflow-hidden border-2 transition-colors ${
                      i === activeImage ? 'border-charcoal' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="py-4 space-y-6">
            <div>
              <p className="text-xs tracking-widest uppercase text-warm-gray mb-3" style={{ letterSpacing: '0.2em' }}>
                Nehoray Leizer — Collection 01
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-charcoal font-light">{product.name}</h1>
              {product.short_description && (
                <p className="text-sm text-warm-gray mt-3">{product.short_description}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              {product.sale_price ? (
                <>
                  <span className="font-serif text-3xl text-red-brand">{formatPrice(product.sale_price)}</span>
                  <span className="text-lg text-warm-gray line-through">{formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="font-serif text-3xl text-charcoal">{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="h-px bg-light-gray" />

            {/* Color */}
            {product.colors.length > 0 && (
              <div>
                <p className="form-label">צבע — <span className="normal-case font-normal text-charcoal">{selectedColor || 'בחר צבע'}</span></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.colors.map((color) => {
                    const isOut = product.out_of_stock_colors?.includes(color)
                    return (
                      <button
                        key={color}
                        onClick={() => !isOut && setSelectedColor(color)}
                        disabled={isOut}
                        className={`px-4 py-2 text-sm border transition-colors relative ${
                          isOut
                            ? 'border-light-gray text-warm-gray/50 cursor-not-allowed line-through'
                            : selectedColor === color
                            ? 'border-charcoal bg-charcoal text-cream'
                            : 'border-light-gray text-charcoal hover:border-charcoal'
                        }`}
                      >
                        {color}{isOut && ' (אזל)'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="form-label mb-0">מידה — <span className="normal-case font-normal text-charcoal">{selectedSize || 'בחר מידה'}</span></p>
                  {sizeChart && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('size-chart-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="flex items-center gap-1 text-xs text-charcoal underline underline-offset-2 hover:text-warm-gray transition-colors"
                    >
                      <Ruler size={12} /> טבלת מידות
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.sizes.map((size) => {
                    const isOut = product.out_of_stock_sizes?.includes(size)
                    return (
                      <button
                        key={size}
                        onClick={() => !isOut && setSelectedSize(size)}
                        disabled={isOut}
                        className={`w-14 h-12 text-sm border transition-colors ${
                          isOut
                            ? 'border-light-gray text-warm-gray/50 cursor-not-allowed line-through'
                            : selectedSize === size
                            ? 'border-charcoal bg-charcoal text-cream'
                            : 'border-light-gray text-charcoal hover:border-charcoal'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="form-label">כמות</p>
              <div className="flex items-center border border-light-gray w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-cream-dark transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="flex-1 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-cream-dark transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA */}
            {isComingSoon ? (
              <div className="space-y-4">
                <div className="bg-charcoal text-cream px-4 py-3 text-center">
                  <p className="text-xs tracking-widest uppercase mb-0.5">Coming Soon</p>
                  {product.available_from && (
                    <p className="text-xs text-cream/70">
                      זמין מ-{new Date(product.available_from).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
                {notified ? (
                  <div className="text-center py-3 text-sm text-green-700">
                    ✓ נרשמת לעדכון — נודיע לך כשיהיה זמין
                  </div>
                ) : (
                  <form id="notify-form" onSubmit={handleNotifyMe} className="space-y-3">
                    <p className="text-xs text-warm-gray flex items-center gap-1.5">
                      <Bell size={12} />
                      קבל עדכון כשהמוצר יהיה זמין להזמנה
                    </p>
                    <input
                      type="text"
                      className="form-input text-sm"
                      placeholder="שם (אופציונלי)"
                      value={notifyName}
                      onChange={e => setNotifyName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="form-input text-sm"
                      placeholder="האימייל שלך *"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={notifyLoading}
                      className="w-full btn-primary disabled:opacity-50"
                    >
                      {notifyLoading ? 'שולח...' : 'עדכנו אותי'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAdd}
                  className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!product.in_stock || allSizesOut || allColorsOut
                    ? 'אזל מהמלאי'
                    : selectedSizeOut || selectedColorOut
                    ? 'האפשרות הזו אזלה'
                    : 'הוסף לסל — Pre-Order'}
                </button>
              </div>
            )}

            {/* Pre-order note */}
            <div className="bg-cream-dark p-4 text-xs text-warm-gray leading-relaxed">
              <p className="font-medium text-charcoal mb-1">הזמנה מוקדמת — Pre Order</p>
              <p>הקולקציה מיוצרת לפי הזמנה לאחר סגירת המכירה. נעדכן אותך בכל שלב — ייצור, אריזה ומשלוח.</p>
            </div>

            {/* Description */}
            {product.full_description && (
              <div className="border-t border-light-gray pt-6 space-y-4">
                <p className="form-label">תיאור המוצר</p>
                <p className="text-sm text-warm-gray leading-relaxed whitespace-pre-line">
                  {product.full_description}
                </p>
              </div>
            )}

            {/* Size chart */}
            {sizeChart && (
              <div id="size-chart-section" className="border-t border-light-gray pt-6 space-y-4 scroll-mt-24 md:scroll-mt-36">
                <SizeChartDisplay chart={sizeChart} />
              </div>
            )}

            {/* FAQ */}
            {product.faqs && product.faqs.length > 0 && (
              <div className="border-t border-light-gray pt-6 space-y-4">
                <p className="form-label">שאלות ותשובות</p>
                <FAQAccordion items={product.faqs} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-cream border-t border-light-gray px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-warm-gray truncate">{product.name}</p>
          <p className="font-serif text-base text-charcoal font-medium">
            {product.sale_price
              ? <><span className="text-red-brand">{formatPrice(product.sale_price)}</span></>
              : formatPrice(product.price)}
          </p>
        </div>
        {isComingSoon ? (
          <button
            onClick={() => document.getElementById('notify-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary text-xs px-6 py-3"
          >
            עדכנו אותי
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="btn-primary text-xs px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!product.in_stock || allSizesOut || allColorsOut ? 'אזל מהמלאי' : 'הוסף לסל'}
          </button>
        )}
      </div>
    </div>
  )
}
