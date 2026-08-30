export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  })
}

export function formatPrice(price: number): string {
  return `₪${price.toLocaleString('he-IL')}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'פתוחה להזמנות',
    closed: 'נסגרה',
    production: 'בייצור',
    shipped: 'נשלחה',
    received: 'התקבלה',
    pending_payment: 'ממתינה לתשלום',
    paid: 'שולמה',
    packing: 'נארזת',
    delivered: 'נמסרה',
  }
  return labels[status] || status
}

export function getCollectionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'פתוחה להזמנות',
    closed: 'הזמנות נסגרו',
    production: 'בייצור',
    shipped: 'בדרך',
    delivered: 'הגיעה',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    production: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    received: 'bg-yellow-100 text-yellow-800',
    pending_payment: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    packing: 'bg-blue-100 text-blue-800',
    delivered: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
