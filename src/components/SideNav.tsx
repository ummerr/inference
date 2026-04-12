import { useEffect, useState } from 'react'

export interface NavItem { id: string; label: string }

export function SideNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  return (
    <nav className="hidden lg:block sticky top-8 self-start">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-3">
        On this page
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === active
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={
                  'block text-sm py-1.5 pl-3 border-l-2 transition-colors ' +
                  (isActive
                    ? 'text-indigo-600 font-semibold border-indigo-600'
                    : 'text-slate-500 hover:text-slate-900 border-transparent')
                }
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
