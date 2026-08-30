'use client'

export default function PrintButton({ isHe = true }: { isHe?: boolean }) {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: '6px 16px', background: '#FAFAF8', color: '#1A1A1A', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
    >
      {isHe ? '🖨️ הדפס / שמור PDF' : '🖨️ Print / Save PDF'}
    </button>
  )
}
