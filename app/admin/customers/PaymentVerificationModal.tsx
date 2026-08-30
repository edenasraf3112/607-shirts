'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck, ShieldAlert, X, Search, RotateCcw, CheckCircle2, Loader2,
  AlertTriangle, ChevronDown, ChevronUp, Download, ClipboardCheck,
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { normalizePhone } from '@/lib/customerGroups'
import toast from 'react-hot-toast'

type OrderRow = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  items: any[]
  total: number
  discount_amount?: number | null
  delivery_method?: string | null
  notes?: string | null
  status: string
  created_at: string
}

type CheckStatus = 'not_checked' | 'paid_full' | 'paid_partial' | 'not_found' | 'overpaid' | 'cancelled'
type PaymentMethod = 'bit' | 'bank_transfer' | 'cash' | 'other' | null

type CheckState = {
  status: CheckStatus
  payment_method: PaymentMethod
  received_amount: number | null
  note: string
}

type SavedCheckState = CheckState & { verified_at: string | null }

type SortKey =
  | 'name-asc' | 'name-desc'
  | 'amount-asc' | 'amount-desc'
  | 'qty-asc' | 'qty-desc'
  | 'date-first' | 'date-last'
  | 'verified-first' | 'unverified-first'

type FilterKey =
  | 'all' | 'not_checked' | 'paid_full' | 'paid_partial' | 'not_found' | 'overpaid' | 'cancelled'
  | 'has_diff' | 'no_method' | 'bit' | 'bank_transfer' | 'with_note'
  | 'problems' | 'needs_attention'

type ExportScope = 'all' | 'visible' | 'problems' | 'bit' | 'bank_transfer'

const SHIPPING_FEE = 20 // matches the duplicated SHIPPING/SHIPPING_COST=20 constant used in the payment page & delivery exports
const DRAFT_KEY = 'nl_payment_checks_draft'

const EMPTY_CHECK: CheckState = { status: 'not_checked', payment_method: null, received_amount: null, note: '' }

const STATUS_LABELS: Record<CheckStatus, string> = {
  not_checked: 'לא נבדק',
  paid_full: 'שולם במלואו',
  paid_partial: 'שולם חלקית',
  not_found: 'לא נמצא תשלום',
  overpaid: 'שולם ביתר',
  cancelled: 'בוטל',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bit: 'Bit', bank_transfer: 'העברה בנקאית', cash: 'מזומן', other: 'אחר',
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-last', label: 'הזמנה אחרונה' },
  { value: 'date-first', label: 'הזמנה ראשונה' },
  { value: 'name-asc', label: 'שם א׳→ת׳' },
  { value: 'name-desc', label: 'שם ת׳→א׳' },
  { value: 'amount-desc', label: 'סכום ↓' },
  { value: 'amount-asc', label: 'סכום ↑' },
  { value: 'qty-desc', label: 'חולצות ↓' },
  { value: 'qty-asc', label: 'חולצות ↑' },
  { value: 'verified-first', label: 'מאומתים תחילה' },
  { value: 'unverified-first', label: 'לא מאומתים תחילה' },
]

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'not_checked', label: 'טרם נבדקו' },
  { value: 'paid_full', label: 'שולם במלואו' },
  { value: 'paid_partial', label: 'שולם חלקית' },
  { value: 'not_found', label: 'לא נמצא תשלום' },
  { value: 'overpaid', label: 'שולם ביתר' },
  { value: 'has_diff', label: 'עם הפרש כספי' },
  { value: 'no_method', label: 'ללא אמצעי תשלום' },
  { value: 'bit', label: 'Bit' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'with_note', label: 'עם הערה' },
  { value: 'cancelled', label: 'בוטלו' },
]

const EXPORT_SCOPES: { value: ExportScope; label: string }[] = [
  { value: 'all', label: 'כל הרשימה' },
  { value: 'visible', label: 'רק התוצאות המוצגות' },
  { value: 'problems', label: 'רק הלקוחות עם בעיות' },
  { value: 'bit', label: 'רק Bit' },
  { value: 'bank_transfer', label: 'רק העברות בנקאיות' },
]

function shirtsLabel(n: number) {
  return n === 1 ? 'חולצה אחת' : `${n} חולצות`
}

function itemQty(items: any[]) {
  return (items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)
}

function productsSubtotal(o: OrderRow) {
  return (o.total || 0) + (o.discount_amount || 0)
}

function expectedAmount(o: OrderRow) {
  return (o.total || 0) + (o.delivery_method === 'delivery' ? SHIPPING_FEE : 0)
}

function isException(c: CheckState, o: OrderRow): boolean {
  if (c.status === 'paid_partial' || c.status === 'not_found' || c.status === 'overpaid') return true
  if (c.status === 'paid_full') {
    if (c.received_amount != null && c.received_amount !== expectedAmount(o)) return true
    if (!c.payment_method) return true
  }
  return false
}

