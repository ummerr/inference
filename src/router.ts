import { useEffect, useState, useCallback } from 'react'

export type Route = {
  path: string
  query: URLSearchParams
}

function parseHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const qIdx = raw.indexOf('?')
  const path = qIdx >= 0 ? raw.slice(0, qIdx) : raw
  const query = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '')
  return { path: path || '/', query }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function buildHash(path: string, query?: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    }
  }
  const q = qs.toString()
  return '#' + path + (q ? '?' + q : '')
}

export function navigate(path: string, query?: Record<string, string | number | undefined>) {
  window.location.hash = buildHash(path, query).slice(1)
}

export function useQueryState(key: string, defaultValue: string): [string, (v: string) => void] {
  const route = useRoute()
  const value = route.query.get(key) ?? defaultValue
  const set = useCallback((v: string) => {
    const q = new URLSearchParams(route.query)
    if (v === defaultValue || v === '') q.delete(key)
    else q.set(key, v)
    const s = q.toString()
    const hash = '#' + route.path + (s ? '?' + s : '')
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [key, defaultValue, route.path, route.query])
  return [value, set]
}
