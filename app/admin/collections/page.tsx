export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { Collection } from '@/lib/supabase'

export default async function CollectionsAdmin() {
  let collections: Collection[] = []
  try {
    const { data } = await getServiceClient().from('collections').select('*').order('created_at', { ascending: false })
    collections = data || []
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">קולקציות</h1>
            <p className="text-sm text-warm-gray">{collections.length} קולקציות</p>
          </div>
          <Link href="/admin/collections/new" className="px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
            + קולקציה חדשה
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center text-warm-gray border border-light-gray">
              <p className="font-serif text-xl">אין קולקציות עדיין</p>
            </div>
          ) : collections.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border border-light-gray p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-charcoal text-lg">{col.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(col.status)}`}>
                  {getStatusLabel(col.status)}
                </span>
              </div>
              {col.description && <p className="text-sm text-warm-gray line-clamp-2">{col.description}</p>}
              <div className="text-xs text-warm-gray space-y-1">
                <p>פתיחה: {formatDate(col.open_date)}</p>
                <p>סגירה: {formatDate(col.close_date)}</p>
                {col.estimated_delivery && <p>אספקה: {col.estimated_delivery}</p>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-light-gray">
                <span className={`text-xs ${col.is_active ? 'text-green-600' : 'text-warm-gray'}`}>
                  {col.is_active ? '● פעיל באתר' : '○ מוסתר'}
                </span>
                <Link href={`/admin/collections/${col.id}`} className="text-xs text-warm-gray hover:text-charcoal underline">
                  ערוך
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
