import Link from 'next/link'

export default function ShippingPage() {
  return (
    <div className="pt-16 md:pt-40 min-h-screen bg-cream" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-xs tracking-widest uppercase text-warm-gray mb-4" style={{ letterSpacing: '0.25em' }}>Shipping</p>
        <h1 className="font-serif text-5xl text-charcoal font-light mb-12">משלוחים</h1>
        <div className="prose prose-neutral max-w-none space-y-6 text-warm-gray">
          <section>
            <h2 className="font-serif text-2xl text-charcoal font-light mb-3">מדיניות משלוחים</h2>
            <p className="text-sm leading-relaxed">הקולקציה מיוצרת לפי הזמנה לאחר סגירת תקופת ההזמנות. משלוחים מתבצעים לאחר השלמת הייצור.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-charcoal font-light mb-3">זמני אספקה</h2>
            <p className="text-sm leading-relaxed">זמן אספקה משוער: 3-6 שבועות מסגירת הקולקציה. נעדכן אותך בכל שלב.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-charcoal font-light mb-3">עלות משלוח</h2>
            <p className="text-sm leading-relaxed">משלוח חינם בהזמנות מעל ₪300. הזמנות קטנות יותר — ₪35.</p>
          </section>
        </div>
        <Link href="/contact" className="btn-outline mt-10 inline-flex">שאלות? צרו קשר</Link>
      </div>
    </div>
  )
}
