'use client'

export default function LabelsPrintButton() {
  return (
    <button
      style={{ padding: '8px 20px', background: '#1A1A1A', color: '#FAFAF8', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}
      onClick={() => window.print()}
    >
      🖨️ הדפס מדבקות
    </button>
  )
}
