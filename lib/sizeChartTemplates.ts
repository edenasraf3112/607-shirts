import type { SizeChartCell, SizeChartData } from '@/lib/supabase'

export const SIZE_CHART_CATEGORIES = [
  { value: 'shirts', label: 'חולצות' },
  { value: 'hoodies', label: "קפוצ'ונים" },
  { value: 'pants', label: 'מכנסיים' },
  { value: 'jackets', label: "ז'קטים" },
  { value: 'hats', label: 'כובעים' },
  { value: 'accessories', label: 'אקססוריז' },
  { value: 'other', label: 'אחר' },
]

function cell(value: string, tag?: 'h1' | 'h2' | 'h3'): SizeChartCell {
  return tag ? { value, style: { tag } } : { value }
}

function headerRow(values: string[]): SizeChartCell[] {
  return values.map(v => cell(v, 'h2'))
}

function dataRow(values: string[]): SizeChartCell[] {
  return [cell(values[0], 'h3'), ...values.slice(1).map(v => cell(v))]
}

function buildTable(headers: string[], rows: string[][]): SizeChartData {
  return { rows: [headerRow(headers), ...rows.map(dataRow)] }
}

export type SizeChartTemplateKey = 'blank' | 'shirts' | 'oversized_shirts' | 'hoodies' | 'pants'

export const SIZE_CHART_TEMPLATES: { key: SizeChartTemplateKey; label: string; category: string; build: () => SizeChartData }[] = [
  {
    key: 'blank',
    label: 'טבלה ריקה',
    category: 'other',
    build: () => ({ rows: [[cell('', 'h2'), cell('', 'h2')], [cell(''), cell('')]] }),
  },
  {
    key: 'shirts',
    label: 'טבלת חולצות',
    category: 'shirts',
    build: () => buildTable(
      ['מידה', 'רוחב חזה', 'אורך חולצה', 'רוחב כתפיים'],
      [
        ['S', '48 cm', '68 cm', '44 cm'],
        ['M', '50 cm', '70 cm', '46 cm'],
        ['L', '52 cm', '72 cm', '48 cm'],
        ['XL', '54 cm', '74 cm', '50 cm'],
      ]
    ),
  },
  {
    key: 'oversized_shirts',
    label: 'טבלת חולצות אוברסייז',
    category: 'shirts',
    build: () => buildTable(
      ['מידה', 'רוחב חזה', 'אורך חולצה', 'רוחב כתפיים', 'אורך שרוול'],
      [
        ['XS', '54 cm', '68 cm', '48 cm', '23 cm'],
        ['S', '56 cm', '70 cm', '50 cm', '24 cm'],
        ['M', '58 cm', '72 cm', '52 cm', '25 cm'],
        ['L', '60 cm', '74 cm', '54 cm', '26 cm'],
        ['XL', '62 cm', '76 cm', '56 cm', '27 cm'],
        ['XXL', '64 cm', '78 cm', '58 cm', '28 cm'],
      ]
    ),
  },
  {
    key: 'hoodies',
    label: "טבלת קפוצ'ונים",
    category: 'hoodies',
    build: () => buildTable(
      ['מידה', 'רוחב חזה', 'אורך קפוצ׳ון', 'רוחב כתפיים', 'אורך שרוול'],
      [
        ['S', '58 cm', '66 cm', '52 cm', '60 cm'],
        ['M', '61 cm', '68 cm', '54 cm', '61 cm'],
        ['L', '64 cm', '70 cm', '56 cm', '62 cm'],
        ['XL', '67 cm', '72 cm', '58 cm', '63 cm'],
      ]
    ),
  },
  {
    key: 'pants',
    label: 'טבלת מכנסיים',
    category: 'pants',
    build: () => buildTable(
      ['מידה', 'היקף מותן', 'היקף ירך', 'אורך מכנס'],
      [
        ['S', '76 cm', '98 cm', '100 cm'],
        ['M', '82 cm', '104 cm', '102 cm'],
        ['L', '88 cm', '110 cm', '104 cm'],
        ['XL', '94 cm', '116 cm', '106 cm'],
      ]
    ),
  },
]
