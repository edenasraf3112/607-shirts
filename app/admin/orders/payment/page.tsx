'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { formatPrice, formatDate } from '@/lib/utils'
import { CheckCircle2, Phone, Package, MessageCircle, Settings, X, Send, Link2, Truck, Edit2, MapPin, HelpCircle, Landmark, Search } from 'lucide-react'
import toast from 'react-hot-toast'

type PaymentOrder = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  customer_address?: string | null
  notes?: string | null
  delivery_method?: string | null
  items: any[]
  total: number
  status: string
  created_at: string
  paid_at?: string | null
}

type DisplayRow = {
  id: string          // phone in customer mode, order.id in orders mode
  phone: string
  name: string
  email?: string | null
  orders: PaymentOrder[]
  baseTotal: number
}

type ViewMode = 'customers' | 'orders'
type SortKey = 'name-asc' | 'name-desc' | 'amount-asc' | 'amount-desc' | 'date-new' | 'date-old'
type DeliveryPref = 'delivery' | 'pickup' | null
type BulkType = 'payment' | 'survey'

const BIT_PHONE_KEY = 'nl_bit_phone'
const BIT_LINK_KEY = 'nl_bit_personal_link'
const DELIVERY_PREFS_KEY = 'nl_delivery_prefs'
const BANK_DETAILS_KEY = 'nl_bank_details'
const SHIPPING = 20

type BankDetails = { ownerName: string; bankName: string; branch: string; account: string }

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-new', label: 'הזמנה אחרונה' },
  { value: 'date-old', label: 'הזמנה ראשונה' },
  { value: 'name-asc', label: 'שם א→ת' },
  { value: 'name-desc', label: 'שם ת→א' },
  { value: 'amount-desc', label: 'סכום ↓' },
  { value: 'amount-asc', label: 'סכום ↑' },
]

