import { MODALITIES } from '../modalities'

export function Hero() {
  return (
    <header className="relative pt-20 sm:pt-32 pb-16 sm:pb-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="blob absolute -top-10 -right-10 w-[420px] h-[420px] rounded-full bg-indigo-300/40" />
        <div className="blob absolute top-40 -left-16 w-[360px] h-[360px] rounded-full bg-rose-300/40" style={{ animationDelay: '-6s' }} />
        <div className="blob absolute top-80 right-1/3 w-[320px] h-[320px] rounded-full bg-emerald-300/30" style={{ animationDelay: '-12s' }} />
      </div>

      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 fade-up">
        Gen Media Inference · 101
      </div>
      <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-slate-900 mt-4 fade-up">
        What does it <em className="italic">actually</em> cost
        <br />
        to generate a <span className="text-indigo-500">picture</span>,
        a <span className="text-rose-500">video</span>,
        a <span className="text-emerald-500">song</span>,
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
