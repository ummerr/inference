import { MODALITIES } from '../modalities'

export function Hero() {
  return (
    <header className="relative pt-20 sm:pt-32 pb-12 sm:pb-16">
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
      <p className="mt-6 text-base sm:text-lg font-medium text-slate-800 max-w-2xl leading-relaxed fade-up">
        Inference cost isn't a tax — it's a research problem. Every 10× drop in the last 18 months
        traces back to a specific architectural lever. Here's the map.
      </p>
      <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed fade-up">
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

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 fade-up">
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Where costs sit today
          </div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            ~$0.04 per image · $0.10–$0.40 per video-second · $0.005 per voice-minute ·
            cents per interactive world-minute.
          </p>
          <a href="#zone-images" className="mt-3 inline-block text-xs font-medium text-slate-500 hover:text-slate-800">
            See the math →
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Where the next 10× comes from
          </div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Step distillation for images. Sparse temporal attention for video.
            Speculative decoding for audio. Learned memory for worlds.
          </p>
          <a href="#/misc" className="mt-3 inline-block text-xs font-medium text-slate-500 hover:text-slate-800">
            Frontier frictions →
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Why this matters for Google
          </div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            Google ships across all four modalities — Veo, Imagen/Nano Banana, Lyria, Genie —
            on TPU, through Vertex. No other lab has that surface area.
          </p>
          <a href="#cross-modality" className="mt-3 inline-block text-xs font-medium text-slate-500 hover:text-slate-800">
            What a dollar buys →
          </a>
        </div>
      </div>
    </header>
  )
}
