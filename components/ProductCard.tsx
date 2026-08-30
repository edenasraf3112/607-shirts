'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useWishlist } from '@/contexts/WishlistContext'
import type { Product } from '@/lib/supabase'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80'

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] || PLACEHOLDER
  const now = new Date()
  const isComingSoon = !!product.available_from && new Date(product.available_from) > now
  const isOutOfStock = !product.in_stock && !isComingSoon
  const isExpired = !isComingSoon && !!product.available_until && new Date(product.available_until) < now
  const unavailable = isOutOfStock || isExpired
  const { isFavorite, toggleFavorite } = useWishlist()
  const favorite = isFavorite(product.id)
  const [popped, setPopped] = useState(false)

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="product-card bg-white">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-cream-dark">
          <Image
            src={image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-700 ${!isComingSoon && !unavailable ? 'group-hover:scale-105' : ''} ${unavailable ? 'brightness-75' : ''}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(product)
              setPopped(true)
              setTimeout(() => setPopped(false), 350)
            }}
            className="absolute top-3 left-3 z-10 p-2 rounded-full bg-cream/80 hover:bg-cream transition-colors"
            aria-label="הוסף למועדפים"
          >
            <Heart
              size={16}
              className={`${favorite ? 'fill-red-brand text-red-brand' : 'text-charcoal'} ${popped ? 'animate-heart-pop' : ''}`}
            />
          </button>

          {/* Sold out overlay */}
          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-red-brand text-cream text-sm px-5 py-2 tracking-widest uppercase font-medium" style={{ letterSpacing: '0.15em' }}>
                אזל מהמלאי
              </span>
            </div>
          )}

          {/* Coming soon overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-cream text-charcoal text-sm px-5 py-2 tracking-widest uppercase font-medium" style={{ letterSpacing: '0.15em' }}>
                COMING SOON
              </span>
            </div>
          )}

          {/* Sale badge */}
          {product.sale_price && product.in_stock && !isComingSoon && (
            <div className="absolute top-3 right-3">
              <span className="bg-charcoal text-cream text-xs px-3 py-1 tracking-wider">
                SALE
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 pb-2 px-1">
          <h3 className="font-serif text-lg text-charcoal leading-tight">{product.name}</h3>
          {product.short_description && (
            <p className="text-xs text-warm-gray mt-1 line-clamp-1">{product.short_description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {product.sale_price ? (
              <>
                <span className="text-sm font-medium text-red-brand">{formatPrice(product.sale_price)}</span>
                <span className="text-xs text-warm-gray line-through">{formatPrice(product.price)}</span>
              </>
            ) : (
              <span className="text-sm font-medium text-charcoal">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {product.tags.filter(t => t !== 'all').map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-warm-gray/70 border border-light-gray px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
