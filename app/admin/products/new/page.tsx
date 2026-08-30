import AdminShell from '@/components/admin/AdminShell'
import ProductForm from '@/components/admin/ProductForm'
import { getServiceClient } from '@/lib/supabase'

async function getCollections() {
  try {
    const { data } = await getServiceClient().from('collections').select('*').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

async function getSizeCharts() {
  try {
    const { data } = await getServiceClient().from('size_charts').select('*').order('title', { ascending: true })
    return data || []
  } catch { return [] }
}

export default async function NewProductPage() {
  const [collections, sizeCharts] = await Promise.all([getCollections(), getSizeCharts()])
  return (
    <AdminShell>
      <div dir="rtl" className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-charcoal mb-8">מוצר חדש</h1>
        <div className="bg-white rounded-xl p-8 border border-light-gray">
          <ProductForm collections={collections} sizeCharts={sizeCharts} />
        </div>
      </div>
    </AdminShell>
  )
}
