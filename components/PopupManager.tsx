'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Popup } from '@/lib/supabase'
import Image from 'next/image'

export default function PopupManager({ page = 'home' }: { page?: string }) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function fetchPopup() {
      const { data } = await supabase
        .from('popups')
        .select('*')
        .eq('is_active', true)
        .or(`pages.cs.{all},pages.cs.{${page}}`)
        .limit(1)
        .single()

      if (data) {
        setPopup(data)
        if (data.trigger === 'immediate') {
          setVisible(true)
        } else if (data.trigger === 'delayed') {
          setTimeout(() => setVisible(true), (data.trigger_delay || 3) * 1000)
        } else if (data.trigger === 'exit') {
          const handler = () => {
            if ((window.event as MouseEvent)?.clientY <= 0) setVisible(true)
          }
          document.addEventListener('mouseleave', handler)
          return () => document.removeEventListener('mouseleave', handler)
        }
      }
    }
    fetchPopup()
  }, [page])

  if (!popup || !visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setVisible(false)} />
      <div
        className="relative max-w-md w-full shadow-2xl animate-scale-in"
        style={{ background: popup.bg_color, color: popup.text_color }}
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 left-4 opacity-60 hover:opacity-100 transition-opacity z-10"
        >
          <X size={20} />
        </button>
        {popup.image && (
          <div className="relative h-48 w-full">
            <Image src={popup.image} alt={popup.title} fill className="object-cover" />
          </div>
        )}
        <div className="p-8 text-center" dir="rtl">
          <h3 className="font-serif text-3xl mb-3">{popup.title}</h3>
          {popup.text && <p className="text-sm leading-relaxed opacity-80 mb-6">{popup.text}</p>}
          {popup.button_text && popup.button_link && (
            <a
              href={popup.button_link}
              className="inline-block px-8 py-3 text-sm tracking-widest uppercase border border-current hover:opacity-70 transition-opacity"
              style={{ letterSpacing: '0.2em' }}
            >
              {popup.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
