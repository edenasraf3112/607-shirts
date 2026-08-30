export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Message } from '@/lib/supabase'

const TYPE_LABELS: Record<string, string> = {
  family_message: 'הודעה למשפחה',
  collection_request: 'בקשת קולקציה',
  general: 'כללי',
}
const TYPE_COLORS: Record<string, string> = {
  family_message: 'bg-pink-50 text-pink-700',
  collection_request: 'bg-blue-50 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
}

export default async function MessagesAdmin() {
  let messages: Message[] = []
  try {
    const { data } = await getServiceClient().from('messages').select('*').order('created_at', { ascending: false })
    messages = data || []
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">הודעות</h1>
          <p className="text-sm text-warm-gray">{messages.length} הודעות</p>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-warm-gray border border-light-gray font-serif text-xl">
              אין הודעות עדיין
            </div>
          ) : messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-light-gray p-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="font-medium text-charcoal">{msg.name}</span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-warm-gray">
                    {msg.phone && <span>{msg.phone}</span>}
                    {msg.email && <span>{msg.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[msg.type]}`}>
                    {TYPE_LABELS[msg.type]}
                  </span>
                  {msg.subscribe && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">מנוי</span>
                  )}
                  <span className="text-xs text-warm-gray">{formatDate(msg.created_at)}</span>
                </div>
              </div>
              {msg.requested_collections && msg.requested_collections.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.requested_collections.map(name => (
                    <span key={name} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              {msg.message && (
                <p className="text-sm text-warm-gray leading-relaxed whitespace-pre-line bg-cream-dark p-4 rounded">
                  {msg.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
