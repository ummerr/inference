import type { Modality, Scenario } from '../modalities'

export function ScenarioCard({ scenario, accent }: { scenario: Scenario; accent: Modality['accent'] }) {
  return (
    <div className={`rounded-2xl border ${accent.border} bg-white p-5 hover:shadow-md transition-shadow`}>
      <div className="text-2xl">{scenario.icon}</div>
      <div className="mt-2 font-semibold text-slate-900">{scenario.title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{scenario.blurb}</div>
      <div className={`font-display text-3xl mt-3 ${accent.text}`}>{scenario.cost}</div>
      <div className="text-xs text-slate-500 mt-1 italic">{scenario.footnote}</div>
    </div>
  )
}
