import { useEffect, useRef, useState } from 'react'

export function useInView<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: '0px 0px -15% 0px', threshold: 0.15 },
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            obs.disconnect()
            break
          }
        }
      },
      options,
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return [ref, inView] as const
}