function matchesFilter(filterKey: FilterKey, o: OrderRow, c: CheckState): boolean {
  switch (filterKey) {
    case 'all': return true
    case 'not_checked': return c.status === 'not_checked'
    case 'paid_full': return c.status === 'paid_full'
    case 'paid_partial': return c.status === 'paid_partial'
    case 'not_found': return c.status === 'not_found'
    case 'overpaid': return c.status === 'overpaid'
    case 'cancelled': return c.status === 'cancelled'
    case 'has_diff': return c.received_amount != null && c.received_amount !== expectedAmount(o)
    case 'no_method': return c.status !== 'not_checked' && !c.payment_method
    case 'bit': return c.payment_method === 'bit'
    case 'bank_transfer': return c.payment_method === 'bank_transfer'
    case 'with_note': return !!c.note.trim()
    case 'problems': return isException(c, o)
    case 'needs_attention': return c.status === 'not_checked' || isException(c, o)
    default: return true
  }
}

function diffLabel(diff: number): string {
  if (diff === 0) return 'תקין'
  if (diff < 0) return `חסרים ${formatPrice(Math.abs(diff))}`
  return `שולמו ${formatPrice(diff)} ביתר`
}

export default function PaymentVerificationModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [savedChecks, setSavedChecks] = useState<Record<string, SavedCheckState>>({})
  const [draftChecks, setDraftChecks] = useState<Record<string, CheckState>>({})
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date-last')
  const [filterKey, setFilterKey] = useState<FilterKey>('all')

  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetAck, setResetAck] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [saveWarningCount, setSaveWarningCount] = useState(0)
  const [showCompletionReport, setShowCompletionReport] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<Record<string, CheckState> | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  function buildMaps(fetchedOrders: OrderRow[], fetchedChecks: any[]) {
    const saved: Record<string, SavedCheckState> = {}
    for (const o of fetchedOrders) saved[o.id] = { ...EMPTY_CHECK, verified_at: null }
    for (const c of fetchedChecks) {
      saved[c.order_id] = {
        status: (c.status || 'not_checked') as CheckStatus,
        payment_method: (c.payment_method || null) as PaymentMethod,
        received_amount: c.received_amount != null ? Number(c.received_amount) : null,
        note: c.note || '',
        verified_at: c.verified_at || null,
      }
    }
    return saved
  }

  function loadData() {
    setLoading(true)
    return fetch('/api/admin/payment-checks')
      .then(r => r.json())
      .then(d => {
        const fetchedOrders: OrderRow[] = d.orders || []
        setOrders(fetchedOrders)
        const saved = buildMaps(fetchedOrders, d.checks || [])
        setSavedChecks(saved)
        const draft: Record<string, CheckState> = {}
        for (const id of Object.keys(saved)) {
          const { verified_at, ...editable } = saved[id]
          draft[id] = editable
        }
        // check for a locally-saved draft before committing the fresh baseline as the working copy
        let draftFound: Record<string, CheckState> | null = null
        try {
          const raw = localStorage.getItem(DRAFT_KEY)
          if (raw) draftFound = JSON.parse(raw)
        } catch {}
        if (draftFound) {
          setPendingDraft(draftFound)
          setShowDraftPrompt(true)
        }
        setDraftChecks(draft)
      })
      .catch(() => toast.error('שגיאה בטעינת ההזמנות'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open) return
    loadData()
  }, [open])

  const orderById = useMemo(() => {
    const m: Record<string, OrderRow> = {}
    for (const o of orders) m[o.id] = o
    return m
  }, [orders])

  function getCheck(id: string): CheckState {
    return draftChecks[id] || EMPTY_CHECK
  }

  function setStatus(id: string, order: OrderRow, status: CheckStatus) {
    setDraftChecks(prev => {
      const c = prev[id] || EMPTY_CHECK
      const received_amount = status === 'paid_full' && c.received_amount == null ? expectedAmount(order) : c.received_amount
      return { ...prev, [id]: { ...c, status, received_amount } }
    })
  }

  function toggleChecked(id: string, order: OrderRow) {
    const c = getCheck(id)
    setStatus(id, order, c.status === 'paid_full' ? 'not_checked' : 'paid_full')
  }

  function setPaymentMethod(id: string, method: PaymentMethod) {
    setDraftChecks(prev => {
      const c = prev[id] || EMPTY_CHECK
      return { ...prev, [id]: { ...c, payment_method: c.payment_method === method ? null : method } }
    })
  }

  function setReceivedAmount(id: string, value: number | null) {
    setDraftChecks(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY_CHECK), received_amount: value } }))
  }

  function setNote(id: string, value: string) {
    setDraftChecks(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY_CHECK), note: value } }))
  }

  function toggleExpanded(id: string) {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const dirtyOrderIds = useMemo(() => {
    return orders
      .filter(o => {
        const a = draftChecks[o.id] || EMPTY_CHECK
        const b = savedChecks[o.id] || EMPTY_CHECK
        return (
          a.status !== b.status ||
          a.payment_method !== b.payment_method ||
          a.received_amount !== b.received_amount ||
          (a.note || '') !== (b.note || '')
        )
      })
      .map(o => o.id)
  }, [orders, draftChecks, savedChecks])

  const isDirty = dirtyOrderIds.length > 0

  // debounced local draft autosave — recovery only, never the real persistence layer
  useEffect(() => {
    if (!open || loading) return
    const t = setTimeout(() => {
      try {
        if (isDirty) localStorage.setItem(DRAFT_KEY, JSON.stringify(draftChecks))
        else localStorage.removeItem(DRAFT_KEY)
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [draftChecks, open, loading, isDirty])

  function restoreDraft() {
    if (pendingDraft) setDraftChecks(prev => ({ ...prev, ...pendingDraft }))
    setShowDraftPrompt(false)
    setPendingDraft(null)
  }

  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setShowDraftPrompt(false)
    setPendingDraft(null)
  }

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    const qDigits = normalizePhone(q)
    let rows = orders.filter(o => matchesFilter(filterKey, o, draftChecks[o.id] || EMPTY_CHECK))
    if (q) {
      rows = rows.filter(o => {
        if (o.customer_name?.toLowerCase().includes(q)) return true
        if (o.customer_email?.toLowerCase().includes(q)) return true
        if (o.id?.toLowerCase().includes(q)) return true
        if (qDigits && normalizePhone(o.customer_phone).includes(qDigits)) return true
        return false
      })
    }
    return [...rows].sort((a, b) => {
      const ca = (draftChecks[a.id]?.status ?? 'not_checked') !== 'not_checked' ? 1 : 0
      const cb = (draftChecks[b.id]?.status ?? 'not_checked') !== 'not_checked' ? 1 : 0
      switch (sortKey) {
        case 'name-asc': return a.customer_name.localeCompare(b.customer_name, 'he')
        case 'name-desc': return b.customer_name.localeCompare(a.customer_name, 'he')
        case 'amount-asc': return expectedAmount(a) - expectedAmount(b)
        case 'amount-desc': return expectedAmount(b) - expectedAmount(a)
        case 'qty-asc': return itemQty(a.items) - itemQty(b.items)
        case 'qty-desc': return itemQty(b.items) - itemQty(a.items)
        case 'date-first': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'date-last': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'verified-first': return cb - ca
        case 'unverified-first': return ca - cb
        default: return 0
      }
    })
  }, [orders, draftChecks, filterKey, search, sortKey])

  // Progress bar — always over ALL orders, never the filtered subset
  const progress = useMemo(() => {
    const total = orders.length
    const checked = orders.filter(o => (draftChecks[o.id]?.status ?? 'not_checked') !== 'not_checked').length
    const pct = total > 0 ? (checked / total) * 100 : 0
    return { checked, total, pct }
  }, [orders, draftChecks])

  // Global sticky summary — always over ALL orders, ignores search/filter
  const summary = useMemo(() => {
    let paidFullPeople = 0, paidFullShirts = 0, paidFullExpected = 0, paidFullReceived = 0
    let notCheckedCount = 0, notCheckedShirts = 0, notCheckedExpected = 0
    let exceptionsCount = 0

    const methodGroups: Record<string, { people: number; shirts: number; expected: number; received: number }> = {
      bit: { people: 0, shirts: 0, expected: 0, received: 0 },
      bank_transfer: { people: 0, shirts: 0, expected: 0, received: 0 },
      cash_other: { people: 0, shirts: 0, expected: 0, received: 0 },
      none: { people: 0, shirts: 0, expected: 0, received: 0 },
    }

    for (const o of orders) {
      const c = draftChecks[o.id] || EMPTY_CHECK
      const qty = itemQty(o.items)
      const expected = expectedAmount(o)

      if (c.status === 'not_checked') {
        notCheckedCount++
        notCheckedShirts += qty
        notCheckedExpected += expected
      }
      if (isException(c, o)) exceptionsCount++

      if (c.status === 'paid_full') {
        const received = c.received_amount ?? expected
        paidFullPeople++
        paidFullShirts += qty
        paidFullExpected += expected
        paidFullReceived += received

        const groupKey = c.payment_method === 'bit' ? 'bit'
          : c.payment_method === 'bank_transfer' ? 'bank_transfer'
          : (c.payment_method === 'cash' || c.payment_method === 'other') ? 'cash_other'
          : 'none'
        const g = methodGroups[groupKey]
        g.people++; g.shirts += qty; g.expected += expected; g.received += received
      }
    }

    const allOrdersShirts = orders.reduce((s, o) => s + itemQty(o.items), 0)
    const allOrdersExpected = orders.reduce((s, o) => s + expectedAmount(o), 0)

    return {
      paidFullPeople, paidFullShirts, paidFullExpected, paidFullReceived,
      paidFullDiff: paidFullReceived - paidFullExpected,
      notCheckedCount, notCheckedShirts, notCheckedExpected,
      exceptionsCount,
      methodGroups,
      allOrders: { count: orders.length, shirts: allOrdersShirts, expected: allOrdersExpected },
    }
  }, [orders, draftChecks])

  function bulkSetVisible(mark: boolean) {
    const ids = visibleOrders.map(o => o.id)
    if (ids.length === 0) return
    if (ids.length > 10) {
      const msg = mark ? `לסמן ${ids.length} לקוחות כשולמו במלואם?` : `לבטל סימון עבור ${ids.length} לקוחות?`
      if (!window.confirm(msg)) return
    }
    setDraftChecks(prev => {
      const next = { ...prev }
      for (const id of ids) {
        const o = orderById[id]
        const c = next[id] || EMPTY_CHECK
        next[id] = mark
          ? { ...c, status: 'paid_full', received_amount: c.received_amount ?? expectedAmount(o) }
          : { ...c, status: 'not_checked' }
      }
      return next
    })
  }

  async function doSave() {
    setSaving(true)
    try {
      const payload = dirtyOrderIds.map(id => {
        const c = draftChecks[id] || EMPTY_CHECK
        return { order_id: id, status: c.status, payment_method: c.payment_method, received_amount: c.received_amount, note: c.note }
      })
      const res = await fetch('/api/admin/payment-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks: payload }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'שגיאה')
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      await loadData()
      toast.success('בדיקת התשלומים נשמרה בהצלחה')
    } catch {
      toast.error('שמירת בדיקת התשלומים נכשלה. השינויים עדיין נמצאים בחלון. נסה שוב.')
    } finally {
      setSaving(false)
    }
  }

  function handleSaveClick() {
    if (dirtyOrderIds.length === 0) { toast('אין שינויים לשמירה'); return }
    const mismatchCount = dirtyOrderIds.filter(id => {
      const c = draftChecks[id] || EMPTY_CHECK
      const o = orderById[id]
      return c.status === 'paid_full' && c.received_amount != null && c.received_amount !== expectedAmount(o)
    }).length
    if (mismatchCount > 0) {
      setSaveWarningCount(mismatchCount)
      setShowSaveWarning(true)
      return
    }
    doSave()
  }

  const resetPreview = useMemo(() => {
    let marked = 0, notes = 0, methods = 0, amounts = 0
    const statusCounts: Partial<Record<CheckStatus, number>> = {}
    for (const o of orders) {
      const c = savedChecks[o.id] || EMPTY_CHECK
      if (c.status !== 'not_checked') {
        marked++
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
      }
      if (c.note?.trim()) notes++
      if (c.payment_method) methods++
      if (c.received_amount != null) amounts++
    }
    return { marked, notes, methods, amounts, statusCounts }
  }, [orders, savedChecks])

  async function handleReset() {
    setResetting(true)
    try {
      const res = await fetch('/api/admin/payment-checks', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'שגיאה')
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      setShowReset(false)
      setResetAck(false)
      await loadData()
      toast.success('בדיקת התשלומים אופסה בהצלחה')
    } catch {
      toast.error('איפוס בדיקת התשלומים נכשל. נסה שוב.')
    } finally {
      setResetting(false)
    }
  }

  const completionReport = useMemo(() => {
    let notChecked = 0, partial = 0, notFound = 0, overpaid = 0, diffMismatch = 0, noMethod = 0, unverifiedAmount = 0
    for (const o of orders) {
      const c = draftChecks[o.id] || EMPTY_CHECK
      if (c.status === 'not_checked') {
        notChecked++
        unverifiedAmount += expectedAmount(o)
        continue
      }
      if (c.status === 'paid_partial') partial++
      if (c.status === 'not_found') notFound++
      if (c.status === 'overpaid') overpaid++
      if (c.received_amount != null && c.received_amount !== expectedAmount(o)) diffMismatch++
      if (c.status !== 'cancelled' && !c.payment_method) noMethod++
    }
    const isClean = notChecked === 0 && partial === 0 && notFound === 0 && overpaid === 0 && diffMismatch === 0 && noMethod === 0
    return { notChecked, partial, notFound, overpaid, diffMismatch, noMethod, unverifiedAmount, isClean }
  }, [orders, draftChecks])

  function exportCSV(scope: ExportScope) {
    let rows: OrderRow[]
    if (scope === 'visible') rows = visibleOrders
    else if (scope === 'problems') rows = orders.filter(o => isException(draftChecks[o.id] || EMPTY_CHECK, o))
    else if (scope === 'bit' || scope === 'bank_transfer') rows = orders.filter(o => (draftChecks[o.id] || EMPTY_CHECK).payment_method === scope)
    else rows = orders

    const headers = ['מספר הזמנה', 'שם לקוח', 'טלפון', 'אימייל', 'כמות חולצות', 'סכום מוצרים', 'משלוח', 'הנחה', 'סכום סופי לתשלום', 'סכום שהתקבל', 'הפרש', 'אמצעי תשלום', 'סטטוס בדיקה', 'תאריך ושעת בדיקה', 'הערה']
    const csvRows = rows.map(o => {
      const c = draftChecks[o.id] || EMPTY_CHECK
      const saved = savedChecks[o.id]
      const expected = expectedAmount(o)
      const diff = c.received_amount != null ? c.received_amount - expected : ''
      const shipping = o.delivery_method === 'delivery' ? SHIPPING_FEE : 0
      return [
        o.id, o.customer_name, o.customer_phone, o.customer_email || '',
        itemQty(o.items), productsSubtotal(o), shipping, o.discount_amount || 0,
        expected, c.received_amount ?? '', diff,
        c.payment_method ? PAYMENT_METHOD_LABELS[c.payment_method] : '',
        STATUS_LABELS[c.status],
        saved?.verified_at ? formatDate(saved.verified_at) : '',
        c.note || '',
      ]
    })
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `payment_checks_${scope}_${Date.now()}.csv`; a.click()
    setExportMenuOpen(false)
  }

  function requestClose() {
    if (isDirty) { setShowCloseConfirm(true); return }
    setOpen(false)
  }

  function forceClose() {
    setShowCloseConfirm(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg"
      >
        <ShieldCheck size={15} /> בדיקת תשלומים
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal/60" onClick={requestClose}>
          <div
            className="bg-cream w-full sm:max-w-5xl sm:rounded-xl rounded-t-2xl h-[94vh] sm:h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header (sticky top) */}
            <div className="flex-shrink-0 border-b border-light-gray px-5 py-4 space-y-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">בדיקת תשלומים</h2>
                  <p className="text-xs text-warm-gray mt-0.5">עבור ידנית על Bit ועל חשבון הבנק וסמן מי שילם בוודאות</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowCompletionReport(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-light-gray text-charcoal text-xs hover:border-charcoal transition-colors rounded-lg"
                  >
                    <ClipboardCheck size={13} /> בדוק אם סיימתי
                  </button>
                  <button
                    onClick={() => setShowReset(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-brand text-xs hover:bg-red-50 transition-colors rounded-lg"
                  >
                    <RotateCcw size={13} /> איפוס
                  </button>
                  <button onClick={requestClose} className="p-1.5 text-warm-gray hover:text-charcoal"><X size={18} /></button>
                </div>
              </div>

              {/* Progress bar */}
              {orders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-warm-gray mb-1">
                    <span>נבדקו {progress.checked} מתוך {progress.total} לקוחות — {progress.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-light-gray rounded-full overflow-hidden">
                    <div className="h-full bg-charcoal rounded-full transition-all duration-300" style={{ width: `${progress.pct}%` }} />
                  </div>
                </div>
              )}

              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                <input
                  className="form-input pr-9 py-2 text-sm"
                  placeholder="חיפוש לפי שם, טלפון, מייל או מספר הזמנה..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterKey(f.value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${filterKey === f.value ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={() => setFilterKey(k => k === 'problems' ? 'all' : 'problems')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors font-medium ${filterKey === 'problems' ? 'bg-red-brand text-white border-red-brand' : 'border-red-200 text-red-brand hover:bg-red-50'}`}
                >
                  <AlertTriangle size={11} /> הצג רק בעיות
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-warm-gray flex-shrink-0">מיון:</span>
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as SortKey)}
                  className="border border-light-gray px-2 py-1.5 text-xs rounded-lg focus:outline-none focus:border-charcoal bg-white"
                  dir="rtl"
                >
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="text-warm-gray/40 mx-1">|</span>
                <button onClick={() => bulkSetVisible(true)} className="text-xs text-warm-gray hover:text-charcoal underline">
                  סמן את כל התוצאות המוצגות
                </button>
                <button onClick={() => bulkSetVisible(false)} className="text-xs text-warm-gray hover:text-charcoal underline">
                  בטל סימון לתוצאות המוצגות
                </button>
                <span className="text-warm-gray/40 mx-1">|</span>
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-warm-gray hover:text-charcoal"
                  >
                    <Download size={12} /> ייצוא דוח
                  </button>
                  {exportMenuOpen && (
                    <div className="absolute z-10 top-full mt-1 right-0 bg-white border border-light-gray rounded-lg shadow-lg overflow-hidden min-w-[180px]">
                      {EXPORT_SCOPES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => exportCSV(s.value)}
                          className="block w-full text-right px-3 py-2 text-xs text-charcoal hover:bg-cream-dark transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-warm-gray">מציג {visibleOrders.length} מתוך {orders.length} הזמנות (תוצאות מוצגות)</p>
            </div>

            {/* List (scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {loading ? (
                <div className="text-center py-16 text-warm-gray text-sm">טוען...</div>
              ) : visibleOrders.length === 0 ? (
                <div className="text-center py-16 text-warm-gray text-sm">אין תוצאות</div>
              ) : (
                <div className="space-y-2">
                  {visibleOrders.map(o => (
                    <PaymentCheckRow
                      key={o.id}
                      order={o}
                      check={getCheck(o.id)}
                      expanded={!!expandedIds[o.id]}
                      onToggleExpanded={() => toggleExpanded(o.id)}
                      onToggleChecked={() => toggleChecked(o.id, o)}
                      onSetStatus={s => setStatus(o.id, o, s)}
                      onSetMethod={m => setPaymentMethod(o.id, m)}
                      onSetAmount={v => setReceivedAmount(o.id, v)}
                      onSetNote={v => setNote(o.id, v)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sticky summary (sticky bottom, always over ALL orders) */}
            <div className="flex-shrink-0 border-t border-light-gray bg-white px-5 py-4 space-y-3 max-h-[38vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <SummaryTile label="שולם במלואו" value={`${summary.paidFullPeople} אנשים`} sub={shirtsLabel(summary.paidFullShirts)} />
                <SummaryTile label="אמור להתקבל" value={formatPrice(summary.paidFullExpected)} />
                <SummaryTile label="התקבל בפועל" value={formatPrice(summary.paidFullReceived)} />
                <SummaryTile
                  label="הפרש כולל"
                  value={diffLabel(summary.paidFullDiff)}
                  tone={summary.paidFullDiff === 0 ? 'ok' : summary.paidFullDiff < 0 ? 'bad' : 'warn'}
                />
                <SummaryTile label="טרם נבדקו" value={`${summary.notCheckedCount} אנשים`} />
                <SummaryTile label="חריגים" value={`${summary.exceptionsCount} אנשים`} tone={summary.exceptionsCount > 0 ? 'warn' : 'ok'} />
                <SummaryTile label="עדיין לא אומת" value={`${summary.notCheckedCount} | ${shirtsLabel(summary.notCheckedShirts)} | ${formatPrice(summary.notCheckedExpected)}`} />
                <SummaryTile label="כלל ההזמנות" value={`${summary.allOrders.count} | ${shirtsLabel(summary.allOrders.shirts)} | ${formatPrice(summary.allOrders.expected)}`} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-light-gray pt-3">
                <MethodTile label="Bit" g={summary.methodGroups.bit} />
                <MethodTile label="העברה בנקאית" g={summary.methodGroups.bank_transfer} />
                <MethodTile label="מזומן ואחר" g={summary.methodGroups.cash_other} />
                {summary.methodGroups.none.people > 0 && <MethodTile label="ללא אמצעי" g={summary.methodGroups.none} />}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 border-t border-light-gray pt-3">
                <span className="text-xs text-warm-gray">
                  {dirtyOrderIds.length > 0 ? `${dirtyOrderIds.length} שינויים שלא נשמרו` : 'אין שינויים שלא נשמרו'}
                </span>
                <button
                  onClick={handleSaveClick}
                  disabled={saving || !isDirty}
                  className="flex items-center gap-2 px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 disabled:opacity-50 transition-colors rounded-lg"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {saving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close confirm */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 p-4" onClick={() => setShowCloseConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()} dir="rtl">
            <p className="text-charcoal font-medium">יש שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCloseConfirm(false)} className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                חזור לעריכה
              </button>
              <button onClick={forceClose} className="px-4 py-2 bg-red-brand text-white text-sm hover:bg-red-brand/90 transition-colors rounded-lg">
                סגור ללא שמירה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-save diff warning */}
      {showSaveWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 p-4" onClick={() => setShowSaveWarning(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()} dir="rtl">
            <p className="text-charcoal font-medium">
              נמצאו תשלומים שסומנו כשולמו במלואם אך קיים בהם הפרש כספי ({saveWarningCount}). האם לשמור בכל זאת?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveWarning(false)} className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                חזור לבדיקה
              </button>
              <button
                onClick={() => { setShowSaveWarning(false); doSave() }}
                className="px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg"
              >
                שמור בכל זאת
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft restore prompt */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 p-4" onClick={discardDraft}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()} dir="rtl">
            <p className="text-charcoal font-medium">נמצאה טיוטה שלא נשמרה. לשחזר אותה או למחוק אותה?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={discardDraft} className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                מחק טיוטה
              </button>
              <button onClick={restoreDraft} className="px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
                שחזר טיוטה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion report */}
      {showCompletionReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 p-4" onClick={() => setShowCompletionReport(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="font-medium text-charcoal flex items-center gap-2"><ClipboardCheck size={16} /> בדיקת השלמה</h3>
            {completionReport.isClean ? (
              <p className="text-sm text-green-700">כל הלקוחות נבדקו. כל התשלומים שסומנו תואמים לסכומי ההזמנות.</p>
            ) : (
              <div className="text-sm text-warm-gray space-y-1">
                {completionReport.notChecked > 0 && <p>טרם נבדקו: {completionReport.notChecked} לקוחות</p>}
                {completionReport.partial > 0 && <p>תשלומים חלקיים: {completionReport.partial}</p>}
                {completionReport.notFound > 0 && <p>לא נמצא תשלום: {completionReport.notFound}</p>}
                {completionReport.overpaid > 0 && <p>שולם ביתר: {completionReport.overpaid}</p>}
                {completionReport.diffMismatch > 0 && <p>תשלומים עם הפרש: {completionReport.diffMismatch}</p>}
                {completionReport.noMethod > 0 && <p>ללא אמצעי תשלום: {completionReport.noMethod}</p>}
                <p className="pt-1 font-medium text-charcoal">סכום שעדיין לא אומת: {formatPrice(completionReport.unverifiedAmount)}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCompletionReport(false)} className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg">
                סגור
              </button>
              {!completionReport.isClean && (
                <button
                  onClick={() => { setFilterKey('needs_attention'); setShowCompletionReport(false) }}
                  className="px-4 py-2 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg"
                >
                  הצג את הלקוחות שדורשים טיפול
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {showReset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/70 p-4" onClick={() => { setShowReset(false); setResetAck(false) }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-2 text-red-brand">
              <ShieldAlert size={20} />
              <p className="font-medium">איפוס בדיקת התשלומים</p>
            </div>
            <div className="text-sm text-warm-gray space-y-1 bg-cream rounded-lg p-3">
              <p>יימחקו:</p>
              <p>{resetPreview.marked} סימונים</p>
              <p>{resetPreview.notes} הערות</p>
              <p>{resetPreview.methods} אמצעי תשלום שנבחרו</p>
              <p>{resetPreview.amounts} סכומים שהוזנו</p>
              {Object.entries(resetPreview.statusCounts).map(([status, count]) => (
                <p key={status} className="text-warm-gray/80">{STATUS_LABELS[status as CheckStatus]}: {count}</p>
              ))}
            </div>
            <p className="text-sm text-warm-gray">
              האם אתה בטוח שברצונך לאפס את בדיקת התשלומים? פעולה זו תמחק את כל הסימונים וההערות שנשמרו ולא ניתן יהיה לשחזר אותם.
            </p>
            <label className="flex items-start gap-2 text-sm text-charcoal cursor-pointer">
              <input type="checkbox" checked={resetAck} onChange={e => setResetAck(e.target.checked)} className="mt-0.5" />
              אני מבין שהאיפוס ימחק את כל נתוני בדיקת התשלומים.
            </label>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowReset(false); setResetAck(false) }}
                className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal transition-colors rounded-lg"
              >
                ביטול
              </button>
              <button
                onClick={handleReset}
                disabled={!resetAck || resetting}
                className="px-4 py-2 bg-red-brand text-white text-sm hover:bg-red-brand/90 disabled:opacity-50 transition-colors rounded-lg"
              >
                {resetting ? 'מאפס...' : 'אפס את בדיקת התשלומים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SummaryTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'ok' | 'bad' | 'warn' }) {
  const toneClass = tone === 'ok' ? 'text-green-700' : tone === 'bad' ? 'text-red-brand' : tone === 'warn' ? 'text-amber-700' : 'text-charcoal'
  return (
    <div className="bg-cream rounded-lg px-3 py-2">
      <p className="text-warm-gray">{label}</p>
      <p className={`font-medium ${toneClass}`}>{value}</p>
      {sub && <p className="text-warm-gray text-[11px]">{sub}</p>}
    </div>
  )
}

function MethodTile({ label, g }: { label: string; g: { people: number; shirts: number; expected: number; received: number } }) {
  if (g.people === 0) return (
    <div className="bg-cream rounded-lg px-3 py-2 opacity-50">
      <p className="text-warm-gray">{label}</p>
      <p className="text-charcoal">0 אנשים</p>
    </div>
  )
  return (
    <div className="bg-cream rounded-lg px-3 py-2">
      <p className="text-warm-gray">{label}</p>
      <p className="text-charcoal font-medium">{g.people} אנשים | {shirtsLabel(g.shirts)} | {formatPrice(g.received)}</p>
    </div>
  )
}

function PaymentCheckRow({ order, check, expanded, onToggleExpanded, onToggleChecked, onSetStatus, onSetMethod, onSetAmount, onSetNote }: {
  order: OrderRow
  check: CheckState
  expanded: boolean
  onToggleExpanded: () => void
  onToggleChecked: () => void
  onSetStatus: (s: CheckStatus) => void
  onSetMethod: (m: PaymentMethod) => void
  onSetAmount: (v: number | null) => void
  onSetNote: (v: string) => void
}) {
  const qty = itemQty(order.items)
  const subtotal = productsSubtotal(order)
  const discount = order.discount_amount || 0
  const shipping = order.delivery_method === 'delivery' ? SHIPPING_FEE : 0
  const expected = expectedAmount(order)
  const exception = isException(check, order)
  const diff = check.received_amount != null ? check.received_amount - expected : null

  return (
    <div className={`rounded-lg border transition-colors ${check.status === 'paid_full' ? 'bg-green-50/60 border-green-200' : exception ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-light-gray'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-3.5">
        <label className="flex items-start sm:items-center gap-3 flex-1 min-w-0 cursor-pointer">
          <input
            type="checkbox"
            checked={check.status === 'paid_full'}
            onChange={onToggleChecked}
            className="w-5 h-5 mt-0.5 sm:mt-0 flex-shrink-0 accent-charcoal cursor-pointer"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-charcoal text-sm">{order.customer_name}</span>
              <span className="text-xs text-warm-gray">{formatDate(order.created_at)}</span>
              {exception && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <AlertTriangle size={9} /> דורש טיפול
                </span>
              )}
            </div>
            <div className="text-xs text-warm-gray mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span dir="ltr">{order.customer_phone}</span>
              {order.customer_email && <span className="truncate">{order.customer_email}</span>}
              <span className="text-warm-gray/70">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="text-xs text-warm-gray mt-1">
              {shirtsLabel(qty)} | מוצרים: {formatPrice(subtotal)}
              {discount > 0 && <> | הנחה: {formatPrice(discount)}</>}
              {shipping > 0 && <> | משלוח: {formatPrice(shipping)}</>}
              {' '}| <span className="font-medium text-charcoal">סה״כ לתשלום: {formatPrice(expected)}</span>
            </div>
          </div>
        </label>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-shrink-0">
          {(['bit', 'bank_transfer', 'cash', 'other'] as const).map(m => (
            <button
              key={m}
              onClick={() => onSetMethod(m)}
              className={`px-2 py-1 text-[11px] rounded-full border transition-colors ${check.payment_method === m ? 'bg-charcoal text-cream border-charcoal' : 'border-light-gray text-warm-gray hover:border-charcoal'}`}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-warm-gray hover:text-charcoal transition-colors"
          >
            פרטים נוספים {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 sm:px-3.5 pb-3.5 pt-0 space-y-2 border-t border-light-gray/70 mt-1">
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <div>
              <label className="text-[11px] text-warm-gray block mb-1">סטטוס בדיקה</label>
              <select
                value={check.status}
                onChange={e => onSetStatus(e.target.value as CheckStatus)}
                className="border border-light-gray px-2 py-1.5 text-xs rounded-lg focus:outline-none focus:border-charcoal bg-white"
                dir="rtl"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-warm-gray block mb-1">סכום שהתקבל בפועל</label>
              <input
                type="number"
                value={check.received_amount ?? ''}
                onChange={e => onSetAmount(e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder={String(expected)}
                className="w-28 border border-light-gray px-2 py-1.5 text-xs rounded-lg focus:outline-none focus:border-charcoal"
                dir="ltr"
              />
            </div>
            {diff != null && (
              <div>
                <label className="text-[11px] text-warm-gray block mb-1">הפרש</label>
                <p className={`text-xs font-medium ${diff === 0 ? 'text-green-700' : diff < 0 ? 'text-red-brand' : 'text-amber-700'}`}>
                  {diffLabel(diff)}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] text-warm-gray block mb-1">הערה</label>
            <textarea
              value={check.note}
              onChange={e => onSetNote(e.target.value)}
              placeholder="לדוגמה: חסרים 20₪, לבדוק שוב מחר..."
              rows={2}
              className="w-full border border-light-gray px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:border-charcoal resize-none"
              dir="rtl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
