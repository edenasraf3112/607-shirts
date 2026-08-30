import AdminShell from '@/components/admin/AdminShell'
import ProductForm from '@/components/admin/ProductForm'
import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const db = getServiceClient()
  const [{ data: product }, { data: collections }, { data: sizeCharts }] = await Promise.all([
    db.from('products').select('*').eq('id', params.id).single(),
    db.from('collections').select('*').order('created_at', { ascending: false }),
    db.from('size_charts').select('*').order('title', { ascending: true }),
  ])
  if (!product) notFound()

  return (
    <AdminShell>
      <div dir="rtl" className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-charcoal mb-8">עריכת מוצר — {product.name}</h1>
        <div className="bg-white rounded-xl p-8 border border-light-gray">
          <ProductForm product={product} collections={collections || []} sizeCharts={sizeCharts || []} />
        </div>
      </div>
    </AdminShell>
  )
}
