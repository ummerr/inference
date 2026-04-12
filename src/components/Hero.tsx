import { MODALITIES } from '../modalities'

export function Hero() {
  return (
    <header className="relative pt-20 sm:pt-32 pb-16 sm:pb-24">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 fade-up">
        Gen Media Inference · 101
      </div>
      <h1 className="font-display text-[2.5rem] sm:text-7xl md:text-8xl leading-[0.95] text-slate-900 mt-4 fade-up break-words">
        What does it <em className="italic">actually</em> cost
        <br />
        to generate a <span className="text-indigo-500">picture</span>,
        a <span className="text-rose-500">video</span>,
        a bit of <span className="text-emerald-600">audio</span>,
        a <span className="text-amber-500">world</span>?
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed fade-up">
        A playful, honest tour of how Gen Media models run — and why the bill looks the way it does.
        Play with the knobs. Watch the price change. Build intuition.
      </p>

      <div className="mt-8 flex flex-wrap gap-2 fade-up">
        {MODALITIES.map(m => (
          <a
            key={m.id}
            href={`#zone-${m.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium ${m.accent.bgSoft} ${m.accent.text} border ${m.accent.border} hover:brightness-95 transition`}
          >
            {m.label} →
          </a>
        ))}
      </div>
    </header>
  )
}
