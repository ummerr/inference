import { useState, type ReactNode } from 'react'

export function Claim({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const url = `${location.origin}${location.pathname}#/misc?c=${id}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }
  return (
    <div id={id} className={`group relative scroll-mt-24 ${className}`}>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link to this claim"
        className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 text-sm font-mono"
      >
        {copied ? '✓' : '#'}
      </button>
      {children}
      {copied && (
        <span className="absolute -left-6 top-6 text-[10px] text-slate-500">copied</span>
      )}
    </div>
  )
}
