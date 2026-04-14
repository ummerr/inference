import { useEffect, useState } from 'react'
import { MODALITIES } from '../modalities'
import { useRoute } from '../router'

export function ModalityNav() {
  const route = useRoute()
  const onMisc = route.path === '/misc'
  const [active, setActive] = useState<string>(onMisc ? 'misc' : MODALITIES[0].id)

  useEffect(() => {
    if (onMisc) { setActive('misc'); return }
    const handler = () => {
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
  }, [onMisc])

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-slate-500 font-semibold mr-2 whitespace-nowrap">Jump to</span>
        {MODALITIES.map(m => {
          const isActive = active === m.id
          const href = onMisc ? `#/?zone=${m.id}` : `#zone-${m.id}`
          return (
            <a
              key={m.id}
              href={href}
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
          className={[
            'ml-auto px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
            active === 'misc'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 bg-slate-100 hover:bg-slate-200',
          ].join(' ')}
        >
          Under the hood
        </a>
      </div>
    </div>
  )
}
