'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { Activity, AlertCircle } from 'lucide-react'

type LogEntry = {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any>
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  status_changed: 'שינוי סטטוס',
  payment_confirmed: 'תשלום אושר',
  order_deleted: 'הזמנה נמחקה',
  order_restored: 'הזמנה שוחזרה',
  note_saved: 'הערה נשמרה',
  email_sent: 'אימייל נשלח',
  campaign_sent: 'קמפיין נשלח',
}

const ACTION_COLORS: Record<string, string> = {
  status_changed: 'bg-blue-50 text-blue-700',
  payment_confirmed: 'bg-green-50 text-green-700',
  order_deleted: 'bg-red-50 text-red-700',
  order_restored: 'bg-yellow-50 text-yellow-700',
  note_saved: 'bg-gray-100 text-gray-600',
  email_sent: 'bg-purple-50 text-purple-700',
  campaign_sent: 'bg-purple-50 text-purple-700',
}

function formatDetails(action: string, details: Record<string, any>): string {
  if (action === 'status_changed') return `${details.from || '?'} → ${details.to || '?'}${details.customer ? ` · ${details.customer}` : ''}`
  if (action === 'payment_confirmed') return details.customer || ''
  if (action === 'order_deleted' || action === 'order_restored') return details.customer || ''
  if (action === 'note_saved') return details.note ? `"${String(details.note).slice(0, 50)}..."` : ''
  if (action === 'campaign_sent') return `${details.group || ''} — ${details.sent || 0} נשלחו`
  return JSON.stringify(details)
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/activity')
      .then(r => r.json())
      .then(d => {
        if (d.error && !d.logs?.length) setError(d.error)
        setLogs(d.logs || [])
      })
      .catch(() => setError('שגיאה בטעינה'))
      .finally(() => setLoading(false))
  }, [])

  const needsMigration = error?.toLowerCase().includes('does not exist') || error?.toLowerCase().includes('relation')

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">לוג פעילות</h1>
          <p className="text-sm text-warm-gray">היסטוריית פעולות במערכת</p>
        </div>

        {needsMigration && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-2">נדרש SQL — הרץ בסופאבייס:</div>
                <pre className="bg-amber-100 rounded p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all" ON admin_activity_log
  FOR ALL TO service_role USING (true);`}</pre>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-warm-gray">טוען...</div>
        ) : logs.length === 0 && !needsMigration ? (
          <div className="bg-white rounded-xl border border-light-gray p-12 text-center">
            <Activity size={32} className="text-light-gray mx-auto mb-3" />
            <p className="text-warm-gray font-serif text-lg">אין פעילות עדיין</p>
            <p className="text-warm-gray text-sm mt-1">הפעולות שתבצע ייכנסו לכאן אוטומטית</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="border-b border-light-gray bg-cream-dark">
                  <tr>
                    <th className="text-right py-3 px-4 font-medium text-warm-gray">פעולה</th>
                    <th className="text-right py-3 px-4 font-medium text-warm-gray">פרטים</th>
                    <th className="text-right py-3 px-4 font-medium text-warm-gray">ישות</th>
                    <th className="text-right py-3 px-4 font-medium text-warm-gray">זמן</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/30">
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-warm-gray max-w-[240px] truncate">
                        {formatDetails(log.action, log.details)}
                      </td>
                      <td className="py-3 px-4 text-xs text-warm-gray font-mono">
                        {log.entity_id ? log.entity_id.slice(0, 8) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-warm-gray whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
