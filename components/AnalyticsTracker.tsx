'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    trackEvent('page_view')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}
