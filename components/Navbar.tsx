'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ShoppingBag, Heart, Search, User, Home, LogIn } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'

const DEFAULT_LOGO = '/assets/branding/brand-logo.png'

const navLinks = [
  { label: 'החנות', href: '/shop/all' },
  { label: 'צור קשר', href: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)
  const { itemCount } = useCart()
  const { count: favoriteCount } = useWishlist()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/logo-url')
      .then(r => r.json())
      .then(d => { if (d.url) setLogoSrc(d.url) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-cream transition-shadow duration-300 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="relative flex items-center justify-between h-16 md:h-36">
            {/* Mobile: hamburger only */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 text-charcoal hover:opacity-60 transition-opacity"
              aria-label="תפריט"
            >
              <Menu size={22} />
            </button>
            <div className="hidden md:block w-10" />

            {/* Logo */}
            <Link href="/home" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="607 חולצות"
                className="h-10 md:h-32 w-auto object-contain"
              />
            </Link>

            {/* Mobile: cart only */}
            <div className="flex items-center gap-1">
              <Link href="/cart" className="md:hidden p-2 text-charcoal hover:opacity-60 transition-opacity relative" aria-label="סל קניות">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 bg-red-brand text-cream text-xs w-4 h-4 flex items-center justify-center rounded-full leading-none">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Desktop icons */}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/home" className="p-2 text-charcoal hover:opacity-60 transition-opacity" aria-label="דף הבית">
                  <Home size={20} />
                </Link>
                <button onClick={() => setSearchOpen((s) => !s)} className="p-2 text-charcoal hover:opacity-60 transition-opacity" aria-label="חיפוש">
                  <Search size={20} />
                </button>
                <Link href="/favorites" className="p-2 text-charcoal hover:opacity-60 transition-opacity relative" aria-label="מועדפים">
                  <Heart size={20} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 bg-red-brand text-cream text-xs w-4 h-4 flex items-center justify-center rounded-full leading-none">
                      {favoriteCount}
                    </span>
                  )}
                </Link>
                <Link
                  href={user ? '/account' : '/auth/login'}
                  className="p-2 text-charcoal hover:opacity-60 transition-opacity relative"
                  aria-label="אזור אישי"
                >
                  <User size={20} />
                  {user && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </Link>
                <Link href="/cart" className="p-2 text-charcoal hover:opacity-60 transition-opacity relative" aria-label="סל קניות">
                  <ShoppingBag size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 bg-red-brand text-cream text-xs w-4 h-4 flex items-center justify-center rounded-full leading-none">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="border-t border-light-gray py-3 animate-fade-in">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 max-w-md mx-auto">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש מוצרים..."
                  className="flex-1 border border-light-gray bg-cream px-4 py-2 text-sm focus:outline-none focus:border-charcoal"
                />
                <button type="submit" className="p-2 text-charcoal hover:opacity-60 transition-opacity" aria-label="חפש">
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Bottom row: categories evenly spaced */}
          <nav className="hidden md:flex items-center justify-between border-t border-light-gray py-3.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1 text-center text-xs tracking-widest uppercase text-charcoal hover:text-warm-gray transition-colors duration-200"
                style={{ letterSpacing: '0.15em' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-cream flex flex-col transition-transform duration-400 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-6 border-b border-light-gray">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="607 חולצות" className="h-8 w-auto object-contain" />
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-charcoal hover:opacity-60"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3.5 text-sm tracking-wider uppercase text-charcoal border-b border-light-gray/50 hover:text-warm-gray transition-colors"
                style={{ letterSpacing: '0.15em' }}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/favorites" onClick={() => setOpen(false)} className="py-3.5 text-sm tracking-wider uppercase text-charcoal border-b border-light-gray/50 hover:text-warm-gray transition-colors flex items-center gap-2" style={{ letterSpacing: '0.15em' }}>
              <Heart size={14} /> מועדפים
            </Link>
            <Link href="/search" onClick={() => setOpen(false)} className="py-3.5 text-sm tracking-wider uppercase text-charcoal border-b border-light-gray/50 hover:text-warm-gray transition-colors flex items-center gap-2" style={{ letterSpacing: '0.15em' }}>
              <Search size={14} /> חיפוש
            </Link>
            {user ? (
              <Link href="/account" onClick={() => setOpen(false)} className="py-3.5 text-sm tracking-wider uppercase text-charcoal border-b border-light-gray/50 hover:text-warm-gray transition-colors flex items-center gap-2" style={{ letterSpacing: '0.15em' }}>
                <User size={14} /> אזור אישי
              </Link>
            ) : (
              <Link href="/auth/login" onClick={() => setOpen(false)} className="py-3.5 text-sm tracking-wider uppercase text-charcoal border-b border-light-gray/50 hover:text-warm-gray transition-colors flex items-center gap-2" style={{ letterSpacing: '0.15em' }}>
                <LogIn size={14} /> כניסה / הרשמה
              </Link>
            )}
          </nav>
          <div className="mt-auto p-6 border-t border-light-gray">
            <p className="text-xs text-warm-gray text-center" style={{ letterSpacing: '0.1em' }}>
              607 חולצות
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
