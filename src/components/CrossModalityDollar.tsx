import { MODALITIES, defaultCost } from '../modalities'

// How much output you get from one dollar, per modality, using each modality's
// default calculator settings.
export function CrossModalityDollar() {
  const rows = MODALITIES.map(m => {
    const r = defaultCost(m)
    const perDollar = r.dollars > 0 ? 1 / r.dollars : 0
    return { m, perDollar, unitLabel: r.unitLabel, costEach: r.dollars }
  })

  const max = Math.max(...rows.map(r => r.perDollar))

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        The punchline
      </div>
      <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight max-w-3xl">
        Same $1. Wildly different amounts of stuff.
      </h2>
      <p className="mt-4 max-w-2xl text-slate-600 leading-relaxed">
        At the default settings for each calculator above, here's what a single dollar buys you.
      </p>

      <div className="mt-10 space-y-5 max-w-3xl">
        {rows.map(({ m, perDollar, unitLabel, costEach }) => {
          const width = max > 0 ? Math.max(4, (perDollar / max) * 100) : 0
          const label = formatPerDollar(perDollar, unitLabel)
          return (
            <div key={m.id}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-medium text-slate-800">{m.label}</span>
                <span className={`font-mono text-sm ${m.accent.text}`}>{label}</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${m.accent.bg} rounded-full transition-all duration-700`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ≈ ${costEach.toFixed(costEach < 0.01 ? 4 : 2)} each, at default settings
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 text-sm text-slate-600 max-w-2xl leading-relaxed">
        The takeaway isn't that one modality is "better" than another — it's that they live on totally
        different scales. A thousand AI images cost about as much as a single AI short film. Audio is
        nearly free per second; video is never free, and world models barely exist yet because the unit
        economics don't work <em>today</em>.
      </div>
    </section>
  )
}

function formatPerDollar(perDollar: number, unit: string) {
  if (!isFinite(perDollar) || perDollar <= 0) return 'n/a'
  const strip = unit.replace(/^per\s+/, '')
  if (perDollar >= 1) {
    return `${Math.round(perDollar).toLocaleString()} × ${strip}`
  }
  // If you get less than 1 whole output per dollar, flip to "$ per unit"
  return `$${(1 / perDollar).toFixed(2)} per ${strip}`
}
