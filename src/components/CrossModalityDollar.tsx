// "What your dollar buys you" — native units, no bars, each row sourced.
// The four modalities live on wildly different scales; the units themselves
// (counts vs seconds vs minutes) carry the punchline. Bars would pretend
// they're comparable, which they aren't.

interface Row {
  modality: string
  anchor: string          // in-page section id to jump to
  accent: string          // text color class
  amount: string          // the headline number
  unit: string            // what the number is of
  priced: boolean         // true = Vertex list price, false = estimated compute
  source: { label: string; href: string }
  note?: string
}

const ROWS: Row[] = [
  {
    modality: 'Images',
    anchor: 'zone-images',
    accent: 'text-indigo-600',
    amount: '15',
    unit: 'Nano Banana 2 images',
    priced: true,
    source: { label: 'Vertex AI pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: '$0.067 / image · Gemini 3.1 Flash Image at 1K',
  },
  {
    modality: 'Video',
    anchor: 'zone-video',
    accent: 'text-rose-600',
    amount: '10 seconds',
    unit: 'of Veo 3.1 Fast (720p, with audio)',
    priced: true,
    source: { label: 'Vertex AI pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: '$0.10 / second at 720p (post-4/7 cut from $0.15)',
  },
  {
    modality: 'Music',
    anchor: 'zone-audio',
    accent: 'text-emerald-600',
    amount: '~37 minutes',
    unit: 'of Lyria 3 Pro music (48 kHz WAV)',
    priced: true,
    source: { label: 'Vertex AI pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: '~$0.08 flat per song (≤3 min) · 12 songs/$'
  },
  {
    modality: 'Voice',
    anchor: 'zone-audio',
    accent: 'text-emerald-800',
    amount: '55 minutes',
    unit: 'of Gemini 3.1 Flash Live spoken output',
    priced: true,
    source: { label: 'Vertex AI pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: '$0.018 / min audio output ($0.005 / min input)',
  },
  {
    modality: 'World models',
    anchor: 'zone-world',
    accent: 'text-amber-600',
    amount: '~4.6 minutes',
    unit: 'of real-time world-model gameplay (est.)',
    priced: false,
    source: { label: 'Genie 3 — Google DeepMind', href: 'https://deepmind.google/models/genie/' },
    note: 'Not sold on any public API. Cost is a teaching estimate: ~4× H100 per session at blended retail ($2.16/GPU-hr × 1.5). Cluster size is not vendor-published.',
  },
]

export function CrossModalityDollar() {
  return (
    <section id="cross-modality" className="py-16 sm:py-24 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        The punchline
      </div>
      <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight max-w-3xl">
        What your dollar buys you.
      </h2>
      <p className="mt-4 max-w-2xl text-slate-600 leading-relaxed">
        One dollar, five modalities. Native units — because seconds of video and minutes of audio
        aren't the same thing, and pretending they are hides the actual story.
      </p>

      <div className="mt-10 max-w-3xl divide-y divide-slate-200/70 border-y border-slate-200/70">
        {ROWS.map(row => (
          <div key={row.modality} className="py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 items-baseline group -mx-3 px-3 rounded hover:bg-slate-50/60 transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <a
                  href={`#${row.anchor}`}
                  className={`text-sm font-semibold uppercase tracking-wider ${row.accent} hover:underline underline-offset-4`}
                >
                  {row.modality} ↓
                </a>
                {!row.priced && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    estimate
                  </span>
                )}
              </div>
              {row.note && (
                <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {row.note}
                </div>
              )}
            </div>
            <div className="sm:text-right">
              <div className="font-display text-3xl sm:text-4xl text-slate-900 leading-none">
                {row.amount}
              </div>
              <div className="text-sm text-slate-600 mt-1">{row.unit}</div>
              <a
                href={row.source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 mt-1.5"
              >
                {row.source.label} ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-slate-600 max-w-2xl leading-relaxed">
        Cost tracks how much work gets packed into a second of output. Text and voice are cheap
        because each word or syllable is tiny. An image is a few thousand of those pieces. A second
        of video is a fresh image every frame. A second of world-model gameplay is a video, generated
        live, per player. That's four orders of magnitude from the same dollar — which is why world
        models are still research-only and why "AI video" hasn't collapsed to "AI image" pricing yet.
      </div>
    </section>
  )
}
