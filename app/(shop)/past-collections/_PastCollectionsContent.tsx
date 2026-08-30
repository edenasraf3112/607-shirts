'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Collection } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PastCollectionsContent() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', phone: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .in('status', ['closed', 'production', 'shipped'])
      setCollections(data || [])
    }
    load()
  }, [])

  async function requestReturn(collectionId: string, collectionName: string) {
    if (!formData.email && !formData.phone) {
      toast.error('אנא הזן מייל או טלפון')
      return
    }
    setLoading(true)
    await supabase.from('messages').insert({
      name: formData.email || formData.phone,
      email: formData.email,
      phone: formData.phone,
      type: 'collection_request',
      message: `בקשת החזרה של קולקציה: ${collectionName} (${collectionId})`,
      subscribe: true,
    })
    toast.success('בקשתך התקבלה! נעדכן אותך אם הקולקציה תחזור.')
    setActiveForm(null)
    setFormData({ email: '', phone: '' })
    setLoading(false)
  }

  const statusLabels: Record<string, string> = {
    closed: 'נסגרה',
    production: 'בייצור',
    shipped: 'נשלחה',
  }
  const statusColors: Record<string, string> = {
    closed: 'bg-gray-100 text-gray-600',
    production: 'bg-blue-50 text-blue-700',
    shipped: 'bg-green-50 text-green-700',
  }

  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <p className="text-xs tracking-widest uppercase text-warm-gray mb-4" style={{ letterSpacing: '0.25em' }}>
          Archive
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">קולקציות עבר</h1>
        <p className="text-sm text-warm-gray mt-4 max-w-md mx-auto">
          קולקציות שנסגרו — אם פיספסת, תוכל לבקש שתחזור
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {collections.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-warm-gray">אין עדיין קולקציות ארכיב</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((col) => (
              <div key={col.id} className="bg-white group">
                <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
                  {col.cover_image ? (
                    <Image
                      src={col.cover_image}
                      alt={col.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 grayscale"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-cream-dark" />
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[col.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[col.status] || col.status}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-charcoal">{col.name}</h3>
                  {col.description && (
                    <p className="text-sm text-warm-gray mt-2 line-clamp-2">{col.description}</p>
                  )}
                  <p className="text-xs text-warm-gray/60 mt-3">
                    {formatDate(col.open_date)} — {formatDate(col.close_date)}
                  </p>

                  {activeForm === col.id ? (
                    <div className="mt-4 space-y-2">
                      <input
                        className="form-input text-sm"
                        placeholder="מייל"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                      <input
                        className="form-input text-sm"
                        placeholder="טלפון"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => requestReturn(col.id, col.name)}
                          disabled={loading}
                          className="flex-1 py-2.5 bg-charcoal text-cream text-xs tracking-wider hover:bg-charcoal/80 transition-colors disabled:opacity-50"
                        >
                          {loading ? '...' : 'שלח בקשה'}
                        </button>
                        <button
                          onClick={() => setActiveForm(null)}
                          className="px-4 py-2.5 border border-light-gray text-xs text-warm-gray hover:border-charcoal transition-colors"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveForm(col.id)}
                      className="mt-4 w-full py-3 border border-charcoal text-xs tracking-widest uppercase hover:bg-charcoal hover:text-cream transition-colors"
                      style={{ letterSpacing: '0.15em' }}
                    >
                      בקשו להחזיר
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
