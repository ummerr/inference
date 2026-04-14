import { useEffect } from 'react'
import { useRoute } from '../router'
import { Claim } from '../components/Claim'
import { NapkinMath } from '../components/NapkinMath'

type Friction = {
  id: string
  title: string
  color: { text: string; bg: string; border: string; bgSoft: string }
  bottleneck: string
  tenX: string
  papers: { label: string; href: string }[]
}

const FRICTIONS: Friction[] = [
  {
    id: 'images',
    title: 'Images',
    color: { text: 'text-indigo-700', bg: 'bg-indigo-600', border: 'border-indigo-200', bgSoft: 'bg-indigo-50' },
    bottleneck: 'Step count is the wall. Each denoising pass is a full U-Net/DiT forward. Cutting passes from ~25 to ~4 via distillation has been the main source of recent cost drops — at the price of a slightly narrower quality envelope at the top end.',
    tenX: 'A 10× cheaper image needs either single-step generation that holds diversity, or aggressive architectural sparsity (MoE, block-sparse attention). Hardware alone won\'t do it.',
    papers: [
      { label: 'Consistency Models (Song et al., 2023)', href: 'https://arxiv.org/abs/2303.01469' },
      { label: 'Latent Consistency Models (Luo et al., 2023)', href: 'https://arxiv.org/abs/2310.04378' },
      { label: 'Adversarial Diffusion Distillation (Sauer et al., 2023)', href: 'https://arxiv.org/abs/2311.17042' },
    ],
  },
  {
    id: 'video',
    title: 'Video',
    color: { text: 'text-rose-700', bg: 'bg-rose-600', border: 'border-rose-200', bgSoft: 'bg-rose-50' },
    bottleneck: 'Temporal attention memory. Frames are not independent — each frame attends across a context window, and the KV-cache grows with length × resolution × layers. HBM bandwidth, not FLOPs, is usually the binding constraint on long clips.',
    tenX: 'A 10× cheaper second of video needs sub-quadratic temporal attention (linear or state-space variants), better frame-token compression, or hierarchical generation that plans once and fills in cheaply.',
    papers: [
      { label: 'Lumiere: Space-Time Diffusion (Bar-Tal et al., 2024)', href: 'https://arxiv.org/abs/2401.12945' },
      { label: 'VideoPoet (Kondratyuk et al., 2024)', href: 'https://arxiv.org/abs/2312.14125' },
      { label: 'Veo technical overview', href: 'https://deepmind.google/technologies/veo/' },
    ],
  },
  {
    id: 'audio',
    title: 'Audio',
    color: { text: 'text-emerald-700', bg: 'bg-emerald-600', border: 'border-emerald-200', bgSoft: 'bg-emerald-50' },
    bottleneck: 'Streaming latency budgets. Live voice has to produce tokens faster than they\'re spoken, with a KV-cache that grows linearly with dialogue length. Quality-of-service degrades the moment a single batch slot misses its frame.',
    tenX: 'A 10× cheaper minute of live voice needs aggressive cache eviction, speculative decoding tuned for audio tokenizers, and tighter co-design between the acoustic model and the streaming scheduler.',
    papers: [
      { label: 'AudioLM (Borsos et al., 2022)', href: 'https://arxiv.org/abs/2209.03143' },
      { label: 'MusicLM (Agostinelli et al., 2023)', href: 'https://arxiv.org/abs/2301.11325' },
      { label: 'Speculative Decoding (Leviathan et al., 2023)', href: 'https://arxiv.org/abs/2211.17192' },
    ],
  },
  {
    id: 'world',
    title: 'World',
    color: { text: 'text-amber-700', bg: 'bg-amber-600', border: 'border-amber-200', bgSoft: 'bg-amber-50' },
    bottleneck: 'Interactive world models have to generate, render, and remain consistent under user input — all inside a single frame budget. Persistence of state across long sessions is the open problem: the model has to remember what it drew five minutes ago without re-paying full attention cost.',
    tenX: 'A 10× cheaper interactive minute needs world-state compression that isn\'t just a growing KV-cache — some form of learned scene graph or neural memory that can be read cheaply and written sparsely.',
    papers: [
      { label: 'Genie: Generative Interactive Environments (Bruce et al., 2024)', href: 'https://arxiv.org/abs/2402.15391' },
      { label: 'SIMA: Scalable Instructable Multiworld Agent', href: 'https://deepmind.google/discover/blog/sima-generalist-ai-agent-for-3d-virtual-environments/' },
      { label: 'World Models (Ha & Schmidhuber, 2018)', href: 'https://arxiv.org/abs/1803.10122' },
    ],
  },
]

