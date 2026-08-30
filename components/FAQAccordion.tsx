'use client'

import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FAQItem } from '@/lib/supabase'

function FAQRow({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 gap-4 text-right"
      >
        <span className="text-sm md:text-base text-charcoal font-medium">{item.question}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-warm-gray transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        style={{ maxHeight: isOpen ? (contentRef.current?.scrollHeight ?? 500) : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div ref={contentRef}>
          <p className="text-sm text-warm-gray leading-relaxed pb-4 whitespace-pre-line">{item.answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (!items || items.length === 0) return null

  return (
    <div className="divide-y divide-light-gray border-t border-b border-light-gray">
      {items.map(item => (
        <FAQRow
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  )
}
