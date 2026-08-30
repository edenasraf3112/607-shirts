import Link from 'next/link'

const VIDEO_URL = 'https://qjwplfwwpdekyfacmven.supabase.co/storage/v1/object/public/story/WhatsApp%20Video%202026-07-04%20at%2019.51.56.mp4'

export default function UnderConstructionPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-black" dir="rtl">
      {/* Video background */}
      {VIDEO_URL && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }}
        >
          <source src={VIDEO_URL} />
        </video>
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg animate-fade-up">
        <p className="text-xs tracking-widest uppercase text-white/60 mb-8" style={{ letterSpacing: '0.3em' }}>
          Coming Soon
        </p>
        <h1 className="font-serif text-6xl md:text-7xl text-white font-light mb-6">
          בשיפוצים
        </h1>
        <div className="w-12 h-px bg-white/30 mx-auto mb-6" />
        <p className="text-white/70 text-sm leading-relaxed mb-10">
          עובדים על זה ומביאים לך משהו מיוחד — חזרו בקרוב.
        </p>
        <Link
          href="/home"
          className="text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors"
          style={{ letterSpacing: '0.2em' }}
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
