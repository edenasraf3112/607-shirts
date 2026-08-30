'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Package, LogOut, Edit2, Check, X, TrendingUp, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatPrice, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { Order } from '@/lib/supabase'
import toast from 'react-hot-toast'
import CollectionProgress from '@/components/CollectionProgress'
import { CLOTHING_CATEGORIES, COLLECTION_PROGRESS_STEPS } from '@/lib/clothing-categories'
import type { ProgressSteps } from '@/lib/clothing-categories'

function getCategoryLabel(value: string) {
  return CLOTHING_CATEGORIES.find(c => c.value === value)?.label || value
}

type CollectionInfo = {
  id: string
  name: string
  status: string
  estimated_delivery?: string
  progress_steps?: ProgressSteps
}

export default function AccountPage() {
  const { user, profile, loading, signOut, updateProfile } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [pickupNumber, setPickupNumber] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading])

  useEffect(() => {
    if (user) {
      claimOrders().then(loadOrders)
      loadPickupNumber()
      setEditForm({
        name: profile?.name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
      })
    }
  }, [user, profile])

  async function claimOrders() {
    try {
      await fetch('/api/account/claim-orders', { method: 'POST' })
    } catch {}
  }

  async function loadPickupNumber() {
    try {
      const res = await fetch('/api/account/pickup-number')
      const data = await res.json()
      setPickupNumber(data.pickupNumber ?? null)
    } catch {}
  }

  async function loadOrders() {
    if (!user) return
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/account/orders')
      const data = await res.json()
      setOrders((data.orders as Order[]) || [])
      setCollections((data.collections as CollectionInfo[]) || [])
    } catch {}
    setOrdersLoading(false)
  }

  async function saveProfile() {
    await updateProfile(editForm)
    toast.success('הפרטים עודכנו')
    setEditing(false)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/home')
  }

  // Derived stats
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0)
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((is, i) => is + (Number(i.quantity) || 1), 0), 0)

  // Size preferences by category (derived from order items)
  const sizesByCategory = new Map<string, Map<string, number>>()
  for (const order of orders) {
    for (const item of order.items) {
      const category = (item as any).clothing_category || ''
      const size = item.size || ''
      if (category && size) {
        if (!sizesByCategory.has(category)) sizesByCategory.set(category, new Map())
        const catMap = sizesByCategory.get(category)!
        catMap.set(size, (catMap.get(size) || 0) + (Number(item.quantity) || 1))
      }
    }
  }
  const sizePrefsByCategory = Array.from(sizesByCategory.entries()).map(([cat, sizeMap]) => {
    const topSize = Array.from(sizeMap.entries()).sort((a, b) => b[1] - a[1])[0]
    return { category: cat, size: topSize[0] }
  })

  // Group orders by collection
  const ordersByCollection = new Map<string, Order[]>()
  for (const order of orders) {
    if (order.collection_id) {
      const existing = ordersByCollection.get(order.collection_id) || []
      ordersByCollection.set(order.collection_id, [...existing, order])
    }
  }

  if (loading) {
    return (
      <div className="pt-16 md:pt-40 min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      {/* Header */}
      <div className="py-16 px-6 text-center border-b border-light-gray bg-cream">
        <p className="text-xs text-warm-gray tracking-widest uppercase mb-3">האזור האישי</p>
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">
          {profile?.name ? profile.name : user.email?.split('@')[0]}
        </h1>
        <p className="text-sm text-warm-gray mt-3">{user.email}</p>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-xs text-warm-gray hover:text-charcoal mt-4 transition-colors"
        >
          <LogOut size={14} />
          התנתק
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* Pickup number */}
        {pickupNumber !== null && (
          <div className="bg-charcoal rounded-xl px-6 py-7 text-center">
            <p className="text-[11px] tracking-[3px] uppercase text-cream/65 mb-2">מספר החבילה שלך</p>
            <p className="font-serif text-5xl font-bold text-cream leading-none">{pickupNumber}</p>
            <p className="text-sm text-cream/90 mt-3">שמור את המספר הזה למועד החלוקה</p>
          </div>
        )}

        {/* Summary stats */}
        {orders.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-light-gray border border-light-gray rounded-xl overflow-hidden">
            <div className="bg-white p-5 text-center">
              <p className="font-serif text-3xl text-charcoal">{orders.length}</p>
              <p className="text-xs text-warm-gray mt-1">הזמנות</p>
            </div>
            <div className="bg-white p-5 text-center">
              <p className="font-serif text-3xl text-charcoal">{totalItems}</p>
              <p className="text-xs text-warm-gray mt-1">פריטים</p>
            </div>
            <div className="bg-white p-5 text-center">
              <p className="font-serif text-3xl text-charcoal">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-warm-gray mt-1">סה"כ</p>
            </div>
          </div>
        )}

        {/* Profile section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl text-charcoal">הפרטים שלי</h2>
            {!editing ? (
              <button
                onClick={() => {
                  setEditForm({ name: profile?.name || '', phone: profile?.phone || '', address: profile?.address || '' })
                  setEditing(true)
                }}
                className="flex items-center gap-1.5 text-xs text-warm-gray hover:text-charcoal transition-colors"
              >
                <Edit2 size={13} /> ערוך
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={saveProfile} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900">
                  <Check size={13} /> שמור
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal">
                  <X size={13} /> ביטול
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-light-gray rounded-xl p-6">
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label">שם מלא</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label">טלפון</label>
                  <input className="form-input" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">כתובת</label>
                  <input className="form-input" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-5 text-sm">
                <div>
                  <p className="text-warm-gray text-xs mb-1">שם</p>
                  <p className="text-charcoal font-medium">{profile?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-warm-gray text-xs mb-1">טלפון</p>
                  <p className="text-charcoal font-medium">{profile?.phone || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-warm-gray text-xs mb-1">כתובת</p>
                  <p className="text-charcoal font-medium">{profile?.address || '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Size preferences */}
        {sizePrefsByCategory.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-5">המידות המועדפות שלי</h2>
            <div className="bg-white border border-light-gray rounded-xl p-6">
              <p className="text-xs text-warm-gray mb-4">מחושב מתוך היסטוריית ההזמנות שלך</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sizePrefsByCategory.map(({ category, size }) => (
                  <div key={category} className="border border-light-gray rounded-lg p-3">
                    <p className="text-xs text-warm-gray mb-1">{getCategoryLabel(category)}</p>
                    <p className="font-serif text-xl text-charcoal">{size}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collection history with progress */}
        {collections.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-5">הקולקציות שלי</h2>
            <div className="space-y-4">
              {collections.map(col => {
                const colOrders = ordersByCollection.get(col.id) || []
                const colItems = colOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + (Number(i.quantity) || 1), 0), 0)
                const colTotal = colOrders.reduce((s, o) => s + (o.total || 0), 0)
                return (
                  <div key={col.id} className="bg-white border border-light-gray rounded-xl overflow-hidden">
                    {/* Collection header */}
                    <div className="p-6 border-b border-light-gray">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-serif text-xl text-charcoal">{col.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-warm-gray">{colItems} פריטים</span>
                            <span className="text-warm-gray/30">·</span>
                            <span className="text-xs text-warm-gray">{formatPrice(colTotal)}</span>
                          </div>
                        </div>
                        {col.estimated_delivery && (
                          <div className="text-left flex-shrink-0">
                            <p className="text-xs text-warm-gray">אספקה משוערת</p>
                            <p className="text-sm text-charcoal font-medium mt-0.5">{col.estimated_delivery}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress tracker */}
                    {col.progress_steps && Object.keys(col.progress_steps).length > 0 && (
                      <div className="p-6">
                        <p className="text-xs text-warm-gray uppercase tracking-wider mb-4">התקדמות הקולקציה</p>
                        <CollectionProgress steps={col.progress_steps as ProgressSteps} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Orders section */}
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-5">ההזמנות שלי</h2>

          {ordersLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-light-gray rounded-xl">
              <Package size={32} className="mx-auto text-warm-gray/30 mb-4" />
              <p className="text-warm-gray mb-4 font-serif text-lg">לא נמצאו הזמנות</p>
              <Link href="/shop/all" className="btn-primary text-sm">לקולקציה</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const colInfo = order.collection_id ? collections.find(c => c.id === order.collection_id) : null
                return (
                  <div key={order.id} className="bg-white border border-light-gray rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-light-gray flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-warm-gray">{formatDate(order.created_at)}</p>
                        <p className="text-xs text-warm-gray/50 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
                        {colInfo && (
                          <p className="text-xs text-warm-gray mt-0.5">{colInfo.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.paid_at && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">שולם ✓</span>
                        )}
                        <span className={`text-xs px-3 py-1 tracking-wider rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-warm-gray">
                          <span>
                            {item.product_name}
                            {item.size && ` — ${item.size}`}
                            {item.color && ` — ${item.color}`}
                            {' × '}{item.quantity}
                          </span>
                          <span className="ml-4 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between px-5 py-3 border-t border-light-gray">
                      <span className="text-xs text-warm-gray">סה"כ</span>
                      <span className="font-serif text-lg text-charcoal">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
