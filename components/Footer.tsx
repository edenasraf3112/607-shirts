import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-8 mb-12" dir="rtl">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/assets/branding/logo-white.png"
              alt="607 חולצות"
              width={80}
              height={40}
              className="h-10 w-auto object-contain mb-6"
            />
            <p className="text-[11px] md:text-sm text-cream/60 leading-relaxed">
              607 חולצות
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs tracking-widest uppercase mb-6 text-cream/40" style={{ letterSpacing: '0.2em' }}>
              חנות
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'החנות', href: '/shop/all' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs tracking-widest uppercase mb-6 text-cream/40" style={{ letterSpacing: '0.2em' }}>
              מידע
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'יצירת קשר', href: '/contact' },
                { label: 'משלוחים', href: '/shipping' },
                { label: 'שאלות ותשובות', href: '/faq' },
                { label: 'תקנון', href: '/terms' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-8 text-center">
          <p className="text-xs text-cream/30" style={{ letterSpacing: '0.1em' }}>
            © 607 חולצות. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  )
}
