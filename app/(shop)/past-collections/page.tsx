export const dynamic = 'force-dynamic'
import { isUnderConstruction } from '@/lib/underConstruction'
import UnderConstructionPage from '@/components/UnderConstructionPage'
import PastCollectionsContent from './_PastCollectionsContent'

export default async function PastCollectionsPage() {
  if (await isUnderConstruction('past_collections')) return <UnderConstructionPage />
  return <PastCollectionsContent />
}
