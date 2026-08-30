export const dynamic = 'force-dynamic'

import AdminShell from '@/components/admin/AdminShell'
import SizeChartEditor from '@/components/admin/SizeChartEditor'
import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function EditSizeChartPage({ params }: { params: { id: string } }) {
  const db = getServiceClient()
  const [{ data: chart }, { data: products }, { data: versions }] = await Promise.all([
    db.from('size_charts').select('*').eq('id', params.id).single(),
    db.from('products').select('id').eq('size_chart_id', params.id),
    db.from('size_chart_versions').select('id, data, created_at').eq('size_chart_id', params.id).order('created_at', { ascending: false }).limit(20),
  ])
  if (!chart) notFound()

  return (
    <AdminShell>
      <SizeChartEditor chart={chart} productCount={products?.length || 0} versions={versions || []} />
    </AdminShell>
  )
}
