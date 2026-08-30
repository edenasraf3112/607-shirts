'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Package, Grid3X3, ShoppingBag,
  Users, Tag, Megaphone, FileText, Palette, BookHeart, LogOut, Menu, X, StickyNote, Wrench,
  Mail, ListTodo, Activity, Inbox, BarChart3, History, ListChecks, HelpCircle, Ruler,
} from 'lucide-react'

const NAV = [
  { label: 'דשבורד', href: '/admin', icon: LayoutDashboard },
  { label: 'מוצרים', href: '/admin/products', icon: Package },
  { label: 'קולקציות', href: '/admin/collections', icon: Grid3X3 },
  { label: 'טבלאות מידות', href: '/admin/size-charts', icon: Ruler },
  { label: 'הזמנות', href: '/admin/orders', icon: ShoppingBag },
  { label: 'הדפסת מדבקות', href: '/admin/orders/labels', icon: StickyNote },
  { label: 'לקוחות', href: '/admin/customers', icon: Users },
  { label: 'רשימת המתנה', href: '/admin/waitlist', icon: Inbox },
  { label: 'אימיילים ושיווק', href: '/admin/emails', icon: Mail },
  { label: 'יומן משימות', href: '/admin/tasks', icon: ListTodo },
  { label: 'לוג פעילות', href: '/admin/activity', icon: Activity },
  { label: 'קודי הנחה', href: '/admin/discounts', icon: Tag },
  { label: 'פופאפים', href: '/admin/popups', icon: Megaphone },
  { label: 'הודעות', href: '/admin/messages', icon: FileText },
  { label: 'שאלות ותשובות', href: '/admin/faq', icon: HelpCircle },
  { label: 'הסיפור שלו', href: '/admin/story', icon: BookHeart },
  { label: 'מדבקות & דגלים', href: '/admin/stickers', icon: StickyNote },
  { label: 'תוכן ועיצוב', href: '/admin/content', icon: Palette },
  { label: 'שיפוצים', href: '/admin/under-construction', icon: Wrench },
  { label: 'פעילות', href: '/admin/activity', icon: History },
  { label: 'משימות', href: '/admin/tasks', icon: ListChecks },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-charcoal text-cream w-64 flex-shrink-0">
      <div className="p-6 border-b border-cream/10">
        <Image src="/assets/branding/logo-white.png" alt="Nehoray Leizer" width={60} height={30} className="h-8 w-auto object-contain" />
        <p className="text-xs text-cream/40 mt-2 tracking-wider">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                active ? 'bg-cream/10 text-cream' : 'text-cream/60 hover:text-cream hover:bg-cream/5'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-cream/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-cream/60 hover:text-cream w-full rounded-lg hover:bg-cream/5 transition-colors"
        >
          <LogOut size={16} />
          יציאה
        </button>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-xs text-cream/30 hover:text-cream/60 mt-1 transition-colors"
        >
          ← צפה באתר
        </Link>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-cream-dark">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-light-gray px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1 text-charcoal"
          >
            <Menu size={20} />
          </button>
          <div />
          <div className="text-xs text-warm-gray tracking-wider">Nehoray Leizer Admin</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
