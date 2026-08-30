import { supabase } from '@/lib/supabase'
import ProductCard from './ProductCard'
import Link from 'next/link'
import type { Product } from '@/lib/supabase'

async function getProducts(): Promise<Product[]> {
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
      .limit(8)
    return data || []
  } catch {
    return []
  }
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'חולצת Collection 01',
    price: 290,
    short_description: 'כותנה פרימיום, גזרה נקייה',
    full_description: '',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['לבן', 'שחור'],
    tags: ['all', 'גברים'],
    display_order: 1,
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'הוד Collection 01',
    price: 390,
    short_description: 'פליס כבד, רקמה מיוחדת',
    full_description: '',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['פחם'],
    tags: ['all', 'גברים', 'נשים'],
    display_order: 2,
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: 'ג\'קט Collection 01',
    price: 590,
    short_description: 'פרימיום, מוגבל',
    full_description: '',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80'],
    sizes: ['M', 'L', 'XL'],
    colors: ['שחור'],
    tags: ['all', 'גברים'],
    display_order: 3,
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    name: 'צמיד Collection 01',
    price: 120,
    short_description: 'נירוסטה, עם חריטה',
    full_description: '',
    images: ['https://images.unsplash.com/photo-1573408301185-9519bf9f3a24?w=600&q=80'],
    sizes: [],
    colors: ['כסף', 'זהב'],
    tags: ['all', 'אקססוריז'],
    display_order: 4,
    in_stock: false,
    created_at: new Date().toISOString(),
  },
]

export default async function FeaturedProducts() {
  const products = await getProducts()
  const display = products.length > 0 ? products : DEMO_PRODUCTS

  return (
    <section className="py-20 px-4 sm:px-6 bg-cream-dark" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-widest uppercase text-warm-gray mb-3" style={{ letterSpacing: '0.25em' }}>
              קולקציה 01
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light">
              המוצרים המובילים
            </h2>
          </div>
          <Link
            href="/shop/all"
            className="hidden sm:inline-flex items-center text-sm text-warm-gray hover:text-charcoal transition-colors gap-2 tracking-wide"
          >
            לכל המוצרים ←
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {display.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12 sm:hidden">
          <Link href="/shop/all" className="btn-outline">
            כל המוצרים
          </Link>
        </div>
      </div>
    </section>
  )
}
