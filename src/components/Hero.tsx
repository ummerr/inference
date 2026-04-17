export function Hero() {
  return (
    <header className="relative pt-20 sm:pt-32 pb-12 sm:pb-16">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 fade-up">
        Gen Media Inference · 101
      </div>
      <h1 className="font-display text-[2.5rem] sm:text-7xl md:text-8xl leading-[0.95] text-slate-900 mt-4 fade-up text-balance text-pretty">
        What does it <em className="italic">actually</em> cost to generate a <span className="text-indigo-500">picture</span>, a <span className="text-rose-500">video</span>, a bit of <span className="text-emerald-600">audio</span>, a <span className="text-amber-500">world</span>?
      </h1>
      <p className="mt-6 text-lg sm:text-xl font-medium text-slate-800 max-w-2xl leading-relaxed fade-up">
        Every 10× price drop in the last 18 months traces back to a specific architectural lever. Here's the map.
      </p>

      <div className="mt-8 fade-up">
        <a
          href="#cross-modality"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          See what $1 buys →
        </a>
      </div>

    </header>
  )
}
