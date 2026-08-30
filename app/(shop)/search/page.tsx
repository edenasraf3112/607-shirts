'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/supabase'

const DEMO: Product[] = [
  { id: 'd1', name: 'חולצת Collection 01', price: 290, short_description: 'כותנה פרימיום', full_description: '', images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'], sizes: ['S','M','L','XL'], colors: ['לבן','שחור'], tags: ['all','גברים'], display_order: 1, in_stock: true, created_at: '' },
  { id: 'd2', name: 'הוד Collection 01', price: 390, short_description: 'פליס כבד', full_description: '', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'], sizes: ['S','M','L','XL'], colors: ['פחם'], tags: ['all','גברים','נשים'], display_order: 2, in_stock: true, created_at: '' },
  { id: 'd3', name: 'ג\'קט Collection 01', price: 590, short_description: 'פרימיום מוגבל', full_description: '', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80'], sizes: ['M','L','XL'], colors: ['שחור'], tags: ['all','גברים'], display_order: 3, in_stock: true, created_at: '' },
  { id: 'd4', name: 'צמיד Collection 01', price: 120, short_description: 'נירוסטה עם חריטה', full_description: '', images: ['https://images.unsplash.com/photo-1573408301185-9519bf9f3a24?w=600&q=80'], sizes: [], colors: ['כסף','זהב'], tags: ['all','אקססוריז'], display_order: 4, in_stock: false, created_at: '' },
  { id: 'd5', name: 'טי שירט Nehoray Leizer', price: 220, short_description: 'כותנה 100%, לוגו רקום', full_description: '', images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80'], sizes: ['S','M','L','XL','XXL'], colors: ['לבן','אופוויט'], tags: ['all','גברים','נשים'], display_order: 5, in_stock: true, created_at: '' },
  { id: 'd6', name: 'כובע Collection 01', price: 150, short_description: 'כובע בייסבול פרימיום', full_description: '', images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'], sizes: ['One Size'], colors: ['שחור','לבן'], tags: ['all','אקססוריז'], display_order: 6, in_stock: true, created_at: '' },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('products').select('*').order('display_order')
        setAllProducts(data && data.length > 0 ? data : DEMO)
      } catch {
        setAllProducts(DEMO)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const results = query.trim()
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.short_description?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light mb-8">חיפוש</h1>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מוצרים..."
            className="flex-1 border border-light-gray bg-cream px-4 py-2.5 text-sm focus:outline-none focus:border-charcoal"
            autoFocus
          />
          <button type="submit" className="p-2.5 border border-charcoal hover:bg-charcoal hover:text-cream transition-colors" aria-label="חפש">
            <SearchIcon size={16} />
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !query.trim() ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-warm-gray">הקלידו שם מוצר לחיפוש</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-warm-gray">לא נמצאו תוצאות עבור "{query}"</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-warm-gray/60 mb-6">{results.length} תוצאות עבור "{query}"</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
