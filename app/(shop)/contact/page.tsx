export const dynamic = 'force-dynamic'
import { isUnderConstruction } from '@/lib/underConstruction'
import UnderConstructionPage from '@/components/UnderConstructionPage'
import ContactContent from './_ContactContent'

export default async function ContactPage() {
  if (await isUnderConstruction('contact')) return <UnderConstructionPage />
  return <ContactContent />
}
