'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PopupBlock, PopupData, LayoutType } from '@/lib/popup-types'
import { DEFAULT_POPUP_SETTINGS, DEFAULT_OVERLAY } from '@/lib/popup-types'

// ─── Block renderer ────────────────────────────────────────────────────────────

function Block({
  block,
  onSubmit,
  asSubmit,
}: {
  block: PopupBlock
  onSubmit?: (field: string, val: string) => void
  asSubmit?: boolean
}) {
  if (!block.visible) return null

  const spacing: React.CSSProperties = {
    marginTop: block.marginTop ?? 0,
    marginBottom: block.marginBottom ?? 0,
  }

  if (block.type === 'image') {
    if (!block.src) return null
    return (
      <div style={{ position: 'relative', height: block.imageHeight || 200, overflow: 'hidden', ...spacing }}>
        <img
          src={block.src}
          alt={block.alt || ''}
          style={{ width: '100%', height: '100%', objectFit: block.objectFit || 'cover', objectPosition: block.objectPosition || 'center' }}
        />
        {block.overlayColor && (
          <div style={{ position: 'absolute', inset: 0, background: block.overlayColor, opacity: block.overlayOpacity ?? 0.3 }} />
        )}
      </div>
    )
  }

  if (block.type === 'logo') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', ...spacing }}>
        <img src="/assets/branding/brand-logo.png" alt="logo" style={{ height: block.imageHeight || 48, objectFit: 'contain' }} />
      </div>
    )
  }

  if (block.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: `1px solid ${block.color || '#E8E5E0'}`, ...spacing }} />
  }

  if (block.type === 'badge') {
    const align = block.textAlign === 'right' ? 'flex-end' : block.textAlign === 'left' ? 'flex-start' : 'center'
    return (
      <div style={{ display: 'flex', justifyContent: align, ...spacing }}>
        <span style={{
          display: 'inline-block', fontSize: block.fontSize || 10, fontWeight: block.fontWeight || '600',
          color: block.color || '#FFF', background: block.backgroundColor || '#1A1A1A',
          borderRadius: block.borderRadius ?? 999, padding: `${block.paddingY ?? 4}px ${block.paddingX ?? 12}px`,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>{block.text}</span>
      </div>
    )
  }

  if (block.type === 'button' || block.type === 'button2') {
    const style: React.CSSProperties = {
      display: 'block', fontSize: block.fontSize || 12, fontWeight: block.fontWeight || '500',
      color: block.color || '#FFF', background: block.backgroundColor || '#1A1A1A',
      border: block.border || 'none', borderRadius: block.borderRadius ?? 0,
      padding: `${block.paddingY ?? 12}px ${block.paddingX ?? 32}px`,
      letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
      textDecoration: 'none', width: block.fullWidth ? '100%' : 'auto',
      textAlign: 'center', boxSizing: 'border-box',
    }
    const align = block.textAlign === 'right' ? 'flex-end' : block.textAlign === 'left' ? 'flex-start' : 'center'
    return (
      <div style={{ display: 'flex', justifyContent: align, ...spacing }}>
        {block.href
          ? <a href={block.href} target={block.target || '_self'} style={style}>{block.text}</a>
          : <button type={asSubmit ? 'submit' : 'button'} style={style}>{block.text}</button>
        }
      </div>
    )
  }

  if (block.type === 'email_input' || block.type === 'name_input' || block.type === 'phone_input') {
    const fieldName = block.type === 'email_input' ? 'email' : block.type === 'name_input' ? 'name' : 'phone'
    return (
      <div style={spacing}>
        <input
          type={block.type === 'email_input' ? 'email' : block.type === 'phone_input' ? 'tel' : 'text'}
          placeholder={block.placeholder || ''}
          name={fieldName}
          onChange={e => onSubmit?.(fieldName, e.target.value)}
          style={{
            display: 'block', width: '100%', fontSize: block.fontSize || 14,
            color: block.color || '#1A1A1A', background: block.backgroundColor || '#FFF',
            border: block.border || '1px solid #E8E5E0', borderRadius: block.borderRadius ?? 0,
            padding: `${block.paddingY ?? 12}px ${block.paddingX ?? 16}px`,
            outline: 'none', textAlign: (block.textAlign as any) || 'right', boxSizing: 'border-box',
          }}
        />
      </div>
    )
  }

  // Text blocks
  const Tag = ({ h1: 'h2', h2: 'h3', paragraph: 'p', small_text: 'p' } as any)[block.type] || 'p'
  const isHeading = block.type === 'h1' || block.type === 'h2'
  return (
    <Tag style={{
      fontSize: block.fontSize || 16, fontWeight: block.fontWeight || '400',
      color: block.color || '#1A1A1A', textAlign: (block.textAlign as any) || 'center',
      fontFamily: isHeading ? "'Frank Ruhl Libre', Georgia, serif" : 'Inter, sans-serif',
      lineHeight: 1.35, ...spacing,
    }}>{block.text}</Tag>
  )
}

// ─── Popup shell ───────────────────────────────────────────────────────────────

function PopupShell({ popup, onClose }: { popup: PopupData; onClose: () => void }) {
  const s = popup.popup_settings
  const ov = popup.overlay_settings
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const hasFormBlock = popup.blocks.some(
    b => ['email_input', 'name_input', 'phone_input'].includes(b.type) && b.visible
  )

  function updateField(field: string, val: string) {
    setFormData(p => ({ ...p, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.email && hasFormBlock) return
    setSubmitting(true)
    try {
      await fetch('/api/popup-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popup_id: popup.id, page_url: window.location.href, ...formData }),
      })
    } catch {}
    setSubmitted(true)
    setSubmitting(false)
    if (s.redirectAfterSubmit) {
      setTimeout(() => { window.location.href = s.redirectAfterSubmit }, 1500)
    }
  }

  const layout = s.layout || 'center'
  const contentPad = isMobile ? (s.mobilePadding ?? 24) : (s.padding ?? 48)

  const successContent = (
    <div dir="rtl" style={{ padding: contentPad, textAlign: 'center', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 22, color: '#FFFFFF', fontFamily: "'Frank Ruhl Libre', Georgia, serif", fontWeight: 400 }}>
        {s.successMessage || 'תודה!'}
      </p>
    </div>
  )

  const blocksContent = submitted ? successContent : (
    <form onSubmit={hasFormBlock ? handleSubmit : undefined} dir="rtl">
      <div style={{ padding: contentPad }}>
        {popup.blocks.filter(b => b.visible).map(block => (
          <Block key={block.id} block={block} onSubmit={updateField} asSubmit={hasFormBlock} />
        ))}
      </div>
    </form>
  )

  const closeBtn = s.closeButton && (
    <button
      onClick={onClose}
      style={{
        position: 'absolute', top: 14, right: 14, zIndex: 10,
        background: 'none', border: 'none', cursor: 'pointer',
        color: s.closeButtonColor || '#FFF', lineHeight: 0, padding: 8,
        opacity: 0.85,
      }}
    >
      <X size={s.closeButtonSize || 20} />
    </button>
  )

  // ── Split layout ──────────────────────────────────────────────────────────
  if (s.splitLayout) {
    if (isMobile) {
      // Mobile: full-screen split — photo top 38%, scrollable dark content below
      return (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          onClick={ov.closeOnClick ? onClose : undefined}
        >
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              // respect iOS safe areas
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Photo section */}
            <div
              style={{
                flex: '0 0 38%',
                backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
                backgroundColor: s.backgroundColor || '#1A1A1A',
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              {/* X button over the photo */}
              {s.closeButton && (
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 20,
                    background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer',
                    color: '#FFF', lineHeight: 0, padding: 8, borderRadius: '50%',
                  }}
                >
                  <X size={18} />
                </button>
              )}
              {/* Gradient fade into dark panel */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
                background: `linear-gradient(to bottom, transparent, ${s.backgroundColor || '#1A1A1A'})`,
              }} />
            </div>

            {/* Dark content panel — scrollable */}
            <div style={{
              flex: 1, minHeight: 0,
              background: s.backgroundColor || '#1A1A1A',
              overflowY: 'auto', overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
            }}>
              {blocksContent}
            </div>
          </div>
        </div>
      )
    }

    // Desktop: side-by-side
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `rgba(${hexToRgb(ov.color)}, ${ov.opacity})`,
          backdropFilter: ov.blur ? 'blur(4px)' : undefined,
        }}
        onClick={ov.closeOnClick ? onClose : undefined}
      >
        <div
          style={{
            display: 'flex', maxWidth: 1100, width: '95vw', maxHeight: '85vh',
            borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {s.backgroundImage && (
            <div style={{ flex: 1, backgroundImage: `url(${s.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div style={{ width: 480, flexShrink: 0, background: s.backgroundColor || '#1A1A1A', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {closeBtn}
            {blocksContent}
          </div>
        </div>
      </div>
    )
  }

  // ── Standard layouts ───────────────────────────────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
    alignItems: layout === 'bottom-sheet' ? 'flex-end' : 'center',
    justifyContent: layout === 'side-left' ? 'flex-start' : layout === 'side-right' ? 'flex-end' : 'center',
    background: `rgba(${hexToRgb(ov.color)}, ${ov.opacity})`,
    backdropFilter: ov.blur ? 'blur(4px)' : undefined,
    padding: isMobile ? '12px' : '24px',
  }

  const popupStyle: React.CSSProperties = {
    position: 'relative',
    width: layout === 'fullscreen' ? '100%' : '100%',
    maxWidth: layout === 'fullscreen' ? undefined : (isMobile ? '100%' : `${s.width}px`),
    height: layout === 'fullscreen' ? '100%' : undefined,
    maxHeight: layout === 'fullscreen' ? '100%' : '88vh',
    overflowY: 'auto',
    background: s.backgroundColor,
    backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center',
    borderRadius: layout === 'bottom-sheet'
      ? `${s.borderRadius}px ${s.borderRadius}px 0 0`
      : layout === 'fullscreen' ? 0
      : isMobile ? 12 : (s.borderRadius ?? 0),
    boxShadow: s.boxShadow, border: s.border || undefined,
  }

  return (
    <div style={overlayStyle} onClick={ov.closeOnClick ? onClose : undefined}>
      <div style={popupStyle} onClick={e => e.stopPropagation()}>
        {s.closeButton && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 12,
              [s.closeButtonPosition === 'top-right' ? 'right' : 'left']: 12,
              zIndex: 10, background: 'none', border: 'none', cursor: 'pointer',
              color: s.closeButtonColor, opacity: 0.75, padding: 8, lineHeight: 0,
            }}
          >
            <X size={s.closeButtonSize || 20} />
          </button>
        )}
        {blocksContent}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt((hex || '#000000').slice(1, 3), 16) || 0
  const g = parseInt((hex || '#000000').slice(3, 5), 16) || 0
  const b = parseInt((hex || '#000000').slice(5, 7), 16) || 0
  return `${r},${g},${b}`
}

// ─── Main renderer ─────────────────────────────────────────────────────────────

function shouldShowForFrequency(popupId: string, frequency: string, days: number): boolean {
  if (frequency === 'always') return true
  const key = `popup_closed_${popupId}`
  const val = localStorage.getItem(key) || sessionStorage.getItem(key)
  if (!val) return true
  if (frequency === 'session') return false
  if (frequency === 'days') {
    const closedAt = parseInt(val)
    return Date.now() - closedAt > days * 24 * 60 * 60 * 1000
  }
  return true
}

function markClosed(popupId: string, frequency: string) {
  if (frequency === 'always') return
  const key = `popup_closed_${popupId}`
  if (frequency === 'session') sessionStorage.setItem(key, '1')
  else localStorage.setItem(key, Date.now().toString())
}

export default function PopupRenderer({ page = 'home' }: { page?: string }) {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from('popups')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (!rows?.length) return

      const isMobile = window.innerWidth < 640

      const candidate = rows.find(row => {
        const rules = row.display_rules || {}

        const devices = rules.devices || 'all'
        if (devices === 'mobile' && !isMobile) return false
        if (devices === 'desktop' && isMobile) return false

        if (rules.pageMode === 'include' && rules.pages?.length && !rules.pages.includes(page)) return false
        if (rules.pageMode === 'exclude' && rules.pages?.includes(page)) return false
        if (!rules.pageMode && row.pages?.length && !row.pages.includes('all') && !row.pages.includes(page)) return false

        const frequency = rules.frequency || 'session'
        const days = rules.frequencyDays || 7
        if (!shouldShowForFrequency(row.id, frequency, days)) return false

        return true
      })

      if (!candidate) return

      const rules = candidate.display_rules || {}
      const popupData: PopupData = {
        ...candidate,
        popup_settings: candidate.popup_settings || {
          ...DEFAULT_POPUP_SETTINGS,
          backgroundColor: candidate.bg_color || '#FFFFFF',
        },
        overlay_settings: candidate.overlay_settings || DEFAULT_OVERLAY,
        display_rules: rules,
        blocks: candidate.blocks?.length ? candidate.blocks : [
          ...(candidate.image ? [{ id: 'img', type: 'image' as const, visible: true, src: candidate.image, imageHeight: 192, objectFit: 'cover' as const, marginBottom: 0 }] : []),
          ...(candidate.title ? [{ id: 'h1', type: 'h1' as const, visible: true, text: candidate.title, fontSize: 28, color: candidate.text_color || '#1A1A1A', textAlign: 'center' as const, marginBottom: 12, marginTop: 0, fontWeight: '400' }] : []),
          ...(candidate.text ? [{ id: 'p', type: 'paragraph' as const, visible: true, text: candidate.text, fontSize: 14, color: candidate.text_color || '#6B6560', textAlign: 'center' as const, marginBottom: 16, marginTop: 0 }] : []),
          ...(candidate.button_text ? [{ id: 'btn', type: 'button' as const, visible: true, text: candidate.button_text, href: candidate.button_link || '', target: '_self' as const, fullWidth: true, fontSize: 12, color: '#FAFAF8', backgroundColor: candidate.text_color || '#1A1A1A', borderRadius: 0, paddingX: 32, paddingY: 14, marginBottom: 0, marginTop: 0 }] : []),
        ],
      }

      setPopup(popupData)

      const trigger = rules.trigger || candidate.trigger || 'immediate'
      const delay = (rules.triggerDelay ?? candidate.trigger_delay ?? 3) * 1000
      const scrollPct = rules.triggerScroll ?? 50

      if (trigger === 'immediate') {
        setVisible(true)
      } else if (trigger === 'delayed') {
        timerRef.current = setTimeout(() => setVisible(true), delay)
      } else if (trigger === 'exit') {
        const handler = (e: MouseEvent) => {
          if (e.clientY <= 0) { setVisible(true); document.removeEventListener('mouseleave', handler) }
        }
        document.addEventListener('mouseleave', handler)
        return () => document.removeEventListener('mouseleave', handler)
      } else if (trigger === 'scroll') {
        const handler = () => {
          const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          if (pct >= scrollPct) { setVisible(true); window.removeEventListener('scroll', handler) }
        }
        window.addEventListener('scroll', handler)
        return () => window.removeEventListener('scroll', handler)
      }
    }

    load()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [page])

  function handleClose() {
    if (!popup) return
    const rules = popup.display_rules || {}
    markClosed(popup.id!, rules.frequency || 'session')
    setVisible(false)
  }

  if (!popup || !visible) return null
  return <PopupShell popup={popup} onClose={handleClose} />
}
