import { useEffect, useRef } from 'react'
import { MODALITIES } from './modalities'
import { Hero } from './components/Hero'
import { Primer } from './components/Primer'
import { ModalityNav } from './components/ModalityNav'
import { ModalityZone } from './components/ModalityZone'
import { CrossModalityDollar } from './components/CrossModalityDollar'
import { Glossary } from './components/Glossary'

export default function App() {
  const bgRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = bgRef.current
      if (!el) return
      const vh = window.innerHeight
      const t = Math.min(1, window.scrollY / (vh * 0.8))
      el.style.opacity = String(1 - t * 0.85)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div className="min-h-screen text-slate-900">
      <div ref={bgRef} className="pointer-events-none fixed inset-0 overflow-hidden -z-10 transition-opacity duration-75">
        <div className="blob absolute -top-32 -right-24 w-[55vw] h-[55vw] rounded-full bg-indigo-300/40" />
        <div className="blob absolute top-1/3 -left-32 w-[45vw] h-[45vw] rounded-full bg-rose-300/40" style={{ animationDelay: '-6s' }} />
        <div className="blob absolute bottom-[-10%] left-1/3 w-[45vw] h-[45vw] rounded-full bg-emerald-300/30" style={{ animationDelay: '-12s' }} />
        <div className="blob absolute top-2/3 right-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-300/30" style={{ animationDelay: '-9s' }} />
      </div>
      <ModalityNav />
      <main className="max-w-6xl mx-auto px-5 sm:px-8">
        <Hero />
        <CrossModalityDollar />
        <Primer />
        {MODALITIES.map((m, i) => (
          <div key={m.id} className={i > 0 ? 'border-t border-slate-200/60' : ''}>
            <ModalityZone modality={m} />
          </div>
        ))}
        <Glossary />
        <Footer />
      </main>
    </div>
  )
}

function Footer() {
  return (
    <footer className="py-12 text-center text-xs text-slate-500 border-t border-slate-200/60">
      <div>Numbers are illustrative, tuned to match real-world <em>shapes</em>, not quotes.</div>
      <div className="mt-2">Built to help you think about Gen Media inference — not to replace a pricing calculator.</div>
    </footer>
  )
}
