import type { Modality } from '../modalities'
import { Calculator } from './Calculator'
import { ScenarioCard } from './ScenarioCard'
import { DeepDive } from './DeepDive'

export function ModalityZone({ modality }: { modality: Modality }) {
  return (
    <section id={`zone-${modality.id}`} className="scroll-mt-20 py-16 sm:py-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${modality.accent.bg}`} />
        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${modality.accent.text}`}>
          {modality.label}
        </span>
      </div>
      <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-slate-900 leading-[1.05] max-w-3xl">
        {modality.tagline}
      </h2>

      {/* Primer */}
      <div className="mt-6 max-w-2xl space-y-4 text-slate-700 leading-relaxed">
        {modality.primer.map((p, i) => (
          <p key={i} className={i === 0 ? 'text-lg' : ''}>{p}</p>
        ))}
      </div>

      {/* Why expensive */}
      <div className={`mt-6 max-w-2xl rounded-2xl ${modality.accent.bgSoft} border ${modality.accent.border} px-5 py-4`}>
        <div className={`text-[11px] font-bold uppercase tracking-wider ${modality.accent.text} mb-1`}>
          The cost shape
        </div>
        <div className="text-slate-800 text-sm leading-relaxed">{modality.whyExpensive}</div>
      </div>

      {/* Calculator */}
      <div className="mt-10">
        <Calculator modality={modality} />
      </div>

      {/* Scenarios */}
      <div className="mt-12">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          What real things cost
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modality.scenarios.map(s => (
            <ScenarioCard key={s.title} scenario={s} accent={modality.accent} />
          ))}
        </div>
      </div>

      {/* Deep dive */}
      <DeepDive modality={modality} />
    </section>
  )
}
