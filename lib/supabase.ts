import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type FAQItem = {
  id: string
  question: string
  answer: string
  is_active?: boolean
}

export type Product = {
  id: string
  name: string
  price: number
  sale_price?: number
  short_description: string
  full_description: string
  images: string[]
  sizes: string[]
  colors: string[]
  out_of_stock_sizes?: string[]
  out_of_stock_colors?: string[]
  tags: string[]
  collection_id?: string
  display_order: number
  in_stock: boolean
  available_from?: string | null
  available_until?: string | null
  clothing_category?: string | null
  faqs?: FAQItem[]
  size_chart_id?: string | null
  created_at: string
}

// ---- Size charts ----

export type SizeChartUnit = 'cm' | 'in'
export type SizeChartStatus = 'draft' | 'published'
export type SizeChartCellTag = 'normal' | 'h1' | 'h2' | 'h3'
export type SizeChartAlign = 'right' | 'center' | 'left'
export type SizeChartPadding = 'sm' | 'md' | 'lg'
export type SizeChartFontFamily = 'serif' | 'sans'

export type SizeChartCellStyle = {
  tag?: SizeChartCellTag
  bold?: boolean
  underline?: boolean
  align?: SizeChartAlign
  fontFamily?: SizeChartFontFamily
  fontSize?: number
  fontWeight?: 400 | 500 | 700
  color?: string
  bg?: string
  border?: boolean
  padding?: SizeChartPadding
}

export type SizeChartCell = {
  value: string
  style?: SizeChartCellStyle
}

export type SizeChartData = {
  rows: SizeChartCell[][]
  colWidths?: number[]
  rowHeights?: number[]
}

export type SizeChart = {
  id: string
  internal_name: string
  title: string
  description?: string | null
  category?: string | null
  unit: SizeChartUnit
  status: SizeChartStatus
  data: SizeChartData
  created_at: string
  updated_at: string
}

export type Collection = {
  id: string
  name: string
  description: string
  cover_image?: string
  open_date: string
  close_date: string
  status: 'open' | 'closed' | 'production' | 'shipped'
  estimated_delivery?: string
  is_active: boolean
  progress_steps?: Record<string, boolean>
  created_at: string
}

export type Order = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_address: string
  items: OrderItem[]
  total: number
  discount_code?: string
  discount_amount?: number
  status: 'received' | 'pending_payment' | 'paid' | 'production' | 'packing' | 'shipped' | 'delivered'
  notes?: string
  collection_id?: string
  paid_at?: string | null
  created_at: string
}

export type OrderItem = {
  product_id: string
  product_name: string
  size?: string
  color?: string
  quantity: number
  price: number
}

export type Message = {
  id: string
  name: string
  phone: string
  email: string
  type: 'family_message' | 'collection_request' | 'general'
  message: string
  subscribe: boolean
  requested_collections?: string[]
  created_at: string
}

export type DiscountCode = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  expires_at?: string
  max_uses?: number
  used_count: number
  is_active: boolean
  created_at: string
}

export type CommunityQuote = {
  id: string
  name: string
  text: string
  created_at: string
}

export type StickerFlagFile = {
  id: string
  name: string
  description?: string
  file_url: string
  preview_image?: string
  type: 'sticker' | 'flag' | 'both'
  display_order: number
  is_active: boolean
  created_at: string
}

export type CustomPrintSubmission = {
  id: string
  name: string
  email?: string
  phone?: string
  file_url: string
  file_name?: string
  width_cm?: number
  height_cm?: number
  print_type: 'sticker' | 'flag' | 'both'
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type Popup = {
  id: string
  title: string
  text: string
  image?: string
  button_text?: string
  button_link?: string
  bg_color: string
  text_color: string
  is_active: boolean
  pages: string[]
  trigger: 'immediate' | 'delayed' | 'exit'
  trigger_delay?: number
  created_at: string
  popup_settings?: Record<string, any>
  overlay_settings?: Record<string, any>
  blocks?: any[]
  display_rules?: Record<string, any>
}
