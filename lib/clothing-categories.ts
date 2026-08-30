export const CLOTHING_CATEGORIES = [
  { value: 'tshirt_oversized', label: 'חולצת טי אוברסייז' },
  { value: 'tshirt_regular', label: 'חולצת טי רגילה' },
  { value: 'hoodie_heavy', label: 'הודי כבד' },
  { value: 'hoodie_light', label: 'הודי קל' },
  { value: 'sweatpants', label: 'מכנסי טרנינג' },
  { value: 'cargo_pants', label: 'מכנסי קרגו' },
  { value: 'jeans', label: "ג'ינס" },
  { value: 'shorts', label: 'מכנסי ים' },
  { value: 'slides', label: 'כפכפים / שקפים' },
  { value: 'jacket', label: "ז'קט" },
  { value: 'coat', label: 'מעיל' },
  { value: 'hat', label: 'כובע' },
  { value: 'accessory', label: 'אקססורי' },
  { value: 'other', label: 'אחר' },
]

export const COLLECTION_PROGRESS_STEPS = [
  { key: 'orders_closed', label: 'הזמנות נסגרו', emoji: '✔', description: 'כל ההזמנות נסגרו ומסוכמות' },
  { key: 'production_started', label: 'ייצור התחיל', emoji: '🧵', description: 'המפעל התחיל בייצור' },
  { key: 'on_the_way', label: 'בדרך', emoji: '🚢', description: 'הסחורה בדרך לישראל' },
  { key: 'arrived_israel', label: 'הגיעה לישראל', emoji: '📍', description: 'הסחורה הגיעה לישראל' },
  { key: 'preparing_distribution', label: 'מתכוננים לחלוקה', emoji: '📦', description: 'אנחנו מכינים את ההזמנות לחלוקה' },
  { key: 'ready_for_pickup', label: 'מוכן לאיסוף', emoji: '✅', description: 'ניתן לאסוף את ההזמנה' },
]

export type ProgressSteps = {
  orders_closed?: boolean
  production_started?: boolean
  on_the_way?: boolean
  arrived_israel?: boolean
  preparing_distribution?: boolean
  ready_for_pickup?: boolean
}