export default function PaymentPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [bitPhone, setBitPhone] = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [bitPersonalLink, setBitPersonalLink] = useState('')
  const [editingLink, setEditingLink] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkType, setBulkType] = useState<BulkType>('payment')
  const [autoSendIndex, setAutoSendIndex] = useState<number | null>(null)
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [deliveryPrefs, setDeliveryPrefs] = useState<Record<string, DeliveryPref>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('customers')
  const [sortKey, setSortKey] = useState<SortKey>('date-new')
  const [searchQuery, setSearchQuery] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [bankDetails, setBankDetails] = useState<BankDetails>({ ownerName: '', bankName: 'לאומי', branch: '', account: '' })
  const [editingBank, setEditingBank] = useState(false)
  const [bankInput, setBankInput] = useState<BankDetails>({ ownerName: '', bankName: 'לאומי', branch: '', account: '' })

  useEffect(() => {
    // Load settings: DB is source of truth, localStorage is fast-load cache
    const localPhone = localStorage.getItem(BIT_PHONE_KEY) || ''
    const localLink = localStorage.getItem(BIT_LINK_KEY) || ''
    const localBank = localStorage.getItem(BANK_DETAILS_KEY)
    if (localPhone) setBitPhone(localPhone)
    if (localLink) setBitPersonalLink(localLink)
    if (localBank) { try { setBankDetails(JSON.parse(localBank)) } catch {} }

    // Fetch DB settings (overrides localStorage); auto-migrate localStorage→DB when DB is empty
    fetch('/api/admin/payment-settings')
      .then(r => r.json())
      .then(s => {
        const migrate: Record<string, any> = {}

        if (s.bitPhone) { setBitPhone(s.bitPhone); localStorage.setItem(BIT_PHONE_KEY, s.bitPhone) }
        else if (localPhone) migrate.bitPhone = localPhone   // DB empty, push from localStorage

        if (s.bitLink) { setBitPersonalLink(s.bitLink); localStorage.setItem(BIT_LINK_KEY, s.bitLink) }
        else if (localLink) migrate.bitLink = localLink

        if (s.bankDetails) { setBankDetails(s.bankDetails); localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(s.bankDetails)) }
        else if (localBank) { try { migrate.bankDetails = JSON.parse(localBank) } catch {} }

        // One-time migration: push existing localStorage values into DB so all devices see them
        if (Object.keys(migrate).length > 0) {
          fetch('/api/admin/payment-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(migrate),
          })
        }

        if (!s.bitPhone && !s.bitLink && !localPhone && !localLink) setEditingPhone(true)
      })
      .catch(() => { if (!localPhone && !localLink) setEditingPhone(true) })

    fetch('/api/admin/orders/payment')
      .then(r => r.json())
      .then(d => {
        const fetchedOrders: PaymentOrder[] = d.orders || []
        setOrders(fetchedOrders)
        setLoading(false)
        const prefsFromDb: Record<string, DeliveryPref> = {}
        for (const o of fetchedOrders) {
          if (o.delivery_method && !prefsFromDb[o.customer_phone]) {
            prefsFromDb[o.customer_phone] = o.delivery_method as DeliveryPref
          }
        }
        const savedPrefs = localStorage.getItem(DELIVERY_PREFS_KEY)
        const localPrefs: Record<string, DeliveryPref> = savedPrefs ? JSON.parse(savedPrefs) : {}
        setDeliveryPrefs({ ...localPrefs, ...prefsFromDb })
      })
      .catch(() => setLoading(false))
  }, [])

  function savePhone() {
    const clean = phoneInput.trim().replace(/\D/g, '')
    if (clean.length < 9) { toast.error('מספר לא תקין'); return }
    localStorage.setItem(BIT_PHONE_KEY, clean)
    setBitPhone(clean)
    setEditingPhone(false)
    fetch('/api/admin/payment-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bitPhone: clean }) })
    toast.success('מספר נשמר')
  }

  function saveBankDetails() {
    localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(bankInput))
    setBankDetails(bankInput)
    setEditingBank(false)
    fetch('/api/admin/payment-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bankDetails: bankInput }) })
    toast.success('פרטי בנק נשמרו')
  }

  function whatsappBitLink(row: DisplayRow) {
    const phone = row.phone.replace(/\D/g, '').replace(/^0/, '972')
    const amount = getAmount(row.id, row.baseTotal)
    const bitPay = getBitPayLink()
    if (!bitPay) return ''
    const msg = `שלום ${row.name} 🙏\nלתשלום על הזמנתך (${formatPrice(amount)}) דרך *Bit*:\n${bitPay}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  function whatsappBankLink(row: DisplayRow) {
    const phone = row.phone.replace(/\D/g, '').replace(/^0/, '972')
    const amount = getAmount(row.id, row.baseTotal)
    const bd = bankDetails
    if (!bd.branch || !bd.account) return ''
    const msg = `שלום ${row.name} 🙏\nפרטי העברה בנקאית עבור הזמנתך (${formatPrice(amount)}):\nשם: ${bd.ownerName || 'Nehoray Leizer'}\nבנק ${bd.bankName} (10) | סניף ${bd.branch} | חשבון ${bd.account}\n📝 בהערה: ${row.name}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  function saveLink() {
    const link = linkInput.trim()
    if (link && !link.startsWith('http')) { toast.error('קישור לא תקין'); return }
    localStorage.setItem(BIT_LINK_KEY, link)
    setBitPersonalLink(link)
    setEditingLink(false)
    fetch('/api/admin/payment-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bitLink: link }) })
    toast.success(link ? 'קישור Bit נשמר' : 'קישור הוסר')
  }

  function closeBulk() {
    setShowBulk(false)
    setAutoSendIndex(null)
  }

  function startAutoSend() {
    if (sortedRows.length === 0) return
    setAutoSendIndex(0)
    const link = bulkType === 'survey' ? whatsappSurveyLink(sortedRows[0]) : whatsappPaymentLink(sortedRows[0])
    window.open(link, '_blank')
  }

  function nextAutoSend() {
    if (autoSendIndex === null) return
    const next = autoSendIndex + 1
    if (next >= sortedRows.length) {
      setAutoSendIndex(null)
      setShowBulk(false)
      toast.success(`✓ נשלח לכל ${sortedRows.length} הלקוחות!`)
      return
    }
    setAutoSendIndex(next)
    const link = bulkType === 'survey' ? whatsappSurveyLink(sortedRows[next]) : whatsappPaymentLink(sortedRows[next])
    window.open(link, '_blank')
  }

  function setDeliveryPref(phone: string, pref: DeliveryPref) {
    setDeliveryPrefs(prev => {
      const next = { ...prev, [phone]: pref }
      localStorage.setItem(DELIVERY_PREFS_KEY, JSON.stringify(next))
      return next
    })
    // Persist to DB for all unpaid orders belonging to this customer
    const customerOrders = orders.filter(o => o.customer_phone === phone && !o.paid_at)
    customerOrders.forEach(o =>
      fetch(`/api/admin/orders/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_method: pref }),
      }).catch(() => {})
    )
  }

  // Customer-grouped rows (one per unique phone)
  const customerRows = useMemo<DisplayRow[]>(() => {
    const map = new Map<string, DisplayRow>()
    for (const o of orders) {
      if (o.paid_at) continue
      if (!map.has(o.customer_phone)) {
        map.set(o.customer_phone, { id: o.customer_phone, phone: o.customer_phone, name: o.customer_name, email: o.customer_email, orders: [], baseTotal: 0 })
      }
      const g = map.get(o.customer_phone)!
      g.orders.push(o)
      g.baseTotal += o.total
    }
    return Array.from(map.values())
  }, [orders])

  // Individual order rows (one per order)
  const orderRows = useMemo<DisplayRow[]>(() => {
    return orders
      .filter(o => !o.paid_at)
      .map(o => ({ id: o.id, phone: o.customer_phone, name: o.customer_name, email: o.customer_email, orders: [o], baseTotal: o.total }))
  }, [orders])

  const paidOrders = useMemo(() => orders.filter(o => !!o.paid_at), [orders])

  // Unique product names across all unpaid orders, for the product filter dropdown
  const productOptions = useMemo(() => {
    const names = new Set<string>()
    for (const o of orders) {
      if (o.paid_at) continue
      for (const i of o.items as any[]) {
        if (i.product_name) names.add(i.product_name)
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'he'))
  }, [orders])

  // Filter by search query (name, phone, email, product) + product dropdown
  const filteredRows = useMemo(() => {
    const rows = viewMode === 'customers' ? customerRows : orderRows
    const query = searchQuery.trim().toLowerCase()
    const queryDigits = query.replace(/\D/g, '')
    return rows.filter(row => {
      if (productFilter && !row.orders.some(o => (o.items as any[]).some(i => i.product_name === productFilter))) {
        return false
      }
      if (!query) return true
      if (row.name.toLowerCase().includes(query)) return true
      if (row.email && row.email.toLowerCase().includes(query)) return true
      if (queryDigits && row.phone.replace(/\D/g, '').includes(queryDigits)) return true
      return row.orders.some(o => (o.items as any[]).some(i => i.product_name?.toLowerCase().includes(query)))
    })
  }, [viewMode, customerRows, orderRows, searchQuery, productFilter])

  function getAmount(id: string, baseTotal: number) {
    return customAmounts[id] ?? baseTotal
  }
  function setAmount(id: string, amount: number) {
    setCustomAmounts(prev => ({ ...prev, [id]: amount }))
  }
  function addShipping(id: string, baseTotal: number) {
    setAmount(id, getAmount(id, baseTotal) + SHIPPING)
  }

  // Sort helper
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      switch (sortKey) {
        case 'name-asc':  return a.name.localeCompare(b.name, 'he')
        case 'name-desc': return b.name.localeCompare(a.name, 'he')
        case 'amount-asc':  return getAmount(a.id, a.baseTotal) - getAmount(b.id, b.baseTotal)
        case 'amount-desc': return getAmount(b.id, b.baseTotal) - getAmount(a.id, a.baseTotal)
        case 'date-new': {
          const aMax = Math.max(...a.orders.map(o => new Date(o.created_at).getTime()))
          const bMax = Math.max(...b.orders.map(o => new Date(o.created_at).getTime()))
          return bMax - aMax
        }
        case 'date-old': {
          const aMin = Math.min(...a.orders.map(o => new Date(o.created_at).getTime()))
          const bMin = Math.min(...b.orders.map(o => new Date(o.created_at).getTime()))
          return aMin - bMin
        }
        default: return 0
      }
    })
  }, [filteredRows, sortKey, customAmounts])

  // Delivery summary (keyed by phone, so works across both view modes)
  const deliverySummary = useMemo(() => {
    const phones = new Set(customerRows.map(r => r.phone))
    const needsDelivery: DisplayRow[] = []
    const pickup: DisplayRow[] = []
    const unknown: DisplayRow[] = []
    for (const row of customerRows) {
      const pref = deliveryPrefs[row.phone]
      if (pref === 'delivery') needsDelivery.push(row)
      else if (pref === 'pickup') pickup.push(row)
      else unknown.push(row)
    }
    return { needsDelivery, pickup, unknown, total: phones.size }
  }, [customerRows, deliveryPrefs])

  function getBitPayLink() {
    if (bitPersonalLink) return bitPersonalLink
    if (bitPhone) return `https://www.bitpay.co.il/app/transfer?phoneNumber=${bitPhone}`
    return ''
  }

  function copyBitLink() {
    const link = getBitPayLink()
    if (!link) { toast.error('הגדר קישור Bit קודם'); return }
    navigator.clipboard.writeText(link)
      .then(() => toast.success('קישור ביט הועתק!'))
      .catch(() => toast.error('שגיאה בהעתקה'))
  }

  function buildItemsList(row: DisplayRow) {
    return row.orders
      .flatMap(o => o.items as any[])
      .map(i => `• ${i.product_name}${i.size ? ` (${i.size})` : ''}${i.color ? ` / ${i.color}` : ''} ×${i.quantity}`)
      .join('\n')
  }

  function whatsappPaymentLink(row: DisplayRow) {
    const phone = row.phone.replace(/\D/g, '').replace(/^0/, '972')
    const amount = getAmount(row.id, row.baseTotal)
    const bitPay = getBitPayLink()
    const bd = bankDetails
    const hasBankDetails = !!(bd.branch && bd.account)

    let paymentSection = ''
    if (bitPay) {
      paymentSection += `\n\n💙 *ביט* — לחץ לתשלום:\n${bitPay}`
    } else if (bitPhone) {
      paymentSection += `\n\n💙 *ביט* — למספר ${bitPhone}`
    }
    if (hasBankDetails) {
      paymentSection += `\n\n🏦 *העברה בנקאית:*\nשם: ${bd.ownerName || 'Nehoray Leizer'}\nבנק ${bd.bankName} (10) | סניף ${bd.branch} | חשבון ${bd.account}\n📝 בהערה: ${row.name}`
    }
    if (!paymentSection) {
      paymentSection = '\n\nנשמח לקבל את התשלום 🙏'
    }

    const msg = `שלום ${row.name} 🙏\nתודה על הזמנתך ב-Nehoray Leizer!\n\n${buildItemsList(row)}\n\nסכום לתשלום: *${formatPrice(amount)}*${paymentSection}\n\nלאחר קבלת התשלום — ההזמנה שלך תיכנס לייצור 🎽`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  function whatsappSurveyLink(row: DisplayRow) {
    const phone = row.phone.replace(/\D/g, '').replace(/^0/, '972')
    const amount = getAmount(row.id, row.baseTotal)
    const msg = `שלום ${row.name} 🙏\nתודה על הזמנתך ב-Nehoray Leizer!\n\n${buildItemsList(row)}\n\nסכום בסיסי: ${formatPrice(amount)}\n\n📦 איך תעדיפ/י לקבל את ההזמנה?\n1️⃣ איסוף עצמי מאילת — *חינם*\n2️⃣ משלוח עד הבית — *+${SHIPPING}₪*\n\nאנא ענה/י ונשלח לך קישור תשלום 🙏`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  async function confirmRow(row: DisplayRow) {
    setConfirming(row.id)
    try {
      const [first, ...rest] = row.orders
      const res = await fetch(`/api/admin/orders/${first.id}/confirm-payment`, { method: 'POST' })
      const data = await res.json()
      if (!data.ok) { toast.error(data.error || 'שגיאה'); setConfirming(null); return }
      if (rest.length > 0) {
        await Promise.all(rest.map(o =>
          fetch(`/api/admin/orders/${o.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paid_at: data.paidAt, status: 'paid' }),
          })
        ))
      }
      setOrders(prev => prev.map(o =>
        row.orders.some(ro => ro.id === o.id) ? { ...o, paid_at: data.paidAt, status: 'paid' } : o
      ))
      const ordersLabel = row.orders.length > 1 ? `${row.orders.length} הזמנות סומנו` : 'ההזמנה סומנה'
      if (data.emailSent) {
        toast.success(`✓ ${row.name} — ${ordersLabel}, אימייל אישור נשלח!`)
      } else {
        toast.error(`${row.name} — ${ordersLabel}, אך שליחת מייל האישור נכשלה (${data.emailError || 'שגיאה לא ידועה'}). כדאי לשלוח לו הודעה ידנית.`, { duration: 8000 })
      }
    } catch {
      toast.error('שגיאה')
    }
    setConfirming(null)
  }

  async function unmarkPaid(order: PaymentOrder) {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_at: null, status: 'received' }),
    })
    const data = await res.json()
    if (data.ok) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paid_at: null, status: 'received' } : o))
      toast.success('בוטל סימון תשלום')
    }
  }

  const unpaidCount = sortedRows.length

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-5">

        {/* Bulk send modal */}
        {showBulk && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal/60" onClick={closeBulk}>
            <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-light-gray flex-shrink-0" dir="rtl">
                <div>
                  <h2 className="font-medium text-charcoal">שליחה לכולם</h2>
                  <p className="text-xs text-warm-gray mt-0.5">
                    {sortedRows.length} {viewMode === 'customers' ? 'לקוחות' : 'הזמנות'}
                    {productFilter && <> · מוצר: <span className="text-charcoal font-medium">{productFilter}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {autoSendIndex === null && sortedRows.length > 0 && (
                    <button
                      onClick={startAutoSend}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal text-cream text-xs hover:bg-charcoal/80 transition-colors rounded-lg"
                    >
                      <Send size={13} />שלח לכולם
                    </button>
                  )}
                  <button onClick={closeBulk} className="p-1 text-warm-gray hover:text-charcoal"><X size={18} /></button>
                </div>
              </div>

              {/* Type toggle tabs */}
              <div className="flex gap-0 border-b border-light-gray flex-shrink-0" dir="rtl">
                {([['payment', 'הודעת תשלום'], ['survey', 'סקר משלוח']] as const).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => { setBulkType(type); setAutoSendIndex(null) }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${bulkType === type ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 divide-y divide-light-gray" dir="rtl">
                {sortedRows.length === 0 ? (
                  <p className="text-center text-warm-gray py-10 text-sm">אין הזמנות ממתינות</p>
                ) : sortedRows.map((row, idx) => {
                  const isCurrent = autoSendIndex === idx
                  const isDone = autoSendIndex !== null && idx < autoSendIndex
                  return (
                    <div key={row.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isCurrent ? 'bg-amber-50' : isDone ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isDone && <span className="text-green-500 text-xs">✓</span>}
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                          <span className="font-medium text-charcoal text-sm">{row.name}</span>
                          {row.orders.length > 1 && <span className="text-xs text-amber-600">({row.orders.length} הזמנות)</span>}
                          {deliveryPrefs[row.phone] === 'delivery' && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">🚚</span>}
                          {deliveryPrefs[row.phone] === 'pickup' && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">📍</span>}
                        </div>
                        <div className="text-xs text-warm-gray truncate">
                          {row.orders.flatMap(o => o.items as any[]).map((i: any, i2: number, arr: any[]) =>
                            `${i.product_name}${i.size ? ` (${i.size})` : ''} ×${i.quantity}${i2 < arr.length - 1 ? ', ' : ''}`
                          )}
                        </div>
                      </div>
                      <div className="font-serif text-base font-medium text-charcoal flex-shrink-0">
                        {formatPrice(getAmount(row.id, row.baseTotal))}
                      </div>
                      {/* Manual send button (always visible) */}
                      <a
                        href={bulkType === 'survey' ? whatsappSurveyLink(row) : whatsappPaymentLink(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors flex-shrink-0 rounded-lg ${isCurrent ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-charcoal text-cream hover:bg-charcoal/80'}`}
                      >
                        <Send size={13} />שלח
                      </a>
                    </div>
                  )
                })}
              </div>

              {/* Auto-send progress bar */}
              {autoSendIndex !== null && (
                <div className="flex-shrink-0 border-t-2 border-charcoal px-5 py-4 bg-charcoal" dir="rtl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-cream">
                      <div className="text-sm font-medium">
                        {autoSendIndex + 1} / {sortedRows.length}
                        {' — '}שנשלח ל{sortedRows[autoSendIndex].name}
                      </div>
                      {autoSendIndex + 1 < sortedRows.length && (
                        <div className="text-xs text-cream/60 mt-0.5">
                          הבא: {sortedRows[autoSendIndex + 1].name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={nextAutoSend}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-charcoal text-sm font-medium hover:bg-cream transition-colors rounded-lg flex-shrink-0"
                    >
                      {autoSendIndex + 1 < sortedRows.length ? (
                        <><Send size={14} />שלח הבא</>
                      ) : (
                        <><CheckCircle2 size={14} />סיום</>
                      )}
                    </button>
                  </div>
                  {/* Progress strip */}
                  <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${((autoSendIndex + 1) / sortedRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">תשלומים</h1>
            <p className="text-sm text-warm-gray">
              {unpaidCount} {viewMode === 'customers' ? 'לקוחות' : 'הזמנות'} ממתינות · {paidOrders.length} שולמו
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unpaidCount > 0 && (
              <button onClick={() => setShowBulk(true)}
                className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
                <Send size={14} />
                שלח לכולם ({unpaidCount})
              </button>
            )}
          </div>
          {/* Bit settings */}
          <div className="flex flex-wrap items-center gap-2">
            {editingLink ? (
              <>
                <input autoFocus type="url" placeholder="קישור Bit האישי שלך" value={linkInput}
                  onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveLink()}
                  className="border border-light-gray px-3 py-2 text-sm w-64 focus:outline-none focus:border-charcoal rounded-lg" dir="ltr" />
                <button onClick={saveLink} className="px-3 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">שמור</button>
                <button onClick={() => setEditingLink(false)} className="px-3 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">ביטול</button>
              </>
            ) : (
              <button onClick={() => { setLinkInput(bitPersonalLink); setEditingLink(true) }}
                className="flex items-center gap-2 px-3 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                <Link2 size={14} />{bitPersonalLink ? 'קישור Bit ✓' : 'הוסף קישור Bit אישי'}
              </button>
            )}
            {editingPhone ? (
              <>
                <input type="tel" placeholder="מספר Bit שלך" value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePhone()}
                  className="border border-light-gray px-3 py-2 text-sm w-40 focus:outline-none focus:border-charcoal rounded-lg" dir="ltr" />
                <button onClick={savePhone} className="px-3 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">שמור</button>
              </>
            ) : (
              <button onClick={() => { setPhoneInput(bitPhone); setEditingPhone(true) }}
                className="flex items-center gap-2 px-3 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                <Settings size={14} />Bit: {bitPhone || 'לא מוגדר'}
              </button>
            )}

            {/* Bank details */}
            {editingBank ? (
              <div className="flex items-center gap-1.5 flex-wrap border border-blue-200 bg-blue-50 rounded-lg px-3 py-2">
                <input placeholder="שם בעל חשבון" value={bankInput.ownerName}
                  onChange={e => setBankInput(p => ({ ...p, ownerName: e.target.value }))}
                  className="border border-light-gray px-2 py-1.5 text-sm w-36 focus:outline-none focus:border-charcoal rounded bg-white" dir="rtl" />
                <input placeholder="בנק (לאומי)" value={bankInput.bankName}
                  onChange={e => setBankInput(p => ({ ...p, bankName: e.target.value }))}
                  className="border border-light-gray px-2 py-1.5 text-sm w-24 focus:outline-none focus:border-charcoal rounded bg-white" dir="rtl" />
                <input placeholder="סניף" value={bankInput.branch}
                  onChange={e => setBankInput(p => ({ ...p, branch: e.target.value }))}
                  className="border border-light-gray px-2 py-1.5 text-sm w-20 focus:outline-none focus:border-charcoal rounded bg-white" dir="ltr" />
                <input placeholder="חשבון" value={bankInput.account}
                  onChange={e => setBankInput(p => ({ ...p, account: e.target.value }))}
                  className="border border-light-gray px-2 py-1.5 text-sm w-28 focus:outline-none focus:border-charcoal rounded bg-white" dir="ltr" />
                <button onClick={saveBankDetails} className="px-3 py-1.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">שמור</button>
                <button onClick={() => setEditingBank(false)} className="px-3 py-1.5 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg bg-white">ביטול</button>
              </div>
            ) : (
              <button onClick={() => { setBankInput(bankDetails); setEditingBank(true) }}
                className={`flex items-center gap-2 px-3 py-2 border text-sm transition-colors rounded-lg ${bankDetails.branch && bankDetails.account ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}>
                <Landmark size={14} />
                {bankDetails.branch && bankDetails.account
                  ? `${bankDetails.bankName} ${bankDetails.branch}/${bankDetails.account} ✓`
                  : 'הגדר העברה בנקאית'}
              </button>
            )}
          </div>
        </div>

        {!bitPhone && !bitPersonalLink && !editingPhone && !editingLink && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>הגדר קישור Bit אישי</strong> — פתח Bit ← פרופיל ← הצג קוד QR ← שתף ← העתק קישור.
          </div>
        )}

        {/* Search + product filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              className="form-input pr-9"
              placeholder="חיפוש לפי שם, טלפון, מייל, מוצר..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              dir="rtl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
                title="נקה חיפוש"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {productOptions.length > 0 && (
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className={`form-input w-full sm:w-64 ${productFilter ? 'border-charcoal text-charcoal font-medium' : ''}`}
              dir="rtl"
            >
              <option value="">כל המוצרים</option>
              {productOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          {productFilter && (
            <button
              onClick={() => setProductFilter('')}
              className="flex items-center gap-1 px-2.5 py-2 text-xs text-warm-gray hover:text-charcoal transition-colors"
              title="נקה סינון מוצר"
            >
              <X size={12} />נקה סינון מוצר
            </button>
          )}
        </div>

        {/* View + Sort controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-light-gray/60 rounded-lg p-1 gap-0.5">
            {(['customers', 'orders'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${viewMode === mode ? 'bg-white text-charcoal shadow-sm' : 'text-warm-gray hover:text-charcoal'}`}
              >
                {mode === 'customers' ? 'לפי לקוחות' : 'לפי הזמנות'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortKey(opt.value)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${sortKey === opt.value ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-warm-gray">טוען...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-warm-gray bg-white rounded-xl border border-light-gray">
            <p className="font-serif text-xl">אין הזמנות</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedRows.length === 0 && (searchQuery || productFilter) && (
              <div className="p-8 text-center text-warm-gray bg-white rounded-xl border border-light-gray text-sm">
                {searchQuery && productFilter
                  ? `אין תוצאות עבור "${searchQuery}" במוצר "${productFilter}"`
                  : searchQuery
                    ? `אין תוצאות עבור "${searchQuery}"`
                    : `אין הזמנות ממתינות עבור "${productFilter}"`}
              </div>
            )}
            {sortedRows.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-warm-gray mb-3">
                  ממתינים לתשלום ({sortedRows.length} {viewMode === 'customers' ? 'לקוחות' : 'הזמנות'})
                </h2>
                <div className="bg-white rounded-xl border border-light-gray overflow-hidden divide-y divide-light-gray">
                  {sortedRows.map(row => (
                    <CustomerRow
                      key={row.id}
                      row={row}
                      amount={getAmount(row.id, row.baseTotal)}
                      deliveryPref={deliveryPrefs[row.phone] ?? null}
                      onDeliveryPref={pref => setDeliveryPref(row.phone, pref)}
                      onAmountChange={val => setAmount(row.id, val)}
                      onAddShipping={() => addShipping(row.id, row.baseTotal)}
                      onWhatsappBlank={`https://wa.me/${row.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                      onWhatsappPayment={whatsappPaymentLink(row)}
                      onWhatsappSurvey={whatsappSurveyLink(row)}
                      onBitWA={whatsappBitLink(row)}
                      onBankWA={whatsappBankLink(row)}
                      onConfirm={() => confirmRow(row)}
                      confirming={confirming === row.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Delivery status summary */}
            {customerRows.length > 0 && (
              <DeliverySummary summary={deliverySummary} />
            )}

            {paidOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-warm-gray mb-3">שולמו ({paidOrders.length})</h2>
                <div className="bg-white rounded-xl border border-light-gray overflow-hidden divide-y divide-light-gray opacity-75">
                  {paidOrders.map(order => (
                    <PaidRow key={order.id} order={order} onUnmark={() => unmarkPaid(order)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

// ─── Delivery Summary ────────────────────────────────────────────────────────

function DeliverySummary({ summary }: {
  summary: { needsDelivery: DisplayRow[]; pickup: DisplayRow[]; unknown: DisplayRow[]; total: number }
}) {
  const { needsDelivery, pickup, unknown } = summary
  const shippingRevenue = needsDelivery.length * 20

  return (
    <div>
      <h2 className="text-sm font-medium text-warm-gray mb-3">סיכום מצב משלוחים</h2>
      <div className="bg-white rounded-xl border border-light-gray p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Delivery */}
          <div className={`rounded-lg px-4 py-3 text-center ${needsDelivery.length > 0 ? 'bg-blue-50 border border-blue-100' : 'bg-cream border border-light-gray'}`}>
            <div className="text-2xl font-serif font-medium text-charcoal">{needsDelivery.length}</div>
            <div className="text-xs text-warm-gray mt-0.5">🚚 משלוח עד הבית</div>
            {needsDelivery.length > 0 && (
              <div className="text-xs text-blue-600 mt-1 font-medium">+{shippingRevenue}₪ מדמי משלוח</div>
            )}
          </div>
          {/* Pickup */}
          <div className={`rounded-lg px-4 py-3 text-center ${pickup.length > 0 ? 'bg-green-50 border border-green-100' : 'bg-cream border border-light-gray'}`}>
            <div className="text-2xl font-serif font-medium text-charcoal">{pickup.length}</div>
            <div className="text-xs text-warm-gray mt-0.5">📍 איסוף מאילת</div>
          </div>
          {/* Unknown */}
          <div className={`rounded-lg px-4 py-3 text-center ${unknown.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-cream border border-light-gray'}`}>
            <div className="text-2xl font-serif font-medium text-charcoal">{unknown.length}</div>
            <div className="text-xs text-warm-gray mt-0.5">❓ טרם ענו</div>
          </div>
        </div>

        {/* Breakdown lists */}
        {needsDelivery.length > 0 && (
          <div>
            <p className="text-xs font-medium text-blue-700 mb-1.5">🚚 מצריכים משלוח:</p>
            <div className="flex flex-wrap gap-1.5">
              {needsDelivery.map(r => (
                <span key={r.phone} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-full">{r.name}</span>
              ))}
            </div>
          </div>
        )}
        {pickup.length > 0 && (
          <div>
            <p className="text-xs font-medium text-green-700 mb-1.5">📍 איסוף עצמי:</p>
            <div className="flex flex-wrap gap-1.5">
              {pickup.map(r => (
                <span key={r.phone} className="text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded-full">{r.name}</span>
              ))}
            </div>
          </div>
        )}
        {unknown.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-700 mb-1.5">❓ ממתינים לתשובה:</p>
            <div className="flex flex-wrap gap-1.5">
              {unknown.map(r => (
                <span key={r.phone} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-full">{r.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({ row, amount, deliveryPref, onDeliveryPref, onAmountChange, onAddShipping, onWhatsappBlank, onWhatsappPayment, onWhatsappSurvey, onBitWA, onBankWA, onConfirm, confirming }: {
  row: DisplayRow
  amount: number
  deliveryPref: DeliveryPref
  onDeliveryPref: (pref: DeliveryPref) => void
  onAmountChange: (val: number) => void
  onAddShipping: () => void
  onWhatsappBlank: string
  onWhatsappPayment: string
  onWhatsappSurvey: string
  onBitWA: string
  onBankWA: string
  onConfirm: () => void
  confirming: boolean
}) {
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput] = useState(String(amount))
  const allItems = row.orders.flatMap(o => o.items as any[])
  const totalQuantity = allItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)

  function commitAmount() {
    const val = parseFloat(amountInput)
    if (!isNaN(val) && val > 0) onAmountChange(val)
    setEditingAmount(false)
  }

  function cycleDelivery() {
    if (deliveryPref === null) onDeliveryPref('delivery')
    else if (deliveryPref === 'delivery') onDeliveryPref('pickup')
    else onDeliveryPref(null)
  }

  return (
    <div className="p-4 sm:p-5">
      {row.orders.length > 1 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3 inline-block">
          {row.orders.length} הזמנות מאוחדות
        </div>
      )}
      {/* Stack vertically on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">

        {/* ── Customer info (full width on mobile) ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-medium text-charcoal text-base">{row.name}</span>
            <a href={`tel:${row.phone}`} className="flex items-center gap-1 text-sm text-warm-gray hover:text-charcoal transition-colors">
              <Phone size={13} />{row.phone}
            </a>
            <span className="text-xs text-warm-gray">{formatDate(row.orders[0].created_at)}</span>
          </div>
          <div className="flex items-start gap-2 mt-1">
            <Package size={13} className="text-warm-gray mt-0.5 flex-shrink-0" />
            <div className="text-xs text-warm-gray space-y-0.5">
              {allItems.map((item: any, i: number) => (
                <div key={i}>
                  {item.product_name}
                  {item.size ? ` · ${item.size}` : ''}
                  {item.color ? ` · ${item.color}` : ''}
                  {` ×${item.quantity}`}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-xs font-medium ${row.orders.length > 1 ? 'text-charcoal' : 'text-warm-gray'}`}>
              סה״כ: {totalQuantity} פריטים
            </span>
          </div>

          {(row.orders[0].customer_address || row.orders[0].notes) && (
            <div className="mt-2 space-y-1">
              {row.orders[0].customer_address && (
                <div className="flex items-start gap-1.5 text-xs text-warm-gray">
                  <MapPin size={11} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  <span>{row.orders[0].customer_address}</span>
                </div>
              )}
              {row.orders[0].notes && (
                <div className="flex items-start gap-1.5 text-xs text-warm-gray">
                  <span className="flex-shrink-0">💬</span>
                  <span className="italic">{row.orders[0].notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Delivery preference toggle */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs text-warm-gray">משלוח:</span>
            <button
              onClick={() => onDeliveryPref(deliveryPref === 'delivery' ? null : 'delivery')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${deliveryPref === 'delivery' ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium' : 'border-light-gray text-warm-gray hover:border-blue-300 hover:text-blue-700'}`}
            >
              <Truck size={10} />עד הבית
            </button>
            <button
              onClick={() => onDeliveryPref(deliveryPref === 'pickup' ? null : 'pickup')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${deliveryPref === 'pickup' ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'border-light-gray text-warm-gray hover:border-green-300 hover:text-green-700'}`}
            >
              <MapPin size={10} />איסוף
            </button>
            {deliveryPref && (
              <button onClick={() => onDeliveryPref(null)} className="text-warm-gray/50 hover:text-warm-gray transition-colors" title="נקה סימון">
                <HelpCircle size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Amount + actions (below on mobile, beside on sm+) ── */}
        <div className="flex flex-col gap-2 sm:items-end sm:flex-shrink-0">
          {/* Amount + shipping on same row on mobile */}
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            {editingAmount ? (
              <div className="flex items-center gap-1">
                <span className="text-warm-gray text-sm">₪</span>
                <input
                  type="number"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  onBlur={commitAmount}
                  onKeyDown={e => { if (e.key === 'Enter') commitAmount(); if (e.key === 'Escape') setEditingAmount(false) }}
                  autoFocus
                  className="w-20 border border-charcoal px-2 py-1 text-sm text-center font-serif rounded"
                />
              </div>
            ) : (
              <button
                onClick={() => { setAmountInput(String(amount)); setEditingAmount(true) }}
                className="flex items-center gap-1.5 font-serif text-2xl font-medium text-charcoal hover:text-warm-gray transition-colors"
                title="לחץ לעריכת סכום"
              >
                {formatPrice(amount)}<Edit2 size={13} className="text-warm-gray" />
              </button>
            )}
            <button
              onClick={onAddShipping}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-warm-gray/40 text-xs text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
            >
              <Truck size={11} />+20₪ משלוח
            </button>
          </div>

          {/* Action buttons — wrap freely */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href={onWhatsappBlank} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-2 bg-green-50 border border-green-200 text-green-700 text-xs hover:bg-green-100 transition-colors rounded-lg"
              title="פתח וואטסאפ">
              <MessageCircle size={13} />WA
            </a>
            {onBitWA && (
              <a href={onBitWA} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs hover:bg-blue-100 transition-colors rounded-lg"
                title="שלח קישור Bit בוואטסאפ">
                <Link2 size={13} />Bit
              </a>
            )}
            {onBankWA && (
              <a href={onBankWA} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-2 border border-light-gray text-warm-gray text-xs hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
                title="שלח פרטי בנק בוואטסאפ">
                <Landmark size={13} />בנק
              </a>
            )}
            <a href={onWhatsappSurvey} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-2 border border-light-gray text-xs text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
              title="שלח סקר משלוח">
              <Truck size={13} />סקר
            </a>
            <a href={onWhatsappPayment} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-2 border border-light-gray text-xs text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg"
              title="שלח הודעת תשלום מלאה">
              <Send size={13} />שלח
            </a>
          </div>

          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50 rounded-lg w-full"
          >
            <CheckCircle2 size={15} />
            {confirming ? 'שולח...' : 'קיבלתי תשלום'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Paid Row ─────────────────────────────────────────────────────────────────

function PaidRow({ order, onUnmark }: { order: PaymentOrder; onUnmark: () => void }) {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-warm-gray">{order.customer_name}</span>
          <span className="text-xs text-warm-gray">{order.customer_phone}</span>
          {order.paid_at && <span className="text-xs text-green-600">שולם {formatDate(order.paid_at)}</span>}
        </div>
        <div className="text-xs text-warm-gray/70 mt-0.5">
          {(order.items as any[]).map((item: any, i: number) => (
            <span key={i}>{item.product_name} ×{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-serif text-lg text-green-600">{formatPrice(order.total)}</span>
        <button onClick={onUnmark} className="text-xs text-warm-gray/50 hover:text-warm-gray transition-colors">בטל</button>
      </div>
    </div>
  )
}
