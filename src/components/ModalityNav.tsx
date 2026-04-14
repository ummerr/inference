import { useEffect, useState } from 'react'
import { MODALITIES } from '../modalities'

export function ModalityNav() {
  const [active, setActive] = useState<string>(MODALITIES[0].id)

  useEffect(() => {
    const handler = () => {
      // Pick the section whose top is closest to 30% of viewport
      const pivot = window.innerHeight * 0.3
      let best = MODALITIES[0].id
      let bestDist = Infinity
      for (const m of MODALITIES) {
        const el = document.getElementById(`zone-${m.id}`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const dist = Math.abs(r.top - pivot)
        if (r.top < pivot + 200 && dist < bestDist) {
          best = m.id; bestDist = dist
        }
      }
      setActive(best)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-slate-500 font-semibold mr-2 whitespace-nowrap">Jump to</span>
        {MODALITIES.map(m => {
          const isActive = active === m.id
          return (
            <a
              key={m.id}
              href={`#zone-${m.id}`}
              className={[
                'px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? `${m.accent.bg} text-white shadow-sm`
                  : `${m.accent.text} ${m.accent.bgSoft} hover:brightness-95`,
              ].join(' ')}
            >
              {m.short}
            </a>
          )
        })}
        <a
          href="#/misc"
          className="ml-auto px-3 py-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap"
        >
          Misc →
        </a>
      </div>
    </div>
  )
}
