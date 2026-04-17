import type { Inputs, Modality, Scenario } from '../modalities'

export function ScenarioCard({
  scenario,
  accent,
  onApply,
}: {
  scenario: Scenario
  accent: Modality['accent']
  onApply: (partial: Partial<Inputs>) => void
}) {
  const cardInteractive = Boolean(scenario.inputs)
  const loadable = cardInteractive && !scenario.tiers
  const Icon = scenario.icon

  const applyTier = (tierInputs?: Partial<Inputs>) => {
    if (!scenario.inputs && !tierInputs) return
    onApply({ ...(scenario.inputs ?? {}), ...(tierInputs ?? {}) })
  }

  return (
    <div
      className={[
        'group relative rounded-2xl border bg-white p-5 transition-all',
        accent.border,
        cardInteractive ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'hover:shadow-md',
      ].join(' ')}
      onClick={loadable ? () => applyTier() : undefined}
      role={loadable ? 'button' : undefined}
      tabIndex={loadable ? 0 : undefined}
      onKeyDown={
        loadable
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTier() } }
          : undefined
      }
    >
      {loadable && (
        <span
          className={`absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider ${accent.text} opacity-60 group-hover:opacity-100 transition-opacity`}
        >
          Load →
        </span>
      )}
      <Icon className={`w-5 h-5 ${accent.text}`} strokeWidth={1.75} aria-hidden="true" />
      <div className="mt-2 font-semibold text-slate-900">{scenario.title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{scenario.blurb}</div>

      {scenario.tiers ? (
        <div className="mt-3 space-y-0.5">
          {scenario.tiers.map((t) => {
            const clickable = Boolean(scenario.inputs || t.inputs)
            return (
              <button
                key={t.label}
                type="button"
                disabled={!clickable}
                onClick={(e) => { e.stopPropagation(); applyTier(t.inputs) }}
                className={[
                  'w-full flex items-baseline justify-between gap-3 border-b border-slate-100 last:border-0 py-1.5 text-left',
                  clickable ? `hover:${accent.bgSoft} rounded-md px-1 -mx-1 transition-colors` : 'cursor-default',
                ].join(' ')}
              >
                <span className="text-xs text-slate-600">{t.label}</span>
                <span className={`font-display text-lg ${accent.text}`}>{t.cost}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className={`font-display text-3xl mt-3 ${accent.text}`}>{scenario.cost}</div>
      )}

      <div className="text-xs text-slate-500 mt-2 italic">{scenario.footnote}</div>
    </div>
  )
}
