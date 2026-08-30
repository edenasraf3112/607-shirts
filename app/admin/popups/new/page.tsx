import PopupBuilder from '@/components/admin/PopupBuilder'
import { getServiceClient } from '@/lib/supabase'

export default async function NewPopupPage() {
  let logoUrl = '/assets/branding/brand-logo.png'
  try {
    const { data } = await getServiceClient().from('site_content').select('value').eq('key', 'logo_url').single()
    if (data?.value) logoUrl = data.value
  } catch {}
  return <PopupBuilder logoUrl={logoUrl} />
}
