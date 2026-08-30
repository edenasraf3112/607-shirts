'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Product } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'

type CartItem = {
  product: Product
  quantity: number
  size?: string
  color?: string
}

type CartContextType = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void
  removeItem: (productId: string, size?: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('lazer_cart')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('lazer_cart', JSON.stringify(items))
  }, [items])

  const key = (productId: string, size?: string, color?: string) =>
    `${productId}__${size || ''}__${color || ''}`

  const addItem = (product: Product, quantity = 1, size?: string, color?: string) => {
    if (!product.in_stock) return
    trackEvent('add_to_cart', { product_id: product.id })
    setItems((prev) => {
      const k = key(product.id, size, color)
      const existing = prev.find(
        (i) => key(i.product.id, i.size, i.color) === k
      )
      if (existing) {
        return prev.map((i) =>
          key(i.product.id, i.size, i.color) === k
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { product, quantity, size, color }]
    })
  }

  const removeItem = (productId: string, size?: string, color?: string) => {
    const k = key(productId, size, color)
    setItems((prev) => prev.filter((i) => key(i.product.id, i.size, i.color) !== k))
  }

  const updateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    const k = key(productId, size, color)
    if (quantity <= 0) { removeItem(productId, size, color); return }
    setItems((prev) =>
      prev.map((i) =>
        key(i.product.id, i.size, i.color) === k ? { ...i, quantity } : i
      )
    )
  }

  const clearCart = () => setItems([])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => {
    const price = i.product.sale_price || i.product.price
    return sum + price * i.quantity
  }, 0)

  return (
    <CartContext.Provider value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