const SWAP_ROWS: { id: string; modality: string; list: string; gpuSec: string; note: string }[] = [
  { id: 'swap-image', modality: 'Image (1024²)', list: '$0.039', gpuSec: '~65 GPU-s on H100', note: '25 denoising passes × ~2.5 GPU-s per pass. Batching hides most of it.' },
  { id: 'swap-video', modality: 'Video (1s, 720p)', list: '$0.40', gpuSec: '~670 GPU-s H100-equiv', note: '~24 frames × spatio-temporal attention; memory-bound more than compute-bound.' },
  { id: 'swap-world', modality: 'World (1 min interactive)', list: 'tier-dependent', gpuSec: '~1200 GPU-s H100-equiv', note: 'Frame budget is the constraint; utilization is the lever.' },
]

export function MiscPage() {
  const route = useRoute()

  useEffect(() => {
    const claim = route.query.get('c')
    if (!claim) return
    const el = document.getElementById(claim)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [route])

  return (
    <div className="min-h-screen text-slate-900">
      <MiscNav />
      <main className="max-w-5xl mx-auto px-5 sm:px-8">
        <Header />
        <UnitSwap />
        <VideoPriceWatch />
        <FrontierFrictions />
        <Playground />
        <BridgeFooter />
      </main>
    </div>
  )
}

function MiscNav() {
  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/60">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        <a href="#/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">← Inference 101</a>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Misc</span>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <a href="#unit-swap" className="hover:text-slate-900">Unit swap</a>
          <a href="#video-price-watch" className="hover:text-slate-900">Prices</a>
          <a href="#frontier-frictions" className="hover:text-slate-900">Frictions</a>
          <a href="#playground" className="hover:text-slate-900">Napkin</a>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <section className="pt-16 sm:pt-24 pb-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-4">Misc — companion notes</div>
      <h1 className="font-display text-4xl sm:text-6xl leading-[1.05]">
        The bill is a shadow.
        <br />
        <em className="text-slate-500">Here's the object casting it.</em>
      </h1>
      <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-2xl">
        Page one translates Gen Media workloads into dollars. This page translates them back — into FLOPs,
        GPU-seconds, and the utilization gap that explains most of the delta. Same modalities, different slice.
      </p>
    </section>
  )
}

