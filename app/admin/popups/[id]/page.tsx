import PopupBuilder from '@/components/admin/PopupBuilder'
import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function EditPopupPage({ params }: { params: { id: string } }) {
  const db = getServiceClient()
  const [{ data: popup }, { data: logoContent }] = await Promise.all([
    db.from('popups').select('*').eq('id', params.id).single(),
    db.from('site_content').select('value').eq('key', 'logo_url').single(),
  ])
  if (!popup) notFound()

  const logoUrl = (logoContent as any)?.value || '/assets/branding/brand-logo.png'

  return <PopupBuilder initialData={popup} logoUrl={logoUrl} />
}
