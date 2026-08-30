export type AnalyticsEventType = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('nl_session_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('nl_session_id', id)
  }
  return id
}

export function trackEvent(event_type: AnalyticsEventType, extra?: { product_id?: string }) {
  if (typeof window === 'undefined') return
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type,
      session_id: getSessionId(),
      path: window.location.pathname,
      ...extra,
    }),
    keepalive: true,
  }).catch(() => {})
}
