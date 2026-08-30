import AdminShell from '@/components/admin/AdminShell'
import CollectionForm from '@/components/admin/CollectionForm'
import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const db = getServiceClient()
  const { data } = await db.from('collections').select('*').eq('id', params.id).single()
  if (!data) notFound()
  const { data: products } = await db.from('products').select('id,name,images,collection_id').order('display_order')
  return (
    <AdminShell>
      <div dir="rtl" className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-charcoal mb-8">עריכת קולקציה — {data.name}</h1>
        <div className="bg-white rounded-xl p-8 border border-light-gray">
          <CollectionForm collection={data} products={products || []} />
        </div>
      </div>
    </AdminShell>
  )
}
