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
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Play with the knobs</h3>
            <span className={`text-xs font-medium ${modality.accent.text}`}>{modality.label} calculator</span>
          </div>
          {modality.fields.map(f => (
            <FieldControl key={f.id} field={f} value={inputs[f.id]} onChange={v => set(f.id, v)} accent={modality.accent} />
          ))}
        </div>

        <div className={`p-5 sm:p-7 md:min-w-[280px] md:border-l ${modality.accent.border} ${modality.accent.bgSoft}`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated cost</div>
          <div className={`font-display text-5xl sm:text-6xl leading-none mt-2 ${modality.accent.text}`}>
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
          className="w-full flex items-center justify-between px-5 sm:px-7 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span>{showMath ? 'Hide' : 'Show'} the math</span>
          <span className={`font-mono ${modality.accent.text}`}>{showMath ? '−' : '+'}</span>
        </button>
        {showMath && (
          <pre className="px-5 sm:px-7 pb-5 text-[11px] sm:text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
{modality.formula}
          </pre>
        )}
      </div>
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
