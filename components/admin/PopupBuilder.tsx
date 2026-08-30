'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronUp, ChevronDown, Trash2, Plus, Copy, Eye, EyeOff, Upload, Monitor, Smartphone, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PopupBlock, PopupData, PopupSettings, DisplayRules, OverlaySettings, BlockType, LayoutType } from '@/lib/popup-types'
import {
  DEFAULT_POPUP_SETTINGS, DEFAULT_DISPLAY_RULES, DEFAULT_OVERLAY,
  newBlock, BLOCK_LABELS, TEMPLATES, PAGE_OPTIONS,
} from '@/lib/popup-types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 border border-light-gray text-sm focus:outline-none focus:border-charcoal transition-colors bg-white'
const LABEL = 'block text-xs font-medium text-warm-gray uppercase tracking-wider mb-1'
const ROW = 'flex gap-2'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className={LABEL}>{label}</label>{children}</div>
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 cursor-pointer border border-light-gray rounded flex-shrink-0" />
      <input type="text" className={INPUT + ' flex-1'} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function NumInput({ value, onChange, min = 0, max = 9999, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input type="number" className={INPUT} value={value} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))} />
  )
}

// ─── Block Preview Renderer ───────────────────────────────────────────────────

function BlockPreview({ block, logoUrl }: { block: PopupBlock; logoUrl?: string }) {
  if (!block.visible) return null
  const mt = { marginTop: block.marginTop ?? 0 }
  const mb = { marginBottom: block.marginBottom ?? 0 }
  const spacing = { ...mt, ...mb }

  if (block.type === 'image') {
    if (!block.src) return (
      <div style={{ height: block.imageHeight || 200, background: '#E8E5E0', display: 'flex', alignItems: 'center', justifyContent: 'center', ...spacing }}>
        <span style={{ color: '#6B6560', fontSize: 12 }}>🖼 תמונה</span>
      </div>
    )
    return (
      <div style={{ position: 'relative', height: block.imageHeight || 200, overflow: 'hidden', ...spacing }}>
        <img src={block.src} alt={block.alt || ''} style={{ width: '100%', height: '100%', objectFit: block.objectFit || 'cover', objectPosition: block.objectPosition || 'center' }} />
        {block.overlayColor && <div style={{ position: 'absolute', inset: 0, background: block.overlayColor, opacity: block.overlayOpacity ?? 0.3 }} />}
      </div>
    )
  }

  if (block.type === 'logo') {
    const src = logoUrl || '/assets/branding/brand-logo.png'
    return (
      <div style={{ display: 'flex', justifyContent: 'center', ...spacing }}>
        <img src={src} alt="logo" style={{ height: block.imageHeight || 48, objectFit: 'contain' }} />
      </div>
    )
  }

  if (block.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: `1px solid ${block.color || '#E8E5E0'}`, ...spacing }} />
  }

  if (block.type === 'badge') {
    return (
      <div style={{ display: 'flex', justifyContent: block.textAlign === 'right' ? 'flex-end' : block.textAlign === 'left' ? 'flex-start' : 'center', ...spacing }}>
        <span style={{
          display: 'inline-block',
          fontSize: block.fontSize || 10,
          fontWeight: block.fontWeight || '600',
          color: block.color || '#FFF',
          background: block.backgroundColor || '#1A1A1A',
          borderRadius: block.borderRadius ?? 999,
          padding: `${block.paddingY ?? 4}px ${block.paddingX ?? 12}px`,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>{block.text || 'תגית'}</span>
      </div>
    )
  }

  if (block.type === 'button' || block.type === 'button2') {
    const btn = (
      <span style={{
        display: 'inline-block',
        fontSize: block.fontSize || 12,
        fontWeight: block.fontWeight || '500',
        color: block.color || '#FFF',
        background: block.backgroundColor || '#1A1A1A',
        border: block.border || 'none',
        borderRadius: block.borderRadius ?? 0,
        padding: `${block.paddingY ?? 12}px ${block.paddingX ?? 32}px`,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        width: block.fullWidth ? '100%' : undefined,
        textAlign: 'center',
      }}>{block.text || 'כפתור'}</span>
    )
    return (
      <div style={{ display: 'flex', justifyContent: block.textAlign === 'right' ? 'flex-end' : block.textAlign === 'left' ? 'flex-start' : 'center', ...spacing }}>
        {block.fullWidth ? <div style={{ width: '100%' }}>{btn}</div> : btn}
      </div>
    )
  }

  if (block.type === 'email_input' || block.type === 'name_input' || block.type === 'phone_input') {
    return (
      <div style={{ ...spacing }}>
        <input readOnly placeholder={block.placeholder || ''} style={{
          display: 'block',
          width: '100%',
          fontSize: block.fontSize || 14,
          color: block.color || '#1A1A1A',
          background: block.backgroundColor || '#FFF',
          border: block.border || '1px solid #E8E5E0',
          borderRadius: block.borderRadius ?? 0,
          padding: `${block.paddingY ?? 12}px ${block.paddingX ?? 16}px`,
          outline: 'none',
          textAlign: block.textAlign || 'right',
        }} />
      </div>
    )
  }

  // Text blocks
  const tagMap: Record<string, string> = { h1: 'h2', h2: 'h3', paragraph: 'p', small_text: 'p' }
  const Tag = (tagMap[block.type] || 'p') as any
  const fontFamilies: Record<string, string> = {
    h1: "'Frank Ruhl Libre', Georgia, serif",
    h2: "'Frank Ruhl Libre', Georgia, serif",
    paragraph: 'Inter, sans-serif',
    small_text: 'Inter, sans-serif',
  }
  return (
    <Tag style={{
      fontSize: block.fontSize || 16,
      fontWeight: block.fontWeight || '400',
      color: block.color || '#1A1A1A',
      textAlign: block.textAlign || 'center',
      fontFamily: fontFamilies[block.type] || 'inherit',
      lineHeight: 1.4,
      ...spacing,
    }}>{block.text || ''}</Tag>
  )
}

// ─── Popup Preview ─────────────────────────────────────────────────────────────

function PopupPreview({ data, logoUrl, device }: { data: PopupData; logoUrl?: string; device: 'desktop' | 'mobile' }) {
  const s = data.popup_settings
  const ov = data.overlay_settings
  const isMobile = device === 'mobile'
  const width = isMobile ? Math.min(s.width, 360) : s.width
  const padding = isMobile ? s.mobilePadding : s.padding

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: s.layout === 'bottom-sheet' ? 'flex-end' : 'center',
    justifyContent: s.layout === 'side-left' ? 'flex-start' : s.layout === 'side-right' ? 'flex-end' : 'center',
    background: `rgba(${hexToRgb(ov.color)}, ${ov.opacity})`,
    backdropFilter: ov.blur ? 'blur(4px)' : undefined,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  }

  const popupStyle: React.CSSProperties = {
    width: s.layout === 'fullscreen' ? '100%' : width,
    maxWidth: '100%',
    background: s.backgroundColor,
    backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: s.layout === 'bottom-sheet' ? `${s.borderRadius}px ${s.borderRadius}px 0 0` : s.borderRadius,
    boxShadow: s.boxShadow,
    border: s.border || undefined,
    overflow: 'hidden',
    position: 'relative',
    maxHeight: s.layout === 'fullscreen' ? '100%' : undefined,
    height: s.layout === 'fullscreen' ? '100%' : undefined,
  }

  const innerStyle: React.CSSProperties = {
    padding: s.backgroundImage ? 0 : (s.layout === 'bottom-sheet' || s.layout === 'fullscreen') && !s.backgroundImage ? padding : undefined,
  }

  return (
    <div style={containerStyle}>
      <div style={popupStyle}>
        {s.closeButton && (
          <div style={{
            position: 'absolute',
            top: 12,
            [s.closeButtonPosition === 'top-right' ? 'right' : 'left']: 12,
            zIndex: 10,
            cursor: 'pointer',
            color: s.closeButtonColor,
          }}>
            <X size={s.closeButtonSize || 20} />
          </div>
        )}
        <div dir="rtl" style={innerStyle}>
          {data.blocks
            .filter(b => b.visible)
            .map((block, i) => {
              const needsInnerPad = block.type !== 'image' && s.backgroundImage === '' && s.layout !== 'bottom-sheet' && s.layout !== 'fullscreen'
              const padStyle = i === 0 && !needsInnerPad ? {} : {}
              return (
                <div key={block.id} style={{
                  paddingLeft: needsInnerPad ? 0 : 0,
                  paddingRight: needsInnerPad ? 0 : 0,
                }}>
                  <BlockPreview block={block} logoUrl={logoUrl} />
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return `${r},${g},${b}`
}

// ─── Block Editor ──────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange, onUpload }: {
  block: PopupBlock
  onChange: (b: PopupBlock) => void
  onUpload: (file: File) => Promise<string>
}) {
  const set = (key: keyof PopupBlock, val: any) => onChange({ ...block, [key]: val })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const url = await onUpload(file)
    if (url) set('src', url)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const isText = ['h1', 'h2', 'paragraph', 'small_text', 'badge'].includes(block.type)
  const isBtn = ['button', 'button2'].includes(block.type)
  const isInput = ['email_input', 'name_input', 'phone_input'].includes(block.type)
  const isImg = block.type === 'image' || block.type === 'logo'

  return (
    <div className="space-y-1">
      {/* Content */}
      {(isText || isBtn) && (
        <Field label="טקסט">
          <input className={INPUT} value={block.text || ''} onChange={e => set('text', e.target.value)} />
        </Field>
      )}
      {isInput && (
        <Field label="placeholder">
          <input className={INPUT} value={block.placeholder || ''} onChange={e => set('placeholder', e.target.value)} />
        </Field>
      )}
      {isBtn && (
        <>
          <Field label="קישור">
            <input className={INPUT} value={block.href || ''} onChange={e => set('href', e.target.value)} placeholder="https://" />
          </Field>
          <Field label="פתח ב">
            <select className={INPUT} value={block.target || '_self'} onChange={e => set('target', e.target.value)}>
              <option value="_self">אותו חלון</option>
              <option value="_blank">חלון חדש</option>
            </select>
          </Field>
        </>
      )}
      {isImg && (
        <>
          {block.type === 'image' && (
            <Field label="תמונה">
              <div className="flex gap-2 mb-2">
                <input className={INPUT + ' flex-1 text-xs'} value={block.src || ''} onChange={e => set('src', e.target.value)} placeholder="URL תמונה" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="px-3 py-2 border border-light-gray text-xs hover:border-charcoal transition-colors disabled:opacity-50 flex items-center gap-1">
                  <Upload size={12} />{uploading ? '...' : 'העלה'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>
              {block.src && <img src={block.src} className="w-full h-16 object-cover rounded border border-light-gray" />}
            </Field>
          )}
          <Field label="גובה (px)"><NumInput value={block.imageHeight || 200} onChange={v => set('imageHeight', v)} min={40} max={600} /></Field>
          <Field label="מילוי תמונה">
            <select className={INPUT} value={block.objectFit || 'cover'} onChange={e => set('objectFit', e.target.value as any)}>
              <option value="cover">cover (מלא)</option>
              <option value="contain">contain (כולה)</option>
            </select>
          </Field>
          {block.type === 'image' && (
            <>
              <Field label="צבע שכבה">
                <ColorInput value={block.overlayColor || ''} onChange={v => set('overlayColor', v)} />
              </Field>
              <Field label="אטימות שכבה"><NumInput value={block.overlayOpacity ?? 0} onChange={v => set('overlayOpacity', v)} min={0} max={1} step={0.05} /></Field>
            </>
          )}
        </>
      )}

      {/* Typography */}
      {(isText || isBtn || isInput) && (
        <>
          <div className={ROW}>
            <div className="flex-1"><Field label="גודל פונט"><NumInput value={block.fontSize || 14} onChange={v => set('fontSize', v)} min={8} max={96} /></Field></div>
            <div className="flex-1"><Field label="עובי">
              <select className={INPUT} value={block.fontWeight || '400'} onChange={e => set('fontWeight', e.target.value)}>
                <option value="300">דק</option>
                <option value="400">רגיל</option>
                <option value="500">בינוני</option>
                <option value="600">עבה</option>
                <option value="700">מאוד עבה</option>
              </select>
            </Field></div>
          </div>
          <Field label="צבע טקסט"><ColorInput value={block.color || '#1A1A1A'} onChange={v => set('color', v)} /></Field>
          {!isInput && (
            <Field label="יישור">
              <div className="flex gap-1">
                {(['right', 'center', 'left'] as const).map(a => (
                  <button key={a} type="button" onClick={() => set('textAlign', a)}
                    className={`flex-1 py-1.5 text-xs border transition-colors ${block.textAlign === a ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                    {a === 'right' ? '←' : a === 'center' ? '↔' : '→'}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </>
      )}

      {/* Button / Input appearance */}
      {(isBtn || isInput) && (
        <>
          <Field label="צבע רקע"><ColorInput value={block.backgroundColor || '#1A1A1A'} onChange={v => set('backgroundColor', v)} /></Field>
          <div className={ROW}>
            <div className="flex-1"><Field label="padding X"><NumInput value={block.paddingX ?? 16} onChange={v => set('paddingX', v)} /></Field></div>
            <div className="flex-1"><Field label="padding Y"><NumInput value={block.paddingY ?? 12} onChange={v => set('paddingY', v)} /></Field></div>
          </div>
          <Field label="עיגול פינות"><NumInput value={block.borderRadius ?? 0} onChange={v => set('borderRadius', v)} /></Field>
          <Field label="border"><input className={INPUT} value={block.border || ''} onChange={e => set('border', e.target.value)} placeholder="1px solid #ccc" /></Field>
          {isBtn && (
            <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer mb-3">
              <input type="checkbox" checked={!!block.fullWidth} onChange={e => set('fullWidth', e.target.checked)} className="w-4 h-4 accent-charcoal" />
              רוחב מלא
            </label>
          )}
        </>
      )}

      {/* Spacing */}
      <div className={ROW}>
        <div className="flex-1"><Field label="margin למעלה"><NumInput value={block.marginTop ?? 0} onChange={v => set('marginTop', v)} /></Field></div>
        <div className="flex-1"><Field label="margin למטה"><NumInput value={block.marginBottom ?? 0} onChange={v => set('marginBottom', v)} /></Field></div>
      </div>
    </div>
  )
}

// ─── Settings Panels ───────────────────────────────────────────────────────────

function PopupSettingsPanel({ s, onChange }: { s: PopupSettings; onChange: (s: PopupSettings) => void }) {
  const set = (k: keyof PopupSettings, v: any) => onChange({ ...s, [k]: v })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('bucket', 'branding')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) set('backgroundImage', data.url)
    else toast.error('שגיאה בהעלאה')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-1">
      <Field label="סוג תצוגה">
        <select className={INPUT} value={s.layout} onChange={e => set('layout', e.target.value as LayoutType)}>
          <option value="center">מרכז (מודאל)</option>
          <option value="fullscreen">מסך מלא</option>
          <option value="bottom-sheet">Bottom sheet (מובייל)</option>
          <option value="side-left">צד שמאל</option>
          <option value="side-right">צד ימין</option>
        </select>
      </Field>
      <div className={ROW}>
        <div className="flex-1"><Field label="רוחב (px)"><NumInput value={s.width} onChange={v => set('width', v)} min={200} max={1200} /></Field></div>
        <div className="flex-1"><Field label="padding"><NumInput value={s.padding} onChange={v => set('padding', v)} min={0} max={120} /></Field></div>
      </div>
      <div className={ROW}>
        <div className="flex-1"><Field label="padding מובייל"><NumInput value={s.mobilePadding} onChange={v => set('mobilePadding', v)} min={0} /></Field></div>
        <div className="flex-1"><Field label="עיגול פינות"><NumInput value={s.borderRadius} onChange={v => set('borderRadius', v)} min={0} /></Field></div>
      </div>
      <Field label="צבע רקע פופאפ"><ColorInput value={s.backgroundColor} onChange={v => set('backgroundColor', v)} /></Field>
      <Field label="תמונת רקע">
        <div className="flex gap-2 mb-2">
          <input className={INPUT + ' flex-1 text-xs'} value={s.backgroundImage} onChange={e => set('backgroundImage', e.target.value)} placeholder="URL" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-3 py-2 border border-light-gray text-xs hover:border-charcoal transition-colors disabled:opacity-50 flex items-center gap-1">
            <Upload size={12} />{uploading ? '...' : 'העלה'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        </div>
        {s.backgroundImage && (
          <div className="relative">
            <img src={s.backgroundImage} className="w-full h-16 object-cover rounded border border-light-gray" />
            <button type="button" onClick={() => set('backgroundImage', '')} className="absolute top-1 right-1 p-0.5 bg-white rounded-full border border-light-gray text-warm-gray hover:text-red-500">
              <X size={10} />
            </button>
          </div>
        )}
      </Field>
      <Field label="border"><input className={INPUT} value={s.border} onChange={e => set('border', e.target.value)} placeholder="1px solid #E8E5E0" /></Field>
      <Field label="box-shadow"><input className={INPUT} value={s.boxShadow} onChange={e => set('boxShadow', e.target.value)} /></Field>
      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>כפתור סגירה</p>
        <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer mb-3">
          <input type="checkbox" checked={s.closeButton} onChange={e => set('closeButton', e.target.checked)} className="w-4 h-4 accent-charcoal" />
          הצג כפתור סגירה
        </label>
        {s.closeButton && (
          <>
            <Field label="מיקום">
              <select className={INPUT} value={s.closeButtonPosition} onChange={e => set('closeButtonPosition', e.target.value as any)}>
                <option value="top-right">ימין למעלה</option>
                <option value="top-left">שמאל למעלה</option>
              </select>
            </Field>
            <div className={ROW}>
              <div className="flex-1"><Field label="צבע"><ColorInput value={s.closeButtonColor} onChange={v => set('closeButtonColor', v)} /></Field></div>
              <div className="flex-1"><Field label="גודל"><NumInput value={s.closeButtonSize} onChange={v => set('closeButtonSize', v)} min={12} max={40} /></Field></div>
            </div>
          </>
        )}
      </div>
      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>אחרי שליחת טופס</p>
        <Field label="הודעת הצלחה"><input className={INPUT} value={s.successMessage} onChange={e => set('successMessage', e.target.value)} /></Field>
        <Field label="הפנייה לאחר שליחה"><input className={INPUT} value={s.redirectAfterSubmit} onChange={e => set('redirectAfterSubmit', e.target.value)} placeholder="https://..." /></Field>
      </div>
    </div>
  )
}

function DisplayRulesPanel({ rules, overlay, onRules, onOverlay }: {
  rules: DisplayRules; overlay: OverlaySettings
  onRules: (r: DisplayRules) => void; onOverlay: (o: OverlaySettings) => void
}) {
  const setR = (k: keyof DisplayRules, v: any) => onRules({ ...rules, [k]: v })
  const setO = (k: keyof OverlaySettings, v: any) => onOverlay({ ...overlay, [k]: v })

  return (
    <div className="space-y-1">
      <p className={LABEL + ' mb-2'}>עמודים להצגה</p>
      <Field label="מצב">
        <select className={INPUT} value={rules.pageMode} onChange={e => setR('pageMode', e.target.value as any)}>
          <option value="all">כל העמודים</option>
          <option value="include">רק בעמודים שנבחרו</option>
          <option value="exclude">בכל עמוד חוץ מ...</option>
        </select>
      </Field>
      {rules.pageMode !== 'all' && (
        <Field label="עמודים">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {PAGE_OPTIONS.map(p => (
              <button key={p.value} type="button"
                onClick={() => setR('pages', rules.pages.includes(p.value) ? rules.pages.filter(x => x !== p.value) : [...rules.pages, p.value])}
                className={`px-2.5 py-1 text-xs border rounded transition-colors ${rules.pages.includes(p.value) ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>טריגר הצגה</p>
        <Field label="הפעלה">
          <select className={INPUT} value={rules.trigger} onChange={e => setR('trigger', e.target.value as any)}>
            <option value="immediate">מיד</option>
            <option value="delayed">אחרי X שניות</option>
            <option value="scroll">אחרי גלילה X%</option>
            <option value="exit">ביציאה מהאתר</option>
          </select>
        </Field>
        {rules.trigger === 'delayed' && (
          <Field label="שניות המתנה"><NumInput value={rules.triggerDelay} onChange={v => setR('triggerDelay', v)} min={0} max={60} /></Field>
        )}
        {rules.trigger === 'scroll' && (
          <Field label="אחוז גלילה"><NumInput value={rules.triggerScroll} onChange={v => setR('triggerScroll', v)} min={0} max={100} /></Field>
        )}
      </div>

      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>תדירות</p>
        <Field label="הצגה">
          <select className={INPUT} value={rules.frequency} onChange={e => setR('frequency', e.target.value as any)}>
            <option value="always">כל פעם</option>
            <option value="session">פעם אחת לסשן</option>
            <option value="days">פעם כל X ימים</option>
          </select>
        </Field>
        {rules.frequency === 'days' && (
          <Field label="כל כמה ימים"><NumInput value={rules.frequencyDays} onChange={v => setR('frequencyDays', v)} min={1} max={365} /></Field>
        )}
      </div>

      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>מכשירים</p>
        <Field label="הצג על">
          <select className={INPUT} value={rules.devices} onChange={e => setR('devices', e.target.value as any)}>
            <option value="all">הכל</option>
            <option value="desktop">דסקטופ בלבד</option>
            <option value="mobile">מובייל בלבד</option>
          </select>
        </Field>
      </div>

      <div className="pt-2 border-t border-light-gray mt-3">
        <p className={LABEL + ' mb-2'}>שכבת רקע (overlay)</p>
        <Field label="צבע"><ColorInput value={overlay.color} onChange={v => setO('color', v)} /></Field>
        <Field label="אטימות"><NumInput value={overlay.opacity} onChange={v => setO('opacity', v)} min={0} max={1} step={0.05} /></Field>
        <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer mb-3">
          <input type="checkbox" checked={overlay.blur} onChange={e => setO('blur', e.target.checked)} className="w-4 h-4 accent-charcoal" />
          טשטוש רקע
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer mb-3">
          <input type="checkbox" checked={overlay.closeOnClick} onChange={e => setO('closeOnClick', e.target.checked)} className="w-4 h-4 accent-charcoal" />
          סגור בלחיצה מחוץ לפופאפ
        </label>
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

const ADDABLE_BLOCKS: BlockType[] = [
  'image', 'logo', 'h1', 'h2', 'paragraph', 'small_text',
  'button', 'button2', 'email_input', 'name_input', 'phone_input', 'divider', 'badge',
]

type Tab = 'blocks' | 'popup' | 'display'

export default function PopupBuilder({ initialData, logoUrl }: { initialData?: Partial<PopupData>; logoUrl?: string }) {
  const router = useRouter()
  const isNew = !initialData?.id

  const [popup, setPopup] = useState<PopupData>({
    title: '',
    is_active: false,
    priority: 0,
    blocks: [],
    popup_settings: DEFAULT_POPUP_SETTINGS,
    display_rules: DEFAULT_DISPLAY_RULES,
    overlay_settings: DEFAULT_OVERLAY,
    ...initialData,
  })

  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('blocks')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showTemplates, setShowTemplates] = useState(isNew)

  const selectedBlock = popup.blocks.find(b => b.id === selectedBlockId) || null

  function updateBlock(updated: PopupBlock) {
    setPopup(p => ({ ...p, blocks: p.blocks.map(b => b.id === updated.id ? updated : b) }))
  }

  function addBlock(type: BlockType) {
    const b = newBlock(type)
    setPopup(p => ({ ...p, blocks: [...p.blocks, b] }))
    setSelectedBlockId(b.id)
  }

  function removeBlock(id: string) {
    setPopup(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setPopup(p => {
      const arr = [...p.blocks]
      const idx = arr.findIndex(b => b.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= arr.length) return p
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return { ...p, blocks: arr }
    })
  }

  function toggleBlockVisible(id: string) {
    setPopup(p => ({ ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b) }))
  }

  async function uploadBlockImage(file: File): Promise<string> {
    const fd = new FormData(); fd.append('file', file); fd.append('bucket', 'branding')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!data.url) { toast.error('שגיאה בהעלאה'); return '' }
    return data.url
  }

  async function handleSave() {
    if (!popup.title.trim()) { toast.error('יש להזין כותרת'); return }
    setSaving(true)
    try {
      const payload = {
        title: popup.title,
        is_active: popup.is_active,
        priority: popup.priority,
        blocks: popup.blocks,
        popup_settings: popup.popup_settings,
        display_rules: popup.display_rules,
        overlay_settings: popup.overlay_settings,
        template_name: popup.template_name,
        // Legacy fields for backwards compat
        bg_color: popup.popup_settings.backgroundColor,
        text_color: '#1A1A1A',
        pages: popup.display_rules.pageMode === 'all' ? ['all'] : popup.display_rules.pages,
        trigger: popup.display_rules.trigger,
        trigger_delay: popup.display_rules.triggerDelay,
      }
      if (isNew) {
        const res = await fetch('/api/admin/popups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error)
        toast.success('פופאפ נוצר!')
        router.push('/admin/popups')
      } else {
        const res = await fetch('/api/admin/popups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: popup.id, ...payload }) })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error)
        toast.success('נשמר!')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err?.message || 'שגיאה בשמירה')
    }
    setSaving(false)
  }

  async function handleDuplicate() {
    if (!popup.id) return
    const res = await fetch(`/api/admin/popups/${popup.id}/duplicate`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) { toast.success('שוכפל!'); router.push('/admin/popups') }
    else toast.error('שגיאה')
  }

  async function handleDelete() {
    if (!popup.id || !confirm('למחוק את הפופאפ?')) return
    const res = await fetch(`/api/admin/popups/${popup.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('נמחק'); router.push('/admin/popups') }
    else toast.error('שגיאה')
  }

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setPopup(p => ({
      ...p,
      blocks: tpl.data.blocks || [],
      popup_settings: tpl.data.popup_settings || DEFAULT_POPUP_SETTINGS,
      template_name: tpl.name,
    }))
    setShowTemplates(false)
    setSelectedBlockId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-cream-dark overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-white border-b border-light-gray flex-shrink-0" dir="rtl">
        <button onClick={() => router.push('/admin/popups')} className="p-1.5 text-warm-gray hover:text-charcoal transition-colors">
          <ChevronRight size={18} />
        </button>
        <input
          className="flex-1 text-sm font-medium text-charcoal bg-transparent border-none outline-none placeholder-warm-gray"
          value={popup.title}
          onChange={e => setPopup(p => ({ ...p, title: e.target.value }))}
          placeholder="שם הפופאפ..."
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${popup.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setPopup(p => ({ ...p, is_active: !p.is_active }))}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${popup.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ top: 3, transform: `translateX(${popup.is_active ? 18 : 2}px)` }} />
            </div>
            <span className="text-xs text-warm-gray">{popup.is_active ? 'פעיל' : 'כבוי'}</span>
          </label>
          {!isNew && (
            <>
              <button onClick={handleDuplicate} className="p-1.5 text-warm-gray hover:text-charcoal transition-colors" title="שכפל">
                <Copy size={16} />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-warm-gray hover:text-red-500 transition-colors" title="מחק">
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמירה'}
          </button>
        </div>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-charcoal">בחר תבנית</h2>
              <button onClick={() => setShowTemplates(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => setShowTemplates(false)}
                className="border border-dashed border-light-gray rounded-lg p-4 text-center text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
              >
                <div className="text-2xl mb-2">✨</div>
                <div className="text-sm">התחל מאפס</div>
              </button>
              {TEMPLATES.map(tpl => (
                <button key={tpl.name} onClick={() => applyTemplate(tpl)}
                  className="border border-light-gray rounded-lg p-4 text-center hover:border-charcoal hover:bg-cream-dark transition-colors">
                  <div className="text-2xl mb-2">{tpl.emoji}</div>
                  <div className="text-sm text-charcoal font-medium">{tpl.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 bg-white border-l border-light-gray flex flex-col flex-shrink-0 overflow-hidden" dir="rtl">
          {/* Tabs */}
          <div className="flex border-b border-light-gray flex-shrink-0">
            {([['blocks', 'בלוקים'], ['popup', 'עיצוב'], ['display', 'תצוגה']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setSelectedBlockId(null) }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'text-charcoal border-b-2 border-charcoal' : 'text-warm-gray hover:text-charcoal'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'blocks' && !selectedBlock && (
              <div>
                {/* Add blocks */}
                <p className={LABEL + ' mb-2'}>הוסף בלוק</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {ADDABLE_BLOCKS.map(type => (
                    <button key={type} onClick={() => addBlock(type)}
                      className="flex items-center gap-1.5 px-2 py-1.5 border border-light-gray text-xs text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded text-right">
                      <Plus size={11} className="flex-shrink-0" />
                      {BLOCK_LABELS[type]}
                    </button>
                  ))}
                </div>

                {/* Block list */}
                {popup.blocks.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className={LABEL}>בלוקים ({popup.blocks.length})</p>
                      <button onClick={() => setShowTemplates(true)} className="text-xs text-warm-gray hover:text-charcoal underline">תבניות</button>
                    </div>
                    <div className="space-y-1.5">
                      {popup.blocks.map((block, idx) => (
                        <div key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-colors ${selectedBlockId === block.id ? 'border-charcoal bg-cream-dark' : 'border-light-gray hover:border-charcoal/40'} ${!block.visible ? 'opacity-40' : ''}`}
                        >
                          <span className="text-xs text-warm-gray flex-1 truncate">{BLOCK_LABELS[block.type]}</span>
                          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleBlockVisible(block.id)} className="p-0.5 text-warm-gray hover:text-charcoal">
                              {block.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                            </button>
                            <button onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} className="p-0.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                              <ChevronUp size={11} />
                            </button>
                            <button onClick={() => moveBlock(block.id, 1)} disabled={idx === popup.blocks.length - 1} className="p-0.5 text-warm-gray hover:text-charcoal disabled:opacity-30">
                              <ChevronDown size={11} />
                            </button>
                            <button onClick={() => removeBlock(block.id)} className="p-0.5 text-warm-gray hover:text-red-500">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'blocks' && selectedBlock && (
              <div>
                <button onClick={() => setSelectedBlockId(null)} className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal mb-3 transition-colors">
                  <ChevronRight size={14} />
                  חזרה לבלוקים
                </button>
                <p className="text-sm font-medium text-charcoal mb-3">{BLOCK_LABELS[selectedBlock.type]}</p>
                <BlockEditor block={selectedBlock} onChange={updateBlock} onUpload={uploadBlockImage} />
              </div>
            )}

            {tab === 'popup' && (
              <PopupSettingsPanel s={popup.popup_settings} onChange={s => setPopup(p => ({ ...p, popup_settings: s }))} />
            )}

            {tab === 'display' && (
              <DisplayRulesPanel
                rules={popup.display_rules}
                overlay={popup.overlay_settings}
                onRules={r => setPopup(p => ({ ...p, display_rules: r }))}
                onOverlay={o => setPopup(p => ({ ...p, overlay_settings: o }))}
              />
            )}
          </div>

          {/* Priority (bottom of panel) */}
          <div className="border-t border-light-gray p-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-warm-gray whitespace-nowrap">עדיפות:</label>
              <NumInput value={popup.priority} onChange={v => setPopup(p => ({ ...p, priority: v }))} min={0} max={100} />
            </div>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-light-gray flex-shrink-0">
            <div className="flex items-center gap-1 bg-cream-dark rounded-lg p-0.5">
              <button onClick={() => setDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${device === 'desktop' ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                <Monitor size={14} />דסקטופ
              </button>
              <button onClick={() => setDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${device === 'mobile' ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}>
                <Smartphone size={14} />מובייל
              </button>
            </div>
            <button onClick={() => setShowTemplates(true)} className="text-xs text-warm-gray hover:text-charcoal transition-colors flex items-center gap-1">
              <Copy size={13} />בחר תבנית
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
            <div
              style={{
                width: device === 'mobile' ? 375 : '100%',
                maxWidth: device === 'mobile' ? 375 : 900,
                height: device === 'mobile' ? 667 : '100%',
                maxHeight: 700,
              }}
              className="border border-light-gray rounded-xl overflow-hidden bg-cream-dark shadow-inner"
            >
              <PopupPreview data={popup} logoUrl={logoUrl} device={device} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
