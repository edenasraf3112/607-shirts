import type { SizeChartData } from '@/lib/supabase'

export const MAX_ROWS = 40
export const MAX_COLS = 20

const CONTROL_CHARS_PATTERN = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g')

// Strips tags/control characters - cells store plain text only, never raw HTML.
export function sanitizeCellValue(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS_PATTERN, '')
    .slice(0, 200)
}

export function isEmptyChartData(data: SizeChartData): boolean {
  return !data?.rows?.some(row => row.some(c => c.value?.trim()))
}

export function validateGridShape(data: SizeChartData): string | null {
  if (!data?.rows || data.rows.length === 0) return 'הטבלה חייבת להכיל לפחות שורה אחת'
  if (data.rows.some(r => r.length === 0)) return 'הטבלה חייבת להכיל לפחות עמודה אחת'
  if (data.rows.length > MAX_ROWS) return `מספר השורות חורג מהמותר (עד ${MAX_ROWS})`
  if (data.rows[0].length > MAX_COLS) return `מספר העמודות חורג מהמותר (עד ${MAX_COLS})`
  return null
}

export function validateForSave(fields: { internal_name: string; title: string }, data: SizeChartData): string | null {
  if (!fields.internal_name.trim()) return 'יש להזין שם פנימי לטבלה'
  if (!fields.title.trim()) return 'יש להזין כותרת שתוצג ללקוח'
  return validateGridShape(data)
}

export function validateForPublish(fields: { internal_name: string; title: string }, data: SizeChartData): string | null {
  const base = validateForSave(fields, data)
  if (base) return base
  if (isEmptyChartData(data)) return 'לא ניתן לפרסם טבלה ריקה - יש למלא לפחות תא אחד'
  return null
}
