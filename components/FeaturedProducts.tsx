import { supabase } from '@/lib/supabase'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/supabase'

async function getProducts(): Promise<Product[]> {
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
    return data || []
  } catch {
    return []
  }
}

export default async function FeaturedProducts() {
  const products = await getProducts()

  return (
    <section className="py-20 px-4 sm:px-6 bg-cream-dark" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light">
            המוצרים שלנו
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-warm-gray">בקרוב יתווספו מוצרים...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
