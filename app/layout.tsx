import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: '607 חולצות',
  description: '607 חולצות — חולצות וכובעים בהזמנה מראש.',
  keywords: '607 חולצות, בגדים, חולצות, כובעים',
  icons: {
    icon: '/assets/branding/favicon.svg',
    apple: '/assets/branding/apple-touch-icon.png',
    shortcut: '/assets/branding/favicon.svg',
  },
  openGraph: {
    title: '607 חולצות',
    description: '607 חולצות — חולצות וכובעים בהזמנה מראש.',
    type: 'website',
    locale: 'he_IL',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#FAFAF8',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '0',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
