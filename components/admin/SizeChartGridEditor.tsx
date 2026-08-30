'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Copy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Bold, Underline, AlignRight, AlignCenter, AlignLeft, Undo2, Redo2, Eraser, Grid3X3,
} from 'lucide-react'
import type { SizeChartCell, SizeChartCellStyle, SizeChartCellTag, SizeChartData } from '@/lib/supabase'
import { resolveCellStyle, cellStyleToCss } from '@/lib/sizeChartStyle'
import { sanitizeCellValue, MAX_ROWS, MAX_COLS } from '@/lib/sizeChartValidation'

type Range = { r0: number; c0: number; r1: number; c1: number }

const DEFAULT_COL_WIDTH = 110
const DEFAULT_ROW_HEIGHT = 40
const GUTTER_SIZE = 32
const TOOLBAR_BTN = 'inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-light-gray text-charcoal hover:border-charcoal disabled:opacity-40 transition-colors'

function cloneData(data: SizeChartData): SizeChartData {
  return JSON.parse(JSON.stringify(data))
}

function columnLabel(i: number): string {
  let n = i
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

function normalizeRange(a: { r: number; c: number }, b: { r: number; c: number }): Range {
  return { r0: Math.min(a.r, b.r), r1: Math.max(a.r, b.r), c0: Math.min(a.c, b.c), c1: Math.max(a.c, b.c) }
}

function inRange(range: Range | null, r: number, c: number): boolean {
  if (!range) return false
  return r >= range.r0 && r <= range.r1 && c >= range.c0 && c <= range.c1
}

export default function SizeChartGridEditor({ data, onChange }: { data: SizeChartData; onChange: (data: SizeChartData) => void }) {
  const rows = data.rows
  const numRows = rows.length
  const numCols = rows[0]?.length || 0

  const [selection, setSelection] = useState<Range | null>(null)
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [liveColWidths, setLiveColWidths] = useState<number[]>(data.colWidths || [])
  const [liveRowHeights, setLiveRowHeights] = useState<number[]>(data.rowHeights || [])

  const anchorRef = useRef<{ r: number; c: number } | null>(null)
  const mouseDownCellRef = useRef<{ r: number; c: number } | null>(null)
  const draggingRef = useRef(false)
  const suppressEditRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const undoStack = useRef<SizeChartData[]>([])
  const redoStack = useRef<SizeChartData[]>([])

  useEffect(() => {
    setLiveColWidths(data.colWidths || [])
    setLiveRowHeights(data.rowHeights || [])
  }, [data.colWidths, data.rowHeights])

  useEffect(() => {
    function onWindowMouseUp() {
      if (draggingRef.current) draggingRef.current = false
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [])

  function commit(newData: SizeChartData) {
    undoStack.current.push(cloneData(data))
    if (undoStack.current.length > 50) undoStack.current.shift()
    redoStack.current = []
    onChange(newData)
  }

  function undo() {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(cloneData(data))
    onChange(prev)
  }

  function redo() {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(cloneData(data))
    onChange(next)
  }

  function updateCellValue(r: number, c: number, value: string) {
    const newData = cloneData(data)
    newData.rows[r][c] = { ...newData.rows[r][c], value: sanitizeCellValue(value) }
    commit(newData)
  }

  function applyStyleToSelection(patch: Partial<SizeChartCellStyle>) {
    if (!selection) return
    const newData = cloneData(data)
    for (let r = selection.r0; r <= selection.r1; r++) {
      for (let c = selection.c0; c <= selection.c1; c++) {
        const cell = newData.rows[r][c]
        newData.rows[r][c] = { ...cell, style: { ...cell.style, ...patch } }
      }
    }
    commit(newData)
  }

  function clearSelectionContent() {
    if (!selection) return
    const newData = cloneData(data)
    for (let r = selection.r0; r <= selection.r1; r++) {
      for (let c = selection.c0; c <= selection.c1; c++) {
        newData.rows[r][c] = { ...newData.rows[r][c], value: '' }
      }
    }
    commit(newData)
  }

  // ---- Row / column structural operations ----

  function addRow(afterIndex: number) {
    if (numRows >= MAX_ROWS) { toast.error(`מספר השורות המרבי הוא ${MAX_ROWS}`); return }
    const newData = cloneData(data)
    const emptyRow: SizeChartCell[] = Array.from({ length: numCols || 1 }, () => ({ value: '' }))
    newData.rows.splice(afterIndex + 1, 0, emptyRow)
    if (newData.rowHeights?.length) newData.rowHeights.splice(afterIndex + 1, 0, DEFAULT_ROW_HEIGHT)
    commit(newData)
  }

  function deleteRow(index: number) {
    if (numRows <= 1) { toast.error('חייבת להישאר לפחות שורה אחת'); return }
    const newData = cloneData(data)
    newData.rows.splice(index, 1)
    newData.rowHeights?.splice(index, 1)
    commit(newData)
    setSelection(null)
  }

  function duplicateRow(index: number) {
    if (numRows >= MAX_ROWS) { toast.error(`מספר השורות המרבי הוא ${MAX_ROWS}`); return }
    const newData = cloneData(data)
    const copy = newData.rows[index].map((c: SizeChartCell) => ({ ...c, style: { ...c.style } }))
    newData.rows.splice(index + 1, 0, copy)
    if (newData.rowHeights?.length) newData.rowHeights.splice(index + 1, 0, newData.rowHeights[index] ?? DEFAULT_ROW_HEIGHT)
    commit(newData)
  }

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= numRows) return
    const newData = cloneData(data)
    ;[newData.rows[index], newData.rows[target]] = [newData.rows[target], newData.rows[index]]
    if (newData.rowHeights?.length) {
      ;[newData.rowHeights[index], newData.rowHeights[target]] = [newData.rowHeights[target], newData.rowHeights[index]]
    }
    commit(newData)
    setSelection({ r0: target, r1: target, c0: 0, c1: numCols - 1 })
  }

  function addCol(afterIndex: number) {
    if (numCols >= MAX_COLS) { toast.error(`מספר העמודות המרבי הוא ${MAX_COLS}`); return }
    const newData = cloneData(data)
    newData.rows.forEach((row: SizeChartCell[]) => row.splice(afterIndex + 1, 0, { value: '' }))
    if (newData.colWidths?.length) newData.colWidths.splice(afterIndex + 1, 0, DEFAULT_COL_WIDTH)
    commit(newData)
  }

  function deleteCol(index: number) {
    if (numCols <= 1) { toast.error('חייבת להישאר לפחות עמודה אחת'); return }
    const newData = cloneData(data)
    newData.rows.forEach((row: SizeChartCell[]) => row.splice(index, 1))
    newData.colWidths?.splice(index, 1)
    commit(newData)
    setSelection(null)
  }

  function duplicateCol(index: number) {
    if (numCols >= MAX_COLS) { toast.error(`מספר העמודות המרבי הוא ${MAX_COLS}`); return }
    const newData = cloneData(data)
    newData.rows.forEach((row: SizeChartCell[]) => {
      const copy = { ...row[index], style: { ...row[index].style } }
      row.splice(index + 1, 0, copy)
    })
    if (newData.colWidths?.length) newData.colWidths.splice(index + 1, 0, newData.colWidths[index] ?? DEFAULT_COL_WIDTH)
    commit(newData)
  }

  function moveCol(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= numCols) return
    const newData = cloneData(data)
    newData.rows.forEach((row: SizeChartCell[]) => { ;[row[index], row[target]] = [row[target], row[index]] })
    if (newData.colWidths?.length) {
      ;[newData.colWidths[index], newData.colWidths[target]] = [newData.colWidths[target], newData.colWidths[index]]
    }
    commit(newData)
    setSelection({ r0: 0, r1: numRows - 1, c0: target, c1: target })
  }

  // ---- Copy / paste ----

  async function handleCopy() {
    if (!selection) return
    const lines: string[] = []
    for (let r = selection.r0; r <= selection.r1; r++) {
      const vals: string[] = []
      for (let c = selection.c0; c <= selection.c1; c++) vals.push(rows[r]?.[c]?.value ?? '')
      lines.push(vals.join('\t'))
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('הועתק')
    } catch {
      toast.error('לא ניתן להעתיק ללוח')
    }
  }

  async function handlePaste() {
    if (!selection) return
    let text = ''
    try {
      text = await navigator.clipboard.readText()
    } catch {
      toast.error('אין גישה ללוח ההעתקה')
      return
    }
    if (!text) return
    const lines = text.replace(/\r/g, '').split('\n')
    while (lines.length && lines[lines.length - 1] === '') lines.pop()
    const grid = lines.map(l => l.split('\t'))
    if (grid.length === 0) return

    const newData = cloneData(data)
    const startR = selection.r0
    const startC = selection.c0
    const neededRows = Math.min(startR + grid.length, MAX_ROWS)
    const neededCols = Math.min(startC + Math.max(...grid.map(r => r.length)), MAX_COLS)

    while (newData.rows.length < neededRows) {
      newData.rows.push(Array.from({ length: newData.rows[0]?.length || 1 }, () => ({ value: '' })))
    }
    if ((newData.rows[0]?.length || 0) < neededCols) {
      newData.rows.forEach((row: SizeChartCell[]) => {
        while (row.length < neededCols) row.push({ value: '' })
      })
    }
    grid.forEach((rowVals, ri) => {
      const r = startR + ri
      if (r >= newData.rows.length) return
      rowVals.forEach((val, ci) => {
        const c = startC + ci
        if (c >= newData.rows[r].length) return
        newData.rows[r][c] = { ...newData.rows[r][c], value: sanitizeCellValue(val) }
      })
    })
    commit(newData)
  }

  // ---- Selection / editing interaction ----

  function beginEdit(r: number, c: number) {
    setEditingCell({ r, c })
    setDraftValue(rows[r][c].value)
  }

  function commitEdit() {
    if (!editingCell) return
    updateCellValue(editingCell.r, editingCell.c, draftValue)
    setEditingCell(null)
  }

  function cancelEdit() {
    setEditingCell(null)
  }

  function onCellMouseDown(r: number, c: number, e: React.MouseEvent) {
    containerRef.current?.focus()
    if (editingCell && (editingCell.r !== r || editingCell.c !== c)) commitEdit()
    if (e.shiftKey && anchorRef.current) {
      suppressEditRef.current = true
      setSelection(normalizeRange(anchorRef.current, { r, c }))
      setEditingCell(null)
      return
    }
    suppressEditRef.current = false
    anchorRef.current = { r, c }
    mouseDownCellRef.current = { r, c }
    draggingRef.current = false
    setSelection({ r0: r, r1: r, c0: c, c1: c })
  }

  function onCellMouseEnter(r: number, c: number, e: React.MouseEvent) {
    if (e.buttons === 1 && anchorRef.current && mouseDownCellRef.current) {
      if (r !== mouseDownCellRef.current.r || c !== mouseDownCellRef.current.c) {
        draggingRef.current = true
        setEditingCell(null)
      }
      setSelection(normalizeRange(anchorRef.current, { r, c }))
    }
  }

  function onCellMouseUp(r: number, c: number) {
    if (!draggingRef.current && !suppressEditRef.current && anchorRef.current && anchorRef.current.r === r && anchorRef.current.c === c) {
      beginEdit(r, c)
    }
    draggingRef.current = false
  }

  function selectRow(r: number, shift: boolean) {
    if (editingCell) commitEdit()
    setEditingCell(null)
    if (shift && anchorRef.current) {
      setSelection(prev => prev ? { ...normalizeRange({ r: prev.r0, c: 0 }, { r, c: numCols - 1 }) } : { r0: r, r1: r, c0: 0, c1: numCols - 1 })
    } else {
      anchorRef.current = { r, c: 0 }
      setSelection({ r0: r, r1: r, c0: 0, c1: numCols - 1 })
    }
  }

  function selectCol(c: number, shift: boolean) {
    if (editingCell) commitEdit()
    setEditingCell(null)
    if (shift && anchorRef.current) {
      setSelection(prev => prev ? { ...normalizeRange({ r: 0, c: prev.c0 }, { r: numRows - 1, c }) } : { r0: 0, r1: numRows - 1, c0: c, c1: c })
    } else {
      anchorRef.current = { r: 0, c }
      setSelection({ r0: 0, r1: numRows - 1, c0: c, c1: c })
    }
  }

  function selectAll() {
    if (editingCell) commitEdit()
    setEditingCell(null)
    setSelection({ r0: 0, r1: numRows - 1, c0: 0, c1: numCols - 1 })
  }

  function onContainerKeyDown(e: React.KeyboardEvent) {
    const meta = e.ctrlKey || e.metaKey
    if (editingCell) return
    if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
    if (meta && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) { e.preventDefault(); redo(); return }
    if (meta && e.key.toLowerCase() === 'c') { e.preventDefault(); handleCopy(); return }
    if (meta && e.key.toLowerCase() === 'v') { e.preventDefault(); handlePaste(); return }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selection) { e.preventDefault(); clearSelectionContent(); return }
    if (e.key === 'Enter' && selection) { e.preventDefault(); beginEdit(selection.r0, selection.c0); return }
    if (selection && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      let { r0: r, c0: c } = selection
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1)
      if (e.key === 'ArrowDown') r = Math.min(numRows - 1, r + 1)
      if (e.key === 'ArrowLeft') c = Math.min(numCols - 1, c + 1)
      if (e.key === 'ArrowRight') c = Math.max(0, c - 1)
      anchorRef.current = { r, c }
      setSelection({ r0: r, r1: r, c0: c, c1: c })
    }
  }

  function onEditTextareaKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      updateCellValue(r, c, draftValue)
      setEditingCell(null)
      const nextR = Math.min(numRows - 1, r + 1)
      anchorRef.current = { r: nextR, c }
      setSelection({ r0: nextR, r1: nextR, c0: c, c1: c })
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      updateCellValue(r, c, draftValue)
      setEditingCell(null)
      const dir = e.shiftKey ? 1 : -1
      const nextC = Math.max(0, Math.min(numCols - 1, c + dir))
      anchorRef.current = { r, c: nextC }
      setSelection({ r0: r, r1: r, c0: nextC, c1: nextC })
    }
  }

  // ---- Resize ----

  function startColResize(e: React.MouseEvent, index: number) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startWidth = liveColWidths[index] ?? DEFAULT_COL_WIDTH
    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX
      const newWidth = Math.max(50, Math.min(400, startWidth + delta))
      setLiveColWidths(w => {
        const copy = [...w]
        while (copy.length <= index) copy.push(DEFAULT_COL_WIDTH)
        copy[index] = newWidth
        return copy
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setLiveColWidths(w => {
        const newData = cloneData(data)
        newData.colWidths = w
        commit(newData)
        return w
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startRowResize(e: React.MouseEvent, index: number) {
    e.preventDefault(); e.stopPropagation()
    const startY = e.clientY
    const startHeight = liveRowHeights[index] ?? DEFAULT_ROW_HEIGHT
    function onMove(ev: MouseEvent) {
      const delta = ev.clientY - startY
      const newHeight = Math.max(28, Math.min(200, startHeight + delta))
      setLiveRowHeights(h => {
        const copy = [...h]
        while (copy.length <= index) copy.push(DEFAULT_ROW_HEIGHT)
        copy[index] = newHeight
        return copy
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setLiveRowHeights(h => {
        const newData = cloneData(data)
        newData.rowHeights = h
        commit(newData)
        return h
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ---- Derived selection info for contextual toolbar ----

  const isFullRowSelected = !!selection && selection.c0 === 0 && selection.c1 === numCols - 1 && selection.r0 === selection.r1
  const isFullColSelected = !!selection && selection.r0 === 0 && selection.r1 === numRows - 1 && selection.c0 === selection.c1
  const activeRowIndex = isFullRowSelected ? selection!.r0 : null
  const activeColIndex = isFullColSelected ? selection!.c0 : null

  const colWidths = Array.from({ length: numCols }, (_, i) => liveColWidths[i] ?? DEFAULT_COL_WIDTH)
  const rowHeights = Array.from({ length: numRows }, (_, i) => liveRowHeights[i] ?? DEFAULT_ROW_HEIGHT)

  const gridTemplateColumns = `${GUTTER_SIZE}px ${colWidths.map(w => `${w}px`).join(' ')}`
  const gridTemplateRows = `${GUTTER_SIZE}px ${rowHeights.map(h => `${h}px`).join(' ')}`

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-cream-dark rounded-lg border border-light-gray text-charcoal">
        <button type="button" title="בטל פעולה (Ctrl+Z)" aria-label="בטל פעולה" onClick={undo} className={TOOLBAR_BTN}><Undo2 size={14} /></button>
        <button type="button" title="בצע מחדש (Ctrl+Y)" aria-label="בצע מחדש" onClick={redo} className={TOOLBAR_BTN}><Redo2 size={14} /></button>
        <div className="w-px h-5 bg-light-gray mx-1" />

        <select
          disabled={!selection}
          title="סוג תוכן (היררכיה בטבלה)"
          className="text-xs border border-light-gray rounded px-1.5 py-1.5 bg-white disabled:opacity-40"
          value=""
          onChange={e => { if (e.target.value) applyStyleToSelection({ tag: e.target.value as SizeChartCellTag }) }}
        >
          <option value="">סוג תוכן…</option>
          <option value="normal">רגיל</option>
          <option value="h1">H1 — כותרת ראשית</option>
          <option value="h2">H2 — כותרת עמודה/שורה</option>
          <option value="h3">H3 — כותרת משנית</option>
        </select>

        <input
          type="number"
          disabled={!selection}
          title="גודל טקסט"
          aria-label="גודל טקסט"
          min={8} max={32}
          className="w-14 text-xs border border-light-gray rounded px-1.5 py-1.5 bg-white disabled:opacity-40"
          placeholder="גודל"
          onChange={e => e.target.value && applyStyleToSelection({ fontSize: parseInt(e.target.value) })}
        />

        <select
          disabled={!selection}
          title="פונט"
          className="text-xs border border-light-gray rounded px-1.5 py-1.5 bg-white disabled:opacity-40"
          defaultValue=""
          onChange={e => { if (e.target.value) applyStyleToSelection({ fontFamily: e.target.value as 'serif' | 'sans' }) }}
        >
          <option value="">פונט…</option>
          <option value="sans">Inter (רגיל)</option>
          <option value="serif">Cormorant (כותרת)</option>
        </select>

        <select
          disabled={!selection}
          title="משקל פונט"
          className="text-xs border border-light-gray rounded px-1.5 py-1.5 bg-white disabled:opacity-40"
          defaultValue=""
          onChange={e => { if (e.target.value) applyStyleToSelection({ fontWeight: parseInt(e.target.value) as 400 | 500 | 700 }) }}
        >
          <option value="">משקל…</option>
          <option value="400">רגיל</option>
          <option value="500">בינוני</option>
          <option value="700">מודגש</option>
        </select>

        <button type="button" disabled={!selection} title="מודגש" aria-label="טקסט מודגש" onClick={() => applyStyleToSelection({ bold: true })} className={TOOLBAR_BTN}><Bold size={14} /></button>
        <button type="button" disabled={!selection} title="קו תחתון" aria-label="קו תחתון" onClick={() => applyStyleToSelection({ underline: true })} className={TOOLBAR_BTN}><Underline size={14} /></button>

        <div className="w-px h-5 bg-light-gray mx-1" />
        <button type="button" disabled={!selection} title="יישור לימין" aria-label="יישור לימין" onClick={() => applyStyleToSelection({ align: 'right' })} className={TOOLBAR_BTN}><AlignRight size={14} /></button>
        <button type="button" disabled={!selection} title="יישור למרכז" aria-label="יישור למרכז" onClick={() => applyStyleToSelection({ align: 'center' })} className={TOOLBAR_BTN}><AlignCenter size={14} /></button>
        <button type="button" disabled={!selection} title="יישור לשמאל" aria-label="יישור לשמאל" onClick={() => applyStyleToSelection({ align: 'left' })} className={TOOLBAR_BTN}><AlignLeft size={14} /></button>

        <div className="w-px h-5 bg-light-gray mx-1" />
        <label className="flex items-center gap-1 text-xs text-warm-gray" title="צבע טקסט">
          <input type="color" disabled={!selection} onChange={e => applyStyleToSelection({ color: e.target.value })} className="w-6 h-6 border-0 p-0 bg-transparent disabled:opacity-40" />
          טקסט
        </label>
        <label className="flex items-center gap-1 text-xs text-warm-gray" title="צבע רקע">
          <input type="color" disabled={!selection} onChange={e => applyStyleToSelection({ bg: e.target.value })} className="w-6 h-6 border-0 p-0 bg-transparent disabled:opacity-40" />
          רקע
        </label>
        <button type="button" disabled={!selection} title="נקה רקע" onClick={() => applyStyleToSelection({ bg: undefined })} className={`${TOOLBAR_BTN} text-[10px] px-1.5 w-auto`}>נקה רקע</button>

        <div className="w-px h-5 bg-light-gray mx-1" />
        <button type="button" disabled={!selection} title="הצג גבול עמודה" onClick={() => applyStyleToSelection({ border: true })} className={`${TOOLBAR_BTN} text-[10px] px-1.5 w-auto`}>גבול</button>
        <button type="button" disabled={!selection} title="הסר גבול עמודה" onClick={() => applyStyleToSelection({ border: false })} className={`${TOOLBAR_BTN} text-[10px] px-1.5 w-auto`}>ללא גבול</button>

        <select
          disabled={!selection}
          title="ריווח פנימי"
          className="text-xs border border-light-gray rounded px-1.5 py-1.5 bg-white disabled:opacity-40"
          defaultValue=""
          onChange={e => { if (e.target.value) applyStyleToSelection({ padding: e.target.value as 'sm' | 'md' | 'lg' }) }}
        >
          <option value="">ריווח…</option>
          <option value="sm">קטן</option>
          <option value="md">בינוני</option>
          <option value="lg">גדול</option>
        </select>

        <div className="w-px h-5 bg-light-gray mx-1" />
        <button type="button" disabled={!selection} title="נקה תוכן תא" aria-label="נקה תוכן" onClick={clearSelectionContent} className={TOOLBAR_BTN}><Eraser size={14} /></button>
        <button type="button" title="בחר הכל" aria-label="בחר את כל הטבלה" onClick={selectAll} className={TOOLBAR_BTN}><Grid3X3 size={14} /></button>
      </div>

      {/* Row / column structural toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-warm-gray">
        <button type="button" onClick={() => addRow(numRows - 1)} className="flex items-center gap-1 border border-light-gray rounded px-2 py-1 hover:border-charcoal hover:text-charcoal"><Plus size={12} /> הוסף שורה</button>
        <button type="button" onClick={() => addCol(numCols - 1)} className="flex items-center gap-1 border border-light-gray rounded px-2 py-1 hover:border-charcoal hover:text-charcoal"><Plus size={12} /> הוסף עמודה</button>

        {activeRowIndex !== null && (
          <span className="flex items-center gap-1 bg-white border border-light-gray rounded px-2 py-1">
            שורה {activeRowIndex + 1}:
            <button type="button" title="שכפל שורה" aria-label="שכפל שורה" onClick={() => duplicateRow(activeRowIndex)}><Copy size={12} /></button>
            <button type="button" title="הזז למעלה" aria-label="הזז שורה למעלה" onClick={() => moveRow(activeRowIndex, -1)}><ArrowUp size={12} /></button>
            <button type="button" title="הזז למטה" aria-label="הזז שורה למטה" onClick={() => moveRow(activeRowIndex, 1)}><ArrowDown size={12} /></button>
            <button type="button" title="מחק שורה" aria-label="מחק שורה" onClick={() => deleteRow(activeRowIndex)} className="text-red-500"><Trash2 size={12} /></button>
          </span>
        )}
        {activeColIndex !== null && (
          <span className="flex items-center gap-1 bg-white border border-light-gray rounded px-2 py-1">
            עמודה {columnLabel(activeColIndex)}:
            <button type="button" title="שכפל עמודה" aria-label="שכפל עמודה" onClick={() => duplicateCol(activeColIndex)}><Copy size={12} /></button>
            <button type="button" title="הזז ימינה" aria-label="הזז עמודה ימינה" onClick={() => moveCol(activeColIndex, -1)}><ArrowRight size={12} /></button>
            <button type="button" title="הזז שמאלה" aria-label="הזז עמודה שמאלה" onClick={() => moveCol(activeColIndex, 1)}><ArrowLeft size={12} /></button>
            <button type="button" title="מחק עמודה" aria-label="מחק עמודה" onClick={() => deleteCol(activeColIndex)} className="text-red-500"><Trash2 size={12} /></button>
          </span>
        )}
      </div>

      <p className="text-[11px] text-warm-gray">
        בחר תא, שורה או עמודה כדי לערוך את העיצוב. שינויים בטבלה יתעדכנו בכל המוצרים שמשתמשים בה.
      </p>

      {/* Grid */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onContainerKeyDown}
        className="overflow-auto border border-light-gray rounded-lg bg-white outline-none focus:ring-1 focus:ring-charcoal/30"
        style={{ maxHeight: 480 }}
        dir="rtl"
      >
        <div style={{ display: 'grid', gridTemplateColumns, gridTemplateRows, width: 'fit-content' }}>
          {/* corner */}
          <button
            type="button"
            aria-label="בחר את כל הטבלה"
            onClick={selectAll}
            style={{ gridRow: 1, gridColumn: 1 }}
            className="bg-cream-dark border-b border-l border-light-gray hover:bg-light-gray/50"
          />
          {/* column letters */}
          {Array.from({ length: numCols }).map((_, c) => (
            <div key={`ch-${c}`} style={{ gridRow: 1, gridColumn: c + 2 }} className="relative bg-cream-dark border-b border-l border-light-gray">
              <button
                type="button"
                onClick={e => selectCol(c, (e as any).shiftKey)}
                aria-label={`בחר עמודה ${columnLabel(c)}`}
                className="w-full h-full flex items-center justify-center text-[11px] text-warm-gray hover:text-charcoal"
              >
                {columnLabel(c)}
              </button>
              <div
                onMouseDown={e => startColResize(e, c)}
                className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-charcoal/20"
              />
            </div>
          ))}
          {/* row numbers + resize + data cells */}
          {rows.map((row, r) => (
            <div key={`rh-${r}`} style={{ gridRow: r + 2, gridColumn: 1 }} className="relative bg-cream-dark border-b border-l border-light-gray">
              <button
                type="button"
                onClick={e => selectRow(r, (e as any).shiftKey)}
                aria-label={`בחר שורה ${r + 1}`}
                className="w-full h-full flex items-center justify-center text-[11px] text-warm-gray hover:text-charcoal"
              >
                {r + 1}
              </button>
              <div
                onMouseDown={e => startRowResize(e, r)}
                className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-charcoal/20"
              />
            </div>
          ))}
          {rows.map((row, r) =>
            row.map((cellData, c) => {
              const selected = inRange(selection, r, c)
              const isEditing = editingCell?.r === r && editingCell?.c === c
              const css = cellStyleToCss(cellData.style)
              const resolved = resolveCellStyle(cellData.style)
              return (
                <div
                  key={`${r}-${c}`}
                  style={{ gridRow: r + 2, gridColumn: c + 2, ...css }}
                  onMouseDown={e => onCellMouseDown(r, c, e)}
                  onMouseEnter={e => onCellMouseEnter(r, c, e)}
                  onMouseUp={() => onCellMouseUp(r, c)}
                  className={`relative border-b border-l overflow-hidden ${resolved.border || c === 0 ? 'border-light-gray' : 'border-transparent'} ${selected ? 'ring-2 ring-inset ring-charcoal/60 bg-charcoal/5' : ''}`}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={draftValue}
                      onChange={e => setDraftValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => onEditTextareaKeyDown(e, r, c)}
                      style={{ ...css, resize: 'none' }}
                      className="w-full h-full outline-none border-0 bg-white"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center overflow-hidden" style={{ justifyContent: resolved.align === 'right' ? 'flex-end' : resolved.align === 'left' ? 'flex-start' : 'center' }}>
                      <span className="truncate">{cellData.value}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
