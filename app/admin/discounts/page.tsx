export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import DiscountActions from './DiscountActions'
import NewDiscountForm from './NewDiscountForm'

export default async function DiscountsAdmin() {
  let codes: any[] = []
  try {
    const { data } = await getServiceClient().from('discount_codes').select('*').order('created_at', { ascending: false })
    codes = data || []
  } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">קודי הנחה</h1>
          <p className="text-sm text-warm-gray">{codes.length} קודים</p>
        </div>

        {/* New code form */}
        <div className="bg-white rounded-xl border border-light-gray p-6">
          <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-wider">קוד חדש</h2>
          <NewDiscountForm />
        </div>

        {/* Codes list */}
        <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
          {codes.length === 0 ? (
            <div className="p-12 text-center text-warm-gray font-serif text-xl">אין קודים עדיין</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-light-gray bg-cream-dark">
                <tr>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">קוד</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">הנחה</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray hidden md:table-cell">שימושים</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray hidden md:table-cell">תפוגה</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">פעיל</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {codes.map((code: any) => (
                  <tr key={code.id} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/30">
                    <td className="py-3 px-4 font-mono font-bold text-charcoal">{code.code}</td>
                    <td className="py-3 px-4">{code.type === 'percent' ? `${code.value}%` : `₪${code.value}`}</td>
                    <td className="py-3 px-4 text-warm-gray hidden md:table-cell">{code.used_count}{code.max_uses ? `/${code.max_uses}` : ''}</td>
                    <td className="py-3 px-4 text-warm-gray text-xs hidden md:table-cell">{code.expires_at ? formatDate(code.expires_at) : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${code.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {code.is_active ? 'פעיל' : 'כבוי'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DiscountActions id={code.id} isActive={code.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
