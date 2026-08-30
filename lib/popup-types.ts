// ─── Block Types ─────────────────────────────────────────────────────────────

export type BlockType =
  | 'image' | 'logo' | 'h1' | 'h2' | 'paragraph'
  | 'small_text' | 'button' | 'button2' | 'email_input'
  | 'name_input' | 'phone_input' | 'divider' | 'badge'

export type PopupBlock = {
  id: string
  type: BlockType
  visible: boolean
  // Content
  text?: string
  src?: string
  alt?: string
  href?: string
  target?: '_blank' | '_self'
  placeholder?: string
  // Typography
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  // Spacing
  marginTop?: number
  marginBottom?: number
  paddingX?: number
  paddingY?: number
  // Appearance
  fullWidth?: boolean
  borderRadius?: number
  backgroundColor?: string
  border?: string
  opacity?: number
  // Image-specific
  objectFit?: 'cover' | 'contain'
  objectPosition?: string
  imageHeight?: number
  overlayColor?: string
  overlayOpacity?: number
}

// ─── Layout & Settings ────────────────────────────────────────────────────────

export type LayoutType = 'center' | 'fullscreen' | 'bottom-sheet' | 'side-left' | 'side-right'

export type PopupSettings = {
  layout: LayoutType
  width: number
  padding: number
  mobilePadding: number
  borderRadius: number
  backgroundColor: string
  backgroundImage: string
  border: string
  boxShadow: string
  closeButton: boolean
  closeButtonPosition: 'top-left' | 'top-right'
  closeButtonColor: string
  closeButtonSize: number
  successMessage: string
  redirectAfterSubmit: string
  splitLayout?: boolean
}

export type DisplayRules = {
  pageMode: 'all' | 'include' | 'exclude'
  pages: string[]
  trigger: 'immediate' | 'delayed' | 'exit' | 'scroll'
  triggerDelay: number
  triggerScroll: number
  frequency: 'always' | 'session' | 'days'
  frequencyDays: number
  devices: 'all' | 'mobile' | 'desktop'
}

export type OverlaySettings = {
  color: string
  opacity: number
  blur: boolean
  closeOnClick: boolean
}

