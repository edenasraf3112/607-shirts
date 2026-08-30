export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { isUnderConstruction, type UnderConstructionKey } from '@/lib/underConstruction'
import UnderConstructionPage from '@/components/UnderConstructionPage'

const CATEGORIES: Record<string, { label: string; tag: string; description: string; ucKey: UnderConstructionKey }> = {
  all: { label: 'כל המוצרים', tag: 'all', description: 'הקולקציה המלאה של Nehoray Leizer', ucKey: 'shop_all' },
  men: { label: 'גברים', tag: 'גברים', description: 'קולקציית הגברים — גזרות נקיות, איכות פרימיום', ucKey: 'shop_men' },
  women: { label: 'נשים', tag: 'נשים', description: 'קולקציית הנשים — עיצוב עדין ומכבד', ucKey: 'shop_women' },
  accessories: { label: 'אקססוריז', tag: 'אקססוריז', description: 'אקססוריז מיוחדים עם חריטה אישית', ucKey: 'shop_accessories' },
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const cat = CATEGORIES[params.category]
  if (!cat) notFound()

  if (await isUnderConstruction(cat.ucKey)) return <UnderConstructionPage />

  let products: Product[] = []
  try {
    const query = supabase.from('products').select('*').order('display_order')
    const { data } = params.category === 'all'
      ? await query
      : await query.contains('tags', [cat.tag])
    products = data || []
  } catch {}

  const display = products

  return (
    <div className="pt-28 md:pt-40 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="py-16 px-6 text-center border-b border-light-gray">
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal font-light">{cat.label}</h1>
        <p className="text-sm text-warm-gray mt-4">{cat.description}</p>
        <p className="text-xs text-warm-gray/60 mt-2">{display.length} פריטים</p>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {display.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-warm-gray">הקולקציה בדרך...</p>
            <p className="text-sm text-warm-gray/60 mt-3">הצטרפו לעדכונים כדי להיות ראשונים</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {display.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }))
}
