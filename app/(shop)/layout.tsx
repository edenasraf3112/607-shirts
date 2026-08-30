import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AnalyticsTracker />
          <Navbar />
          <main className="min-h-screen bg-cream">
            {children}
          </main>
          <Footer />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
