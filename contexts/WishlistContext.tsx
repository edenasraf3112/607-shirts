'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Product } from '@/lib/supabase'

type WishlistContextType = {
  items: Product[]
  count: number
  isFavorite: (productId: string) => boolean
  toggleFavorite: (product: Product) => void
  removeFavorite: (productId: string) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('lazer_wishlist')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('lazer_wishlist', JSON.stringify(items))
  }, [items])

  const isFavorite = (productId: string) => items.some((p) => p.id === productId)

  const toggleFavorite = (product: Product) => {
    setItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    )
  }

  const removeFavorite = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isFavorite, toggleFavorite, removeFavorite }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
