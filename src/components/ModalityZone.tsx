import { useEffect, useMemo, useRef, useState } from 'react'
import type { Modality, Inputs } from '../modalities'
import { Calculator } from './Calculator'
import { ScenarioCard } from './ScenarioCard'
import { DeepDive } from './DeepDive'

export function ModalityZone({ modality }: { modality: Modality }) {
  const defaults: Inputs = useMemo(() => {
    const o: Inputs = {}
    for (const f of modality.fields) o[f.id] = f.default
    return o
  }, [modality])

  const initial: Inputs = useMemo(() => {
    const o: Inputs = { ...defaults }
    if (typeof window === 'undefined') return o
    const params = new URLSearchParams(window.location.search)
    for (const f of modality.fields) {
      const raw = params.get(`${modality.id}.${f.id}`)
      if (raw == null) continue
      if (f.type === 'slider') {
        const n = Number(raw)
        if (Number.isFinite(n)) o[f.id] = Math.max(f.min, Math.min(f.max, n))
      } else if (f.type === 'toggle') {
        o[f.id] = raw === '1' || raw === 'true'
      } else if (f.options.some(opt => opt.value === raw)) {
        o[f.id] = raw
      }
    }
    return o
  }, [modality, defaults])

  const [inputs, setInputs] = useState<Inputs>(initial)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    for (const f of modality.fields) {
      const key = `${modality.id}.${f.id}`
      const v = inputs[f.id]
      if (v === f.default) {
        params.delete(key)
      } else {
        params.set(key, f.type === 'toggle' ? (v ? '1' : '0') : String(v))
      }
    }
    const qs = params.toString()
    const next = `${window.location.pathname}${qs ? '?' + qs : ''}${window.location.hash}`
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, '', next)
    }
  }, [inputs, modality])
  const calcRef = useRef<HTMLDivElement>(null)
  const [pulse, setPulse] = useState(false)

  const applyInputs = (partial: Partial<Inputs>) => {
    setInputs(prev => {
      const next: Inputs = { ...prev }
      for (const [k, v] of Object.entries(partial)) {
        if (v === undefined) continue
        const field = modality.fields.find(f => f.id === k)
        if (field?.type === 'slider' && typeof v === 'number') {
          next[k] = Math.max(field.min, Math.min(field.max, v))
        } else {
          next[k] = v
        }
      }
      return next
    })
    calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setPulse(true)
    window.setTimeout(() => setPulse(false), 900)
  }

  const resetInputs = () => setInputs(defaults)
  const isModified = modality.fields.some(f => inputs[f.id] !== f.default)

  return (
    <section id={`zone-${modality.id}`} className="scroll-mt-20 py-16 sm:py-24">
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${modality.accent.bg}`} />
        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${modality.accent.text}`}>
          {modality.label}
        </span>
      </div>
      <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-slate-900 leading-[1.05] max-w-3xl">
        {modality.tagline}
      </h2>

      <div className="mt-6 max-w-2xl space-y-4 text-slate-700 leading-relaxed">
        {modality.primer.map((p, i) => (
          <p key={i} className={i === 0 ? 'text-lg' : ''}>{p}</p>
        ))}
      </div>

      {modality.disclaimer && (
        <div className="mt-6 max-w-2xl rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">
            Illustrative, not measured
          </div>
          <div className="text-amber-900 text-sm leading-relaxed">{modality.disclaimer}</div>
        </div>
      )}

      <div className={`mt-6 max-w-2xl rounded-2xl ${modality.accent.bgSoft} border ${modality.accent.border} px-5 py-4`}>
        <div className={`text-[11px] font-bold uppercase tracking-wider ${modality.accent.text} mb-1`}>
          The cost shape
        </div>
        <div className="text-slate-800 text-sm leading-relaxed">{modality.whyExpensive}</div>
      </div>

      <div
        ref={calcRef}
        className={`mt-10 transition-shadow duration-500 rounded-3xl ${pulse ? `ring-4 ${modality.accent.ring}` : ''}`}
      >
        <Calculator
          modality={modality}
          inputs={inputs}
          onChange={setInputs}
          onReset={isModified ? resetInputs : undefined}
        />
      </div>

      <div className="mt-12">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            What real things cost
          </div>
          <div className="text-xs text-slate-400 italic">
            click a card to load it into the calculator ↑
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modality.scenarios.map(s => (
            <ScenarioCard
              key={s.title}
              scenario={s}
              accent={modality.accent}
              onApply={applyInputs}
            />
          ))}
        </div>
      </div>

      <DeepDive modality={modality} />
    </section>
  )
}
