'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import ProductCard from '@/components/ProductCard'

export default function FavoritesPage() {
  const { items } = useWishlist()

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">מועדפים</h1>
        <p className="text-sm text-warm-gray mt-4">המוצרים ששמרת לעצמך</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={40} className="mx-auto text-warm-gray/40 mb-4" />
            <p className="font-serif text-2xl text-warm-gray">אין עדיין מוצרים שמורים</p>
            <p className="text-sm text-warm-gray/60 mt-3 mb-8">
              לחץ על סימן הלב במוצר כדי לשמור אותו כאן
            </p>
            <Link href="/shop/all" className="btn-primary">לקולקציה</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