export type PopupData = {
  id?: string
  title: string
  is_active: boolean
  priority: number
  blocks: PopupBlock[]
  popup_settings: PopupSettings
  display_rules: DisplayRules
  overlay_settings: OverlaySettings
  template_name?: string
  created_at?: string
  updated_at?: string
  // Legacy fields (kept for backwards compat)
  text?: string
  image?: string
  button_text?: string
  button_link?: string
  bg_color?: string
  text_color?: string
  pages?: string[]
  trigger?: string
  trigger_delay?: number
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_POPUP_SETTINGS: PopupSettings = {
  layout: 'center',
  width: 480,
  padding: 48,
  mobilePadding: 24,
  borderRadius: 0,
  backgroundColor: '#FFFFFF',
  backgroundImage: '',
  border: '',
  boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
  closeButton: true,
  closeButtonPosition: 'top-right',
  closeButtonColor: '#1A1A1A',
  closeButtonSize: 20,
  successMessage: 'תודה! נחזור אליך בקרוב.',
  redirectAfterSubmit: '',
}

export const DEFAULT_DISPLAY_RULES: DisplayRules = {
  pageMode: 'all',
  pages: [],
  trigger: 'delayed',
  triggerDelay: 3,
  triggerScroll: 50,
  frequency: 'session',
  frequencyDays: 7,
  devices: 'all',
}

export const DEFAULT_OVERLAY: OverlaySettings = {
  color: '#1A1A1A',
  opacity: 0.5,
  blur: true,
  closeOnClick: true,
}

export function newBlock(type: BlockType): PopupBlock {
  const id = Math.random().toString(36).slice(2)
  const defaults: Record<BlockType, Partial<PopupBlock>> = {
    image:       { src: '', alt: '', imageHeight: 200, objectFit: 'cover', objectPosition: 'center', marginBottom: 0 },
    logo:        { imageHeight: 48, objectFit: 'contain', objectPosition: 'center', marginBottom: 16 },
    h1:          { text: 'כותרת ראשית', fontSize: 32, fontWeight: '400', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
    h2:          { text: 'כותרת משנית', fontSize: 20, fontWeight: '400', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
    paragraph:   { text: 'הוסף טקסט כאן...', fontSize: 14, fontWeight: '400', color: '#6B6560', textAlign: 'center', marginBottom: 16 },
    small_text:  { text: 'טקסט קטן', fontSize: 11, fontWeight: '400', color: '#6B6560', textAlign: 'center', marginBottom: 8 },
    button:      { text: 'לחץ כאן', href: '', target: '_self', fontSize: 12, fontWeight: '500', color: '#FAFAF8', backgroundColor: '#1A1A1A', borderRadius: 0, paddingX: 32, paddingY: 14, fullWidth: false, marginBottom: 12 },
    button2:     { text: 'מידע נוסף', href: '', target: '_self', fontSize: 12, fontWeight: '400', color: '#1A1A1A', backgroundColor: 'transparent', border: '1px solid #1A1A1A', borderRadius: 0, paddingX: 32, paddingY: 14, fullWidth: false, marginBottom: 12 },
    email_input: { placeholder: 'האימייל שלך', fontSize: 14, color: '#1A1A1A', backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 0, paddingX: 16, paddingY: 12, fullWidth: true, marginBottom: 12 },
    name_input:  { placeholder: 'שם מלא', fontSize: 14, color: '#1A1A1A', backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 0, paddingX: 16, paddingY: 12, fullWidth: true, marginBottom: 12 },
    phone_input: { placeholder: 'מספר טלפון', fontSize: 14, color: '#1A1A1A', backgroundColor: '#FFFFFF', border: '1px solid #E8E5E0', borderRadius: 0, paddingX: 16, paddingY: 12, fullWidth: true, marginBottom: 12 },
    divider:     { color: '#E8E5E0', marginTop: 16, marginBottom: 16 },
    badge:       { text: 'חדש', fontSize: 10, fontWeight: '600', color: '#FFFFFF', backgroundColor: '#1A1A1A', borderRadius: 999, paddingX: 12, paddingY: 4, textAlign: 'center', marginBottom: 12 },
  }
  return { id, type, visible: true, ...defaults[type] }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export type Template = {
  name: string
  label: string
  emoji: string
  data: Partial<PopupData>
}

export const TEMPLATES: Template[] = [
  {
    name: 'newsletter',
    label: 'הרשמה לניוזלטר',
    emoji: '✉️',
    data: {
      template_name: 'newsletter',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 480, padding: 48, backgroundColor: '#FAFAF8' },
      blocks: [
        newBlock('logo'),
        { ...newBlock('h1'), text: 'הצטרפו למשפחה', fontSize: 28 },
        { ...newBlock('paragraph'), text: 'קבלו עדכונים על קולקציות חדשות ישירות לתיבת האימייל שלכם' },
        newBlock('name_input'),
        newBlock('email_input'),
        { ...newBlock('button'), text: 'הצטרפו עכשיו', fullWidth: true },
        { ...newBlock('small_text'), text: 'ניתן להסיר את עצמכם בכל עת' },
      ],
    },
  },
  {
    name: 'announcement',
    label: 'הודעה חשובה',
    emoji: '📢',
    data: {
      template_name: 'announcement',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 440, padding: 48, backgroundColor: '#1A1A1A' },
      blocks: [
        { ...newBlock('h1'), text: 'הודעה חשובה', color: '#FAFAF8', fontSize: 30 },
        { ...newBlock('paragraph'), text: 'הוסף כאן את תוכן ההודעה שלך', color: '#E8E5E0' },
        { ...newBlock('button'), text: 'להמשך', color: '#1A1A1A', backgroundColor: '#FAFAF8', fullWidth: true },
      ],
    },
  },
  {
    name: 'discount',
    label: 'מבצע / קוד הנחה',
    emoji: '🏷️',
    data: {
      template_name: 'discount',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 460, padding: 48, backgroundColor: '#FAFAF8' },
      blocks: [
        { ...newBlock('badge'), text: '⏳ הצעה לזמן מוגבל' },
        { ...newBlock('h1'), text: '15% הנחה', fontSize: 48, fontWeight: '300' },
        { ...newBlock('paragraph'), text: 'הרשמו לניוזלטר וקבלו קוד הנחה מיוחד לרכישה הראשונה' },
        newBlock('email_input'),
        { ...newBlock('button'), text: 'קבלו את הקוד', fullWidth: true },
        { ...newBlock('small_text'), text: 'בהרשמה אתם מסכימים לתנאי השימוש' },
      ],
    },
  },
  {
    name: 'product_launch',
    label: 'השקת מוצר',
    emoji: '🚀',
    data: {
      template_name: 'product_launch',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 520, padding: 0, backgroundColor: '#FFFFFF' },
      blocks: [
        { ...newBlock('image'), imageHeight: 240, src: '' },
        { ...newBlock('h1'), text: 'קולקציה חדשה', fontSize: 26, marginBottom: 8 },
        { ...newBlock('paragraph'), text: 'גלו את הפריטים החדשים שלנו', marginBottom: 24 },
        { ...newBlock('button'), text: 'לצפייה בקולקציה', fullWidth: true, marginBottom: 16, paddingX: 24, paddingY: 16 },
      ],
    },
  },
  {
    name: 'story',
    label: 'סיפור המותג',
    emoji: '🕊️',
    data: {
      template_name: 'story',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 500, padding: 48, backgroundColor: '#F4F0ED' },
      blocks: [
        { ...newBlock('logo') },
        { ...newBlock('divider'), marginTop: 8, marginBottom: 24 },
        { ...newBlock('h1'), text: 'לזכרו של נהוראי לייזר', fontSize: 24, fontWeight: '400' },
        { ...newBlock('paragraph'), text: 'מותג שנולד מאהבה. כל פריט שתבחרו הוא חלק מהסיפור שלו.', fontSize: 15, color: '#1A1A1A' },
        { ...newBlock('button'), text: 'הסיפור שלו', href: '/story', target: '_self', backgroundColor: '#1A1A1A', color: '#FAFAF8', fullWidth: true, marginTop: 16 },
      ],
    },
  },
  {
    name: 'coming_soon',
    label: 'בקרוב',
    emoji: '⏳',
    data: {
      template_name: 'coming_soon',
      popup_settings: { ...DEFAULT_POPUP_SETTINGS, width: 460, padding: 48, backgroundColor: '#1A1A1A' },
      blocks: [
        { ...newBlock('badge'), text: 'COMING SOON', color: '#1A1A1A', backgroundColor: '#FAFAF8' },
        { ...newBlock('h1'), text: 'משהו מיוחד מגיע', color: '#FAFAF8', fontSize: 32, fontWeight: '300' },
        { ...newBlock('paragraph'), text: 'הירשמו לקבלת עדכון ראשון', color: '#E8E5E0' },
        newBlock('email_input'),
        { ...newBlock('button'), text: 'עדכנו אותי', color: '#1A1A1A', backgroundColor: '#FAFAF8', fullWidth: true },
      ],
    },
  },
]

export const BLOCK_LABELS: Record<BlockType, string> = {
  image: '🖼️ תמונה',
  logo: '🏷️ לוגו',
  h1: '𝐇¹ כותרת ראשית',
  h2: '𝐇² כותרת משנית',
  paragraph: '¶ טקסט',
  small_text: 'Aₐ טקסט קטן',
  button: '▶ כפתור ראשי',
  button2: '▷ כפתור שני',
  email_input: '@ שדה אימייל',
  name_input: '👤 שדה שם',
  phone_input: '📱 שדה טלפון',
  divider: '── מפריד',
  badge: '🏷 תגית',
}

export const PAGE_OPTIONS = [
  { value: 'home', label: 'דף הבית' },
  { value: 'shop', label: 'חנות' },
  { value: 'story', label: 'הסיפור' },
  { value: 'contact', label: 'צור קשר' },
  { value: 'cart', label: 'עגלה' },
  { value: 'past-collections', label: 'קולקציות עבר' },
]
