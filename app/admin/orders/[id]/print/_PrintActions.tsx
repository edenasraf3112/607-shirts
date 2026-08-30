'use client'

export default function PrintActions() {
  return (
    <div className="no-print fixed top-4 left-4 flex gap-2 z-10">
      <button
        onClick={() => window.print()}
        style={{ padding: '8px 16px', background: '#1A1A1A', color: '#FAFAF8', fontSize: 13, border: 'none', cursor: 'pointer' }}
      >
        🖨️ הדפס
      </button>
      <a
        href="/admin/orders"
        style={{ padding: '8px 16px', border: '1px solid #E8E5E0', fontSize: 13, color: '#6B6560', textDecoration: 'none', display: 'inline-block' }}
      >
        ← חזרה
      </a>
    </div>
  )
}
