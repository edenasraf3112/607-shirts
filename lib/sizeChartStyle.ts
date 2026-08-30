import type { SizeChartCellStyle, SizeChartCellTag } from '@/lib/supabase'
import type { CSSProperties } from 'react'

// Visual/typographic presets for heading tags — purely presentational, never
// mapped 1:1 to real <h1>/<h2>/<h3> elements (table structure is derived from
// row/column position instead, see SizeChartDisplay).
const TAG_PRESETS: Record<SizeChartCellTag, { fontSize: number; fontWeight: 400 | 500 | 700; fontFamily: 'serif' | 'sans' }> = {
  normal: { fontSize: 13, fontWeight: 400, fontFamily: 'sans' },
  h3: { fontSize: 13, fontWeight: 700, fontFamily: 'sans' },
  h2: { fontSize: 14, fontWeight: 700, fontFamily: 'serif' },
  h1: { fontSize: 16, fontWeight: 700, fontFamily: 'serif' },
}

const PADDING_PX: Record<'sm' | 'md' | 'lg', string> = {
  sm: '6px 8px',
  md: '10px 14px',
  lg: '14px 18px',
}

export function resolveCellStyle(style?: SizeChartCellStyle) {
  const tag = style?.tag || 'normal'
  const preset = TAG_PRESETS[tag]
  const fontFamily = style?.fontFamily ?? preset.fontFamily
  const fontSize = style?.fontSize ?? preset.fontSize
  const fontWeight = style?.bold ? 700 : (style?.fontWeight ?? preset.fontWeight)
  return {
    tag,
    fontFamily,
    fontSize,
    fontWeight,
    underline: !!style?.underline,
    align: style?.align ?? 'center' as const,
    color: style?.color || undefined,
    bg: style?.bg || undefined,
    border: style?.border !== false,
    padding: style?.padding || 'md' as const,
  }
}

export function cellStyleToCss(style?: SizeChartCellStyle): CSSProperties {
  const r = resolveCellStyle(style)
  return {
    fontFamily: r.fontFamily === 'serif' ? "'Cormorant Garamond', Georgia, serif" : 'Inter, system-ui, sans-serif',
    fontSize: r.fontSize,
    fontWeight: r.fontWeight,
    textDecoration: r.underline ? 'underline' : undefined,
    textAlign: r.align,
    color: r.color,
    backgroundColor: r.bg,
    padding: PADDING_PX[r.padding],
    whiteSpace: 'pre-wrap',
    verticalAlign: 'middle',
  }
}
