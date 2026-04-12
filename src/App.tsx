import { MODALITIES } from './modalities'
import { Hero } from './components/Hero'
import { Primer } from './components/Primer'
import { ModalityNav } from './components/ModalityNav'
import { ModalityZone } from './components/ModalityZone'
import { CrossModalityDollar } from './components/CrossModalityDollar'
import { Glossary } from './components/Glossary'

export default function App() {
  return (
    <div className="min-h-screen text-slate-900">
      <ModalityNav />
      <main className="max-w-6xl mx-auto px-5 sm:px-8">
        <Hero />
        <Primer />
        {MODALITIES.map((m, i) => (
          <div key={m.id} className={i > 0 ? 'border-t border-slate-200/60' : ''}>
            <ModalityZone modality={m} />
          </div>
        ))}
        <CrossModalityDollar />
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
