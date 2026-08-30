export const dynamic = 'force-dynamic'

import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import PopupActions from './PopupActions'

export default async function PopupsAdmin() {
  let popups: any[] = []
  try {
    const { data } = await getServiceClient()
      .from('popups')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    popups = data || []
  } catch {}

  const triggerLabel: Record<string, string> = {
    immediate: 'מיד', delayed: 'אחרי השהייה', exit: 'ביציאה', scroll: 'אחרי גלילה',
  }

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">פופאפים</h1>
            <p className="text-sm text-warm-gray">{popups.length} פופאפים</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/popups/submissions" className="px-4 py-2 border border-light-gray text-sm text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors rounded-lg">
              פניות ❯
            </Link>
            <Link href="/admin/popups/new" className="px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
              + פופאפ חדש
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popups.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-light-gray">
              <p className="font-serif text-xl text-warm-gray mb-4">אין פופאפים עדיין</p>
              <Link href="/admin/popups/new" className="text-sm text-charcoal underline">צור פופאפ ראשון</Link>
            </div>
          ) : popups.map(popup => {
            const blocks = popup.blocks || []
            const rules = popup.display_rules || {}
            const trigger = rules.trigger || popup.trigger || 'immediate'
            const pages = rules.pageMode === 'all' ? 'כל העמודים' : (rules.pages || popup.pages || []).join(', ') || 'כל העמודים'
            return (
              <div key={popup.id} className="bg-white rounded-xl border border-light-gray overflow-hidden hover:border-charcoal/30 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-charcoal">{popup.title}</h3>
                      {popup.template_name && <p className="text-xs text-warm-gray mt-0.5">תבנית: {popup.template_name}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${popup.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {popup.is_active ? '● פעיל' : '○ כבוי'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-warm-gray mb-4">
                    <span className="bg-cream-dark px-2 py-0.5 rounded">{blocks.length} בלוקים</span>
                    <span className="bg-cream-dark px-2 py-0.5 rounded">{triggerLabel[trigger] || trigger}</span>
                    <span className="bg-cream-dark px-2 py-0.5 rounded">{pages}</span>
                    {popup.priority > 0 && <span className="bg-cream-dark px-2 py-0.5 rounded">עדיפות {popup.priority}</span>}
                  </div>
                  <div className="flex gap-3 pt-3 border-t border-light-gray">
                    <Link href={`/admin/popups/${popup.id}`} className="text-xs text-charcoal hover:underline font-medium">✏️ ערוך</Link>
                    <PopupActions id={popup.id} isActive={popup.is_active} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminShell>
  )
}
