export const dynamic = 'force-dynamic'
import AdminShell from '@/components/admin/AdminShell'
import { getServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import DeleteProductButton from './DeleteProductButton'
import StockToggleButton from './StockToggleButton'
import DuplicateProductButton from './DuplicateProductButton'
import { CLOTHING_CATEGORIES } from '@/lib/clothing-categories'

function getCategoryLabel(value: string) {
  return CLOTHING_CATEGORIES.find(c => c.value === value)?.label || value
}

async function getProducts() {
  const db = getServiceClient()
  const { data } = await db.from('products').select('*').order('display_order')
  return data || []
}

export default async function ProductsAdmin() {
  let products: any[] = []
  try { products = await getProducts() } catch {}

  return (
    <AdminShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-charcoal">מוצרים</h1>
            <p className="text-sm text-warm-gray">{products.length} מוצרים</p>
          </div>
          <Link href="/admin/products/new" className="px-5 py-2.5 bg-charcoal text-cream text-sm hover:bg-charcoal/80 transition-colors rounded-lg">
            + מוצר חדש
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center text-warm-gray">
              <p className="text-lg font-serif">אין מוצרים עדיין</p>
              <Link href="/admin/products/new" className="text-sm underline mt-2 inline-block">הוסף את המוצר הראשון</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-light-gray bg-cream-dark">
                <tr>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">מוצר</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray hidden md:table-cell">מחיר</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray hidden md:table-cell">תגיות</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray hidden lg:table-cell">קטגוריה</th>
                  <th className="text-right py-3 px-4 font-medium text-warm-gray">מלאי</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-light-gray last:border-0 hover:bg-cream-dark/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-cream-dark flex-shrink-0 overflow-hidden rounded">
                          {p.images?.[0] && (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className={`object-cover transition-all duration-300 ${!p.in_stock ? 'blur-[2px] brightness-75' : ''}`}
                              sizes="48px"
                            />
                          )}
                          {!p.in_stock && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white bg-red-600/80 px-1.5 py-0.5 rounded">אזל</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-charcoal">{p.name}</span>
                          {!p.in_stock && (
                            <span className="block text-xs text-red-brand font-medium mt-0.5">אזל מהמלאי</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-warm-gray">{formatPrice(p.price)}</td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).filter((t: string) => t !== 'all').map((t: string) => (
                          <span key={t} className="text-xs bg-cream-dark px-2 py-0.5 rounded-full text-warm-gray">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-warm-gray">
                      {p.clothing_category ? getCategoryLabel(p.clothing_category) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-brand'}`}>
                          {p.in_stock ? 'במלאי' : 'אזל'}
                        </span>
                        <StockToggleButton id={p.id} inStock={p.in_stock} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/products/${p.id}/analytics`} className="text-xs text-warm-gray hover:text-charcoal underline">סטטיסטיקה</Link>
                        <Link href={`/admin/products/${p.id}`} className="text-xs text-warm-gray hover:text-charcoal underline">ערוך</Link>
                        <DuplicateProductButton id={p.id} />
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
