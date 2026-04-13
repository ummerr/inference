import { useState } from 'react'
import type { Modality, Inputs, Field } from '../modalities'

export function Calculator({
  modality,
  inputs,
  onChange,
}: {
  modality: Modality
  inputs: Inputs
  onChange: (next: Inputs) => void
}) {
  const [showMath, setShowMath] = useState(false)
  const result = modality.calc(inputs)

  const set = (id: string, v: Inputs[string]) =>
    onChange({ ...inputs, [id]: v })

  return (
    <div className={`rounded-3xl border ${modality.accent.border} bg-white/80 backdrop-blur shadow-sm overflow-hidden`}>
      {modality.fields
        .filter((f): f is typeof f & { type: 'select' } => f.type === 'select' && (f as { prominent?: boolean }).prominent === true)
        .map(f => {
          const current = String(inputs[f.id])
          return (
            <div key={f.id} className={`flex border-b ${modality.accent.border} ${modality.accent.bgSoft}`}>
              {f.options.map(opt => {
                const isActive = current === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set(f.id, opt.value)}
                    className={[
                      'flex-1 px-4 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? `${modality.accent.bg} text-white`
                        : `${modality.accent.text} hover:bg-white/60`,
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )
        })}
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Play with the knobs</h3>
            <span className={`text-xs font-medium ${modality.accent.text}`}>{modality.label} calculator</span>
          </div>
          {modality.fields
            .filter(f => !(f.type === 'select' && (f as { prominent?: boolean }).prominent))
            .filter(f => !f.visibleWhen || f.visibleWhen(inputs))
            .map(f => (
              <FieldControl key={f.id} field={f} value={inputs[f.id]} onChange={v => set(f.id, v)} accent={modality.accent} />
            ))}
        </div>

        <div className={`p-5 sm:p-7 md:min-w-[280px] border-t md:border-t-0 md:border-l ${modality.accent.border} ${modality.accent.bgSoft}`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated cost</div>
          <div className={`font-display text-4xl sm:text-5xl leading-none mt-2 ${modality.accent.text}`}>
            {result.headline}
          </div>
          <div className="text-sm text-slate-600 mt-1">{result.sub}</div>

          <div className="mt-5 space-y-1.5">
            {result.breakdown.map(row => (
              <div key={row.label} className="flex justify-between text-xs text-slate-600 gap-3">
                <span>{row.label}</span>
                <span className="font-mono text-slate-800">{row.value}</span>
              </div>
            ))}
          </div>

          {result.warn && (
            <div className="mt-4 text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              ⚠️ {result.warn}
            </div>
          )}
        </div>
      </div>

      <div className={`border-t ${modality.accent.border} bg-white/60`}>
        <button
          type="button"
          onClick={() => setShowMath(v => !v)}
          aria-expanded={showMath}
          className="w-full flex items-center justify-between px-5 sm:px-7 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span>{showMath ? 'Hide' : 'Show'} the math</span>
          <svg
            viewBox="0 0 12 12"
            className={`w-3 h-3 ${modality.accent.text} transition-transform duration-200 ${showMath ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${showMath ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <MathBlock formula={modality.formula} accent={modality.accent} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MathBlock({ formula, accent }: { formula: string; accent: Modality['accent'] }) {
  const lines = formula.split('\n')
  return (
    <div className="px-5 sm:px-7 pb-5 pt-1 font-mono text-[11px] sm:text-xs leading-relaxed">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-3" aria-hidden="true" />

        // Whole-line comment (section header)
        if (line.trimStart().startsWith('#')) {
          return (
            <div key={i} className="text-slate-400 italic">
              {line}
            </div>
          )
        }

        // Split assignment from trailing inline comment
        const hashIdx = line.indexOf('#')
        const codePart = hashIdx >= 0 ? line.slice(0, hashIdx).trimEnd() : line
        const commentPart = hashIdx >= 0 ? line.slice(hashIdx) : ''

        // Split LHS and RHS on first '='
        const eqIdx = codePart.indexOf('=')
        const lhs = eqIdx >= 0 ? codePart.slice(0, eqIdx).trimEnd() : codePart
        const rhs = eqIdx >= 0 ? codePart.slice(eqIdx + 1).trimStart() : ''

        return (
          <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-slate-700">
            <span className="flex-1 min-w-0">
              {eqIdx >= 0 ? (
                <>
                  <span className={`${accent.text} font-semibold`}>{lhs}</span>
                  <span className="text-slate-400 mx-1.5">=</span>
                  <span>{rhs}</span>
                </>
              ) : (
                <span>{codePart}</span>
              )}
            </span>
            {commentPart && (
              <span className="text-slate-400 italic text-[10px] sm:text-[11px]">{commentPart}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldControl({
  field, value, onChange, accent,
}: {
  field: Field
  value: Inputs[string]
  onChange: (v: Inputs[string]) => void
  accent: Modality['accent']
}) {
  if (field.type === 'slider') {
    const v = Number(value)
    return (
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">{field.label}</label>
          <span className={`font-mono text-sm ${accent.text}`}>
            {v}{field.unit ?? ''}
          </span>
        </div>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={v}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-full accent-current ${accent.text}`}
        />
        {field.hint && (
          <div className="text-xs text-slate-500 mt-1">{field.hint(v)}</div>
        )}
      </div>
    )
  }
  if (field.type === 'toggle') {
    const v = Boolean(value)
    return (
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{field.label}</label>
          <button
            type="button"
            onClick={() => onChange(!v)}
            className={[
              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
              v ? `${accent.bg} text-white border-transparent` : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
            ].join(' ')}
          >
            {v ? field.onLabel : field.offLabel}
          </button>
        </div>
        {field.hint && <div className="text-xs text-slate-500 mt-1">{field.hint}</div>}
      </div>
    )
  }
  const v = String(value)
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-2">{field.label}</label>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map(opt => {
          const isActive = v === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                isActive ? `${accent.bg} text-white border-transparent` : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
              ].join(' ')}
              title={opt.hint}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
