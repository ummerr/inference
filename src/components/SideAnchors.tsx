import { useEffect, useState } from 'react'

export interface AnchorItem {
  id: string
  label: string
}

export function SideAnchors({ items, idPrefix = '' }: { items: AnchorItem[]; idPrefix?: string }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    const handler = () => {
      const pivot = window.innerHeight * 0.3
      let best = items[0]?.id ?? ''
      let bestDist = Infinity
      for (const it of items) {
        const el = document.getElementById(idPrefix + it.id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const dist = Math.abs(r.top - pivot)
        if (r.top < pivot + 200 && dist < bestDist) {
          best = it.id
          bestDist = dist
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
  }, [items, idPrefix])

  const scrollTo = (id: string) => {
    const el = document.getElementById(idPrefix + id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Right rail — visible only on xl+ where there's room alongside content */}
      <nav
        aria-label="On this page"
        className="hidden xl:flex fixed right-6 2xl:right-12 top-1/2 -translate-y-1/2 z-30 flex-col gap-0.5 print-hide"
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-2 pl-3">
          On this page
        </div>
        {items.map((it) => {
          const isActive = active === it.id
          return (
            <a
              key={it.id}
              href={`#${idPrefix}${it.id}`}
              onClick={(e) => { e.preventDefault(); scrollTo(it.id) }}
              className={[
                'flex items-center pl-3 pr-3 py-1 text-sm rounded-r transition-all border-l-2',
                isActive
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
              ].join(' ')}
            >
              {it.label}
            </a>
          )
        })}
      </nav>

      {/* Compact horizontal sub-nav — shown below xl, keeps navigation available on tablet/mobile */}
      <div className="xl:hidden sticky top-[49px] z-30 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/60 print-hide">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-1 overflow-x-auto">
          {items.map((it) => {
            const isActive = active === it.id
            return (
              <a
                key={it.id}
                href={`#${idPrefix}${it.id}`}
                onClick={(e) => { e.preventDefault(); scrollTo(it.id) }}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {it.label}
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
