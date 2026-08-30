import AdminShell from '@/components/admin/AdminShell'
import CollectionForm from '@/components/admin/CollectionForm'
import { getServiceClient } from '@/lib/supabase'

export default async function NewCollectionPage() {
  const { data: products } = await getServiceClient().from('products').select('id,name,images,collection_id').order('display_order')
  return (
    <AdminShell>
      <div dir="rtl" className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-charcoal mb-8">קולקציה חדשה</h1>
        <div className="bg-white rounded-xl p-8 border border-light-gray">
          <CollectionForm products={products || []} />
        </div>
      </div>
    </AdminShell>
  )
}