function UnitSwap() {
  return (
    <section id="unit-swap" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="01" title="Unit swap" lede="Re-expressing list prices as physical quantities. Numbers are illustrative, shape-correct." />

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 overflow-hidden">
        <div className="grid grid-cols-[1.1fr_0.8fr_1fr_2fr] text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200/70 bg-slate-50/60">
          <div className="px-5 py-3">Modality</div>
          <div className="px-5 py-3">List</div>
          <div className="px-5 py-3">GPU-seconds</div>
          <div className="px-5 py-3">Where the money goes</div>
        </div>
        {SWAP_ROWS.map((r, i) => (
          <Claim key={r.id} id={r.id}>
            <div className={`grid grid-cols-[1.1fr_0.8fr_1fr_2fr] text-sm ${i > 0 ? 'border-t border-slate-200/60' : ''}`}>
              <div className="px-5 py-4 font-medium">{r.modality}</div>
              <div className="px-5 py-4 font-mono text-slate-700">{r.list}</div>
              <div className="px-5 py-4 font-mono text-slate-700">{r.gpuSec}</div>
              <div className="px-5 py-4 text-slate-600">{r.note}</div>
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-600 leading-relaxed max-w-3xl">
        The list price is what you pay. The GPU-second count is what the hardware actually did. The delta is batching efficiency, proprietary silicon (TPU), amortized cache hits, and margin — in roughly that order.
      </div>
    </section>
  )
}

type Confidence = 'High' | 'Medium' | 'Low'

type VideoPriceRow = {
  id: string
  provider: string
  model: string
  variant: string
  pricePerSec: string
  perMinute: string
  sourceTier: 'Official' | 'Reseller' | 'Third-party'
  confidence: Confidence
  confidenceReason: string
  source: { label: string; href: string }
  note: string
}

const VIDEO_PRICES: VideoPriceRow[] = [
  {
    id: 'price-grok-imagine',
    provider: 'xAI',
    model: 'Grok Imagine Video',
    variant: '720p + audio',
    pricePerSec: '$0.050',
    perMinute: '$3.00',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Scraped directly from docs.x.ai with model ID and rate limit.',
    source: { label: 'docs.x.ai/models', href: 'https://docs.x.ai/docs/models' },
    note: 'Model ID grok-imagine-video. 60 RPM. Batch API gives no discount on generation.',
  },
  {
    id: 'price-veo-31-lite',
    provider: 'Google',
    model: 'Veo 3.1 Lite',
    variant: 'Vertex AI, no audio',
    pricePerSec: '$0.05',
    perMinute: '$3.00',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Already used elsewhere on this site; anchored to Vertex AI Veo pricing page.',
    source: { label: 'Vertex AI Veo pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: 'Floor tier. 4/6/8s durations only.',
  },
  {
    id: 'price-veo-31-fast',
    provider: 'Google',
    model: 'Veo 3.1 Fast',
    variant: 'Vertex AI, w/ audio',
    pricePerSec: '$0.10',
    perMinute: '$6.00',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Anchored to Vertex AI Veo pricing; same source as rest of site.',
    source: { label: 'Vertex AI Veo pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: 'Middle tier. Audio included.',
  },
  {
    id: 'price-veo-31-standard',
    provider: 'Google',
    model: 'Veo 3.1 Standard',
    variant: 'Vertex AI, w/ audio',
    pricePerSec: '$0.40',
    perMinute: '$24.00',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Post-April-7 2026 price cut. Anchored to Vertex pricing page used site-wide.',
    source: { label: 'Vertex AI Veo pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
    note: 'Flagship. 6s clip = $2.40. Supports 4/6/8s durations.',
  },
  {
    id: 'price-runway-gen4-turbo',
    provider: 'Runway',
    model: 'Gen-4 Turbo',
    variant: 'Runway API',
    pricePerSec: '$0.05',
    perMinute: '$3.00',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Scraped runway developer docs; credit math is explicit (5 credits × $0.01).',
    source: { label: 'docs.dev.runwayml.com/pricing', href: 'https://docs.dev.runwayml.com/guides/pricing/' },
    note: '5 credits/sec. Draft-tier model.',
  },
  {
    id: 'price-runway-gen4',
    provider: 'Runway',
    model: 'Gen-4.5',
    variant: 'Runway API',
    pricePerSec: '$0.12',
    perMinute: '$7.20',
    sourceTier: 'Official',
    confidence: 'High',
    confidenceReason: 'Scraped runway developer docs. gen4_aleph variant = 15 credits/sec ($0.15/sec).',
    source: { label: 'docs.dev.runwayml.com/pricing', href: 'https://docs.dev.runwayml.com/guides/pricing/' },
    note: '12 credits/sec × $0.01/credit.',
  },
  {
    id: 'price-kling-25-turbo',
    provider: 'Kuaishou',
    model: 'Kling 2.5 Turbo Pro',
    variant: 'fal.ai',
    pricePerSec: '$0.07',
    perMinute: '$4.20',
    sourceTier: 'Reseller',
    confidence: 'High',
    confidenceReason: 'Scraped fal.ai model page. Base rate confirmed ($0.35 flat for first 5s + $0.07/sec).',
    source: { label: 'fal.ai model page', href: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video' },
    note: 'Flat $0.35 baseline for 5s, then $0.07/sec. Direct Kuaishou API rates not checked.',
  },
  {
    id: 'price-seedance-fal-fast',
    provider: 'ByteDance',
    model: 'Seedance 2.0 Fast',
    variant: 'fal.ai, 720p + audio',
    pricePerSec: '$0.2419',
    perMinute: '$14.51',
    sourceTier: 'Reseller',
    confidence: 'High',
    confidenceReason: 'Scraped fal.ai model page with explicit billing formula.',
    source: { label: 'fal.ai model page', href: 'https://fal.ai/models/bytedance/seedance-2.0/fast/text-to-video' },
    note: 'Billed as h × w × duration × 24 / 1024.',
  },
  {
    id: 'price-seedance-fal-std',
    provider: 'ByteDance',
    model: 'Seedance 2.0',
    variant: 'fal.ai, 720p + audio',
    pricePerSec: '$0.3034',
    perMinute: '$18.20',
    sourceTier: 'Reseller',
    confidence: 'High',
    confidenceReason: 'Scraped fal.ai model page.',
    source: { label: 'fal.ai model page', href: 'https://fal.ai/models/bytedance/seedance-2.0/text-to-video' },
    note: 'Duration 4–15s. No 1080p variant on fal.',
  },
  {
    id: 'price-seedance-volcengine',
    provider: 'ByteDance',
    model: 'Seedance 2.0',
    variant: 'Volcengine direct, 1080p',
    pricePerSec: '$0.14',
    perMinute: '$8.40',
    sourceTier: 'Third-party',
    confidence: 'Low',
    confidenceReason: 'TechNode estimate at 1 RMB/sec. Volcengine Ark GA still gated — no official English pricing page to verify.',
    source: { label: 'TechNode 2026-03-05', href: 'https://technode.com/2026/03/05/bytedances-seedance-2-0-video-model-costs-about-0-14-per-second/' },
    note: '≈1 RMB/sec at fx 1USD=7.2CNY. Token meter: 46 RMB per 1M output tokens.',
  },
]

const TIER_STYLE: Record<VideoPriceRow['sourceTier'], string> = {
  Official: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Reseller: 'bg-amber-50 text-amber-700 border-amber-200',
  'Third-party': 'bg-slate-50 text-slate-600 border-slate-200',
}

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  High: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-rose-50 text-rose-700 border-rose-200',
}

const PROVIDER_DOMAIN: Record<string, string> = {
  xAI: 'x.ai',
  Google: 'deepmind.google',
  Runway: 'runwayml.com',
  Kuaishou: 'klingai.com',
  ByteDance: 'bytedance.com',
}

function VideoPriceWatch() {
  return (
    <section id="video-price-watch" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="02" title="Video price watch" lede="List prices for frontier video APIs, scraped from provider docs. Snapshot — refresh via the scrape-genmedia-prices skill." />

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 overflow-hidden">
        <div className="grid grid-cols-[1.3fr_1.1fr_0.65fr_0.65fr_0.85fr_0.85fr_1.7fr] text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200/70 bg-slate-50/60">
          <div className="px-5 py-3">Model</div>
          <div className="px-5 py-3">Variant</div>
          <div className="px-5 py-3">$ / sec</div>
          <div className="px-5 py-3">$ / min</div>
          <div className="px-5 py-3">Source tier</div>
          <div className="px-5 py-3">Confidence</div>
          <div className="px-5 py-3">Notes</div>
        </div>
        {VIDEO_PRICES.map((r, i) => (
          <Claim key={r.id} id={r.id}>
            <div className={`grid grid-cols-[1.3fr_1.1fr_0.65fr_0.65fr_0.85fr_0.85fr_1.7fr] text-sm ${i > 0 ? 'border-t border-slate-200/60' : ''}`}>
              <div className="px-5 py-4 flex items-start gap-2.5">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${PROVIDER_DOMAIN[r.provider] ?? r.provider.toLowerCase() + '.com'}&sz=64`}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="w-4 h-4 mt-0.5 rounded-sm shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-medium">{r.model}</div>
                  <div className="text-xs text-slate-500">{r.provider}</div>
                </div>
              </div>
              <div className="px-5 py-4 text-slate-700">{r.variant}</div>
              <div className="px-5 py-4 font-mono text-slate-900">{r.pricePerSec}</div>
              <div className="px-5 py-4 font-mono text-slate-700">{r.perMinute}</div>
              <div className="px-5 py-4">
                <span className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${TIER_STYLE[r.sourceTier]}`}>{r.sourceTier}</span>
              </div>
              <div className="px-5 py-4">
                <span
                  title={r.confidenceReason}
                  className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${CONFIDENCE_STYLE[r.confidence]}`}
                >
                  {r.confidence}
                </span>
              </div>
              <div className="px-5 py-4 text-slate-600">
                <div>{r.note}</div>
                <a href={r.source.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-slate-500 hover:text-slate-900 underline decoration-slate-300">{r.source.label}</a>
              </div>
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-600 leading-relaxed max-w-3xl space-y-3">
        <p>
          Snapshot from 2026-04-14. <span className="font-medium">Source tier</span> matters more than the headline number: <em>Official</em> means the provider's own pricing doc; <em>Reseller</em> is a hosted inference platform (fal, Replicate) that adds margin and infra; <em>Third-party</em> is a news or blog quote, so trust it less.
        </p>
        <p>
          Three price bands are forming. A <span className="font-medium">$0.05/sec floor</span> (Grok Imagine, Runway Gen-4 Turbo, Veo 3.1 Lite) for draft-tier 720p, a <span className="font-medium">$0.07–0.14/sec mid band</span> (Kling 2.5 Turbo, Runway Gen-4.5, Seedance direct), and a <span className="font-medium">$0.24–0.40/sec flagship band</span> (Seedance on fal, Veo 3.1 Standard). Confidence is <em>High</em> on every row except Seedance-direct, where the Volcengine Ark API still isn't publicly GA and we're reading a TechNode estimate. Hover the confidence chip for the reason.
        </p>
      </div>
    </section>
  )
}

function FrontierFrictions() {
  return (
    <section id="frontier-frictions" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="03" title="Frontier frictions" lede="What's actually hard right now. One card per modality — bottleneck, what a 10× cost drop would require, and papers worth reading." />

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {FRICTIONS.map(f => (
          <Claim key={f.id} id={`friction-${f.id}`}>
            <div className={`rounded-2xl border ${f.color.border} ${f.color.bgSoft} p-5 sm:p-6 h-full`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${f.color.text} mb-3`}>{f.title}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Bottleneck</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{f.bottleneck}</p>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">What a 10× drop needs</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{f.tenX}</p>
              <div className="pt-3 border-t border-white/80 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Further reading: </span>
                {f.papers.map((p, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-1">·</span>}
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className={`${f.color.text} hover:underline`}>{p.label}</a>
                  </span>
                ))}
              </div>
            </div>
          </Claim>
        ))}
      </div>
    </section>
  )
}

function Playground() {
  return (
    <section id="playground" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="04" title="Back-of-envelope playground" lede="Inference cost from first principles. Four numbers in, three-line derivation out. The URL encodes your inputs — share it." />
      <div className="mt-8">
        <NapkinMath />
      </div>
      <div className="mt-4 text-xs text-slate-500 leading-relaxed max-w-3xl">
        This treats every forward pass as dense FP16 on an H100. It ignores attention cost scaling with context length, MoE sparsity, and quantization wins. It gets you to within a factor of ~2 for most dense transformers — close enough to argue about.
      </div>
    </section>
  )
}

function BridgeFooter() {
  return (
    <footer className="py-16 text-center border-t border-slate-200/60 mt-12">
      <div className="text-sm text-slate-500 mb-3">Now that you know why —</div>
      <a href="#/" className="inline-block text-xl font-display italic text-slate-700 hover:text-slate-900 transition-colors">
        go see what it costs →
      </a>
    </footer>
  )
}

function SectionHeader({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <div>
      <div className="text-[11px] font-mono text-slate-400 mb-2">{kicker}</div>
      <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
      <p className="mt-3 text-slate-600 leading-relaxed max-w-2xl">{lede}</p>
    </div>
  )
}
