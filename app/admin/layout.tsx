import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — Nehoray Leizer',
  robots: 'noindex,nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'Inter, sans-serif', background: '#F2F0EC' }}>
        {children}
      </body>
    </html>
  )
}
