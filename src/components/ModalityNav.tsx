import { useRoute } from '../router'

export function ModalityNav() {
  const route = useRoute()
  const onMisc = route.path === '/misc'
  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-center gap-2">
        <TopLink href="#/" active={!onMisc}>Inference 101</TopLink>
        <TopLink href="#/misc" active={onMisc}>Under the Hood</TopLink>
      </div>
    </div>
  )
}

function TopLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={[
        'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {children}
    </a>
  )
}
