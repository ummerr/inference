import { useEffect, useMemo, type ReactNode } from 'react'
import { useRoute, useQueryState } from '../router'
import { Claim } from '../components/Claim'
import { NapkinMath } from '../components/NapkinMath'
import { ModalityNav } from '../components/ModalityNav'
import genmediaPrices from '../../data/genmedia-prices.json'

type Friction = {
  id: string
  title: string
  color: { text: string; bg: string; border: string; bgSoft: string }
  bottleneck: string
  tenX: string
  delta: string
  zoneId: string
  papers: { label: string; href: string }[]
}

const FRICTIONS: Friction[] = [
  {
    id: 'images',
    title: 'Images',
    color: { text: 'text-indigo-700', bg: 'bg-indigo-600', border: 'border-indigo-200', bgSoft: 'bg-indigo-50' },
    bottleneck: 'Step count is the wall. Each denoising pass is a full U-Net/DiT forward. Cutting passes from ~25 to ~4 via distillation has been the main source of recent cost drops — at the price of a slightly narrower quality envelope at the top end.',
    tenX: 'A 10× cheaper image needs either single-step generation that holds diversity, or aggressive architectural sparsity (MoE, block-sparse attention). Hardware alone won\'t do it.',
    delta: '25 → 4 passes via distillation ≈ 6× cheaper at equal quality.',
    zoneId: 'images',
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
    delta: 'Veo 3.1 Standard dropped to $0.40/sec on 2026-04-07 — 60% cut in one release.',
    zoneId: 'video',
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
    delta: 'Speculative decoding delivers ~2–3× throughput wins on dense LMs — audio is the next front.',
    zoneId: 'audio',
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
    delta: 'Genie-class demos cap at minutes, not hours — memory is still the ceiling, not compute.',
    zoneId: 'world',
    papers: [
      { label: 'Genie: Generative Interactive Environments (Bruce et al., 2024)', href: 'https://arxiv.org/abs/2402.15391' },
      { label: 'SIMA: Scalable Instructable Multiworld Agent', href: 'https://deepmind.google/discover/blog/sima-generalist-ai-agent-for-3d-virtual-environments/' },
      { label: 'World Models (Ha & Schmidhuber, 2018)', href: 'https://arxiv.org/abs/1803.10122' },
    ],
  },
]

type Scenario = {
  id: string
  icon: string
  title: string
  blurb: string
  params: string
  tokens: string
  rate: string
  util: string
}

const SCENARIOS: Scenario[] = [
  { id: 'chat-7b', icon: '💬', title: '7B chat reply', blurb: '~1k tokens, spot H100, healthy batch', params: '7', tokens: '1000', rate: '0.0004', util: '0.4' },
  { id: 'llama-70b', icon: '🦙', title: 'Llama-70B answer', blurb: '~500 tokens, retail H100 rate', params: '70', tokens: '500', rate: '0.0006', util: '0.3' },
  { id: 'frontier-400b', icon: '🧠', title: 'Frontier dense 400B', blurb: 'Treated as dense — MoE wins ignored', params: '400', tokens: '500', rate: '0.0008', util: '0.25' },
  { id: 'long-ctx-30b', icon: '📚', title: 'Long-context 30B @ 32k', blurb: 'Attention cost not modeled — floor only', params: '30', tokens: '32000', rate: '0.0006', util: '0.35' },
  { id: 'edge-1b', icon: '📱', title: 'Edge 1.5B on cheap silicon', blurb: 'High util, low rate, short reply', params: '1.5', tokens: '1000', rate: '0.0002', util: '0.5' },
  { id: 'batch-throughput', icon: '⚙️', title: 'Batched 70B throughput', blurb: 'Push util to the ceiling', params: '70', tokens: '1000', rate: '0.0006', util: '0.6' },
]

type CostEvent = {
  id: string
  date: string
  provider: string
  model: string
  headline: string
  detail: string
  href: string
}

const COST_EVENTS: CostEvent[] = [
  {
    id: 'evt-veo-31-cut',
    date: '2026-04-07',
    provider: 'Google',
    model: 'Veo 3.1 Standard',
    headline: '$1.00 → $0.40 / sec (flagship cut)',
    detail: '60% price drop on the Vertex AI flagship tier with audio. 6s clip now $2.40.',
    href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing',
  },
  {
    id: 'evt-grok-imagine-ga',
    date: '2026-04-14',
    provider: 'xAI',
    model: 'Grok Imagine Video',
    headline: '$0.05 / sec at GA',
    detail: 'xAI publishes docs; 720p with audio at 60 RPM. Batch API offers no generation discount.',
    href: 'https://docs.x.ai/docs/models',
  },
  {
    id: 'evt-seedance-ark',
    date: '2026-03-05',
    provider: 'ByteDance',
    model: 'Seedance 2.0 (Volcengine)',
    headline: '~$0.14 / sec estimate (Ark direct)',
    detail: 'TechNode reports ≈1 RMB/sec on Volcengine Ark — direct-API pricing still gated, reseller routes remain the verifiable path.',
    href: 'https://technode.com/2026/03/05/bytedances-seedance-2-0-video-model-costs-about-0-14-per-second/',
  },
]

const SWAP_ROWS: { id: string; modality: string; list: string; gpuSec: string; note: string; accent: string }[] = [
  { id: 'swap-image', modality: 'Image (1024²)', list: '$0.039', gpuSec: '~65 GPU-s on H100', note: '25 denoising passes × ~2.5 GPU-s per pass. Batching hides most of it.', accent: 'bg-indigo-500' },
  { id: 'swap-video', modality: 'Video (1s, 720p)', list: '$0.40', gpuSec: '~670 GPU-s H100-equiv', note: '~24 frames × spatio-temporal attention; memory-bound more than compute-bound.', accent: 'bg-rose-500' },
  { id: 'swap-world', modality: 'World (1 min interactive)', list: 'tier-dependent', gpuSec: '~1200 GPU-s H100-equiv', note: 'Frame budget is the constraint; utilization is the lever.', accent: 'bg-amber-500' },
]

const PROVIDER_ACCENT: Record<string, string> = {
  Google: 'bg-blue-500',
  xAI: 'bg-slate-900',
  ByteDance: 'bg-rose-500',
  Runway: 'bg-violet-500',
  Kuaishou: 'bg-amber-500',
}

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
      <ModalityNav />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-3 text-xs text-slate-500 border-b border-slate-200/40">
        <SectionLink id="unit-swap">Unit swap</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="cost-drops">Drops</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="video-price-watch">Prices</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="frontier-frictions">Frictions</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="playground">Napkin</SectionLink>
      </div>
      <main className="max-w-5xl mx-auto px-5 sm:px-8">
        <Header />
        <UnitSwap />
        <CostDropTracker />
        <VideoPriceWatch />
        <FrontierFrictions />
        <Playground />
        <BridgeFooter />
      </main>
    </div>
  )
}

function SectionLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <a
      href={`#/misc?c=${id}`}
      onClick={(e) => {
        e.preventDefault()
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      className="hover:text-slate-900"
    >
      {children}
    </a>
  )
}

function Header() {
  return (
    <section className="pt-16 sm:pt-24 pb-10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-4">Under the hood</div>
      <h1 className="font-display text-4xl sm:text-6xl leading-[1.05]">
        The physics behind the bill.
      </h1>
      <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-2xl">
        A live, sourced, first-principles counterweight to the modality zones. Scraped prices from provider docs,
        GPU-seconds instead of dollars, the bottlenecks a 10× drop would have to break, and a napkin calculator
        that shows its work.
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
            <div className={`relative grid grid-cols-[1.1fr_0.8fr_1fr_2fr] text-sm ${i > 0 ? 'border-t border-slate-200/60' : ''}`}>
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${r.accent}`} aria-hidden="true" />
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

type RawEntry = typeof genmediaPrices.entries[number]

type TierKey = 'official' | 'official_reseller' | 'third_party'

type VideoPriceRow = {
  id: string
  provider: string
  providerKey: string
  model: string
  variant: string
  pricePerSec: string
  pricePerSecNum: number
  perMinute: string
  sourceTier: 'Official' | 'Reseller' | 'Third-party'
  sourceTierKey: TierKey
  confidence: Confidence
  confidenceReason: string
  source: { label: string; href: string }
  note: string
}

const PROVIDER_DISPLAY: Record<string, string> = {
  xai: 'xAI',
  google: 'Google',
  runway: 'Runway',
  kuaishou: 'Kuaishou',
  bytedance: 'ByteDance',
}

const PROVIDER_DOMAIN: Record<string, string> = {
  xai: 'x.ai',
  google: 'deepmind.google',
  runway: 'runwayml.com',
  kuaishou: 'klingai.com',
  bytedance: 'bytedance.com',
}

const TIER_DISPLAY: Record<TierKey, VideoPriceRow['sourceTier']> = {
  official: 'Official',
  official_reseller: 'Reseller',
  third_party: 'Third-party',
}

const MODEL_DISPLAY: Record<string, string> = {
  'xai:grok-imagine-video:1.0': 'Grok Imagine Video',
  'google:veo:3.1-lite': 'Veo 3.1 Lite',
  'google:veo:3.1-fast': 'Veo 3.1 Fast',
  'google:veo:3.1-standard': 'Veo 3.1 Standard',
  'runway:gen4-turbo:4.0': 'Gen-4 Turbo',
  'runway:gen4.5:4.5': 'Gen-4.5',
  'kuaishou:kling:2.5-turbo-pro': 'Kling 2.5 Turbo Pro',
  'bytedance:seedance:2.0-fast': 'Seedance 2.0 Fast',
  'bytedance:seedance:2.0': 'Seedance 2.0',
}

const VARIANT_DISPLAY: Record<string, string> = {
  'default-720p-audio': '720p + audio',
  'no-audio': 'Vertex AI, no audio',
  'with-audio': 'Vertex AI, w/ audio',
  turbo: 'Runway API',
  standard: 'Runway API',
  'fal-standard': 'fal.ai',
  'fal-720p-audio': 'fal.ai, 720p + audio',
  'volcengine-direct-1080p': 'Volcengine direct, 1080p',
}

function sourceLabel(url: string): string {
  try {
    const u = new URL(url)
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '')
  } catch {
    return url
  }
}

function formatPrice(p: number): string {
  if (p < 0.1) return `$${p.toFixed(3)}`
  return `$${p.toFixed(p < 1 ? 2 : 2)}`
}

function toRow(e: RawEntry): VideoPriceRow {
  const key = `${e.provider}:${e.model}:${e.version}`
  const price = e.price_usd
  return {
    id: `price-${e.provider}-${e.model}-${e.version}-${e.variant}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
    provider: PROVIDER_DISPLAY[e.provider] ?? e.provider,
    providerKey: e.provider,
    model: MODEL_DISPLAY[key] ?? `${e.model} ${e.version}`,
    variant: VARIANT_DISPLAY[e.variant] ?? e.variant,
    pricePerSec: formatPrice(price),
    pricePerSecNum: price,
    perMinute: `$${(price * 60).toFixed(2)}`,
    sourceTier: TIER_DISPLAY[e.source_quality as TierKey] ?? 'Third-party',
    sourceTierKey: e.source_quality as TierKey,
    confidence: (e.confidence.charAt(0).toUpperCase() + e.confidence.slice(1)) as Confidence,
    confidenceReason: e.confidence_reason,
    source: { label: sourceLabel(e.source_url), href: e.source_url },
    note: e.notes,
  }
}

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

type SortKey = 'default' | 'price-asc' | 'price-desc'
type TierFilter = 'all' | TierKey

function VideoPriceWatch() {
  const [sort, setSort] = useQueryState('sort', 'default')
  const [tier, setTier] = useQueryState('tier', 'all')

  const rows = useMemo(() => {
    const all = (genmediaPrices.entries as RawEntry[]).map(toRow)
    const filtered = tier === 'all' ? all : all.filter(r => r.sourceTierKey === tier)
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.pricePerSecNum - b.pricePerSecNum)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.pricePerSecNum - a.pricePerSecNum)
    return filtered
  }, [sort, tier])

  const updated = new Date(genmediaPrices.updated)
  const updatedLabel = updated.toISOString().slice(0, 10)

  const tierOptions: { key: TierFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'official', label: 'Official' },
    { key: 'official_reseller', label: 'Reseller' },
    { key: 'third_party', label: 'Third-party' },
  ]
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'default', label: 'Default' },
    { key: 'price-asc', label: '$/sec ↑' },
    { key: 'price-desc', label: '$/sec ↓' },
  ]

  return (
    <section id="video-price-watch" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="03" title="Video price watch" lede="List prices for frontier video APIs, scraped from provider docs. Live — refreshed via the scrape-genmedia-prices skill." />

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Last refreshed {updatedLabel}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Source tier</span>
        <div className="flex items-center gap-1">
          {tierOptions.map(o => (
            <button
              key={o.key}
              onClick={() => setTier(o.key)}
              className={[
                'px-2.5 py-1 rounded-full border transition-colors',
                tier === o.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-slate-400">·</span>
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Sort</span>
        <div className="flex items-center gap-1">
          {sortOptions.map(o => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={[
                'px-2.5 py-1 rounded-full border transition-colors',
                sort === o.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white/70 overflow-hidden">
        <div className="grid grid-cols-[1.3fr_1.1fr_0.65fr_0.65fr_0.85fr_0.85fr_1.7fr] text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200/70 bg-slate-50/60">
          <div className="px-5 py-3">Model</div>
          <div className="px-5 py-3">Variant</div>
          <div className="px-5 py-3">$ / sec</div>
          <div className="px-5 py-3">$ / min</div>
          <div className="px-5 py-3">Source tier</div>
          <div className="px-5 py-3">Confidence</div>
          <div className="px-5 py-3">Notes</div>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-8 text-sm text-slate-500 text-center">No rows match the current filter.</div>
        )}
        {rows.map((r, i) => (
          <Claim key={r.id} id={r.id}>
            <div className={`grid grid-cols-[1.3fr_1.1fr_0.65fr_0.65fr_0.85fr_0.85fr_1.7fr] text-sm ${i > 0 ? 'border-t border-slate-200/60' : ''}`}>
              <div className="px-5 py-4 flex items-start gap-2.5">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${PROVIDER_DOMAIN[r.providerKey] ?? r.providerKey + '.com'}&sz=64`}
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
          <span className="font-medium">Source tier</span> matters more than the headline number: <em>Official</em> means the provider's own pricing doc; <em>Reseller</em> is a hosted inference platform (fal, Replicate) that adds margin and infra; <em>Third-party</em> is a news or blog quote, so trust it less. Filters and sort live in the URL — share a view.
        </p>
        <p>
          Three price bands are forming. A <span className="font-medium">$0.05/sec floor</span> (Grok Imagine, Runway Gen-4 Turbo, Veo 3.1 Lite) for draft-tier 720p, a <span className="font-medium">$0.07–0.14/sec mid band</span> (Kling 2.5 Turbo, Runway Gen-4.5, Seedance direct), and a <span className="font-medium">$0.24–0.40/sec flagship band</span> (Seedance on fal, Veo 3.1 Standard). Hover the confidence chip for the reason.
        </p>
      </div>
    </section>
  )
}

function FrontierFrictions() {
  return (
    <section id="frontier-frictions" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="04" title="Frontier frictions" lede="What's actually hard right now. One card per modality — bottleneck, what a 10× cost drop would require, and papers worth reading." />

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {FRICTIONS.map(f => (
          <Claim key={f.id} id={`friction-${f.id}`}>
            <div className={`rounded-2xl border ${f.color.border} ${f.color.bgSoft} p-5 sm:p-6 h-full`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${f.color.text} mb-3`}>{f.title}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Bottleneck</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{f.bottleneck}</p>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">What a 10× drop needs</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{f.tenX}</p>
              <div className={`rounded-lg border ${f.color.border} bg-white/60 px-3 py-2 mb-4 text-xs text-slate-700`}>
                <span className={`font-semibold ${f.color.text} mr-1.5`}>Δ</span>{f.delta}
              </div>
              <a href={`#/?zone=${f.zoneId}`} className={`inline-block text-xs font-medium ${f.color.text} hover:underline mb-3`}>
                See {f.title.toLowerCase()} priced on page one →
              </a>
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
  const scenarioHref = (s: Scenario) => {
    const qs = new URLSearchParams({ params: s.params, tokens: s.tokens, rate: s.rate, util: s.util })
    return `#/misc?${qs.toString()}#playground`
  }
  return (
    <section id="playground" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="05" title="Back-of-envelope playground" lede="Inference cost from first principles. Four numbers in, three-line derivation out. The URL encodes your inputs — share it." />

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIOS.map(s => (
          <a
            key={s.id}
            href={scenarioHref(s)}
            className="group block rounded-2xl border border-slate-200 bg-white/70 hover:bg-white hover:border-slate-400 transition-colors p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-xl shrink-0" aria-hidden="true">{s.icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">{s.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.blurb}</div>
                <div className="mt-2 text-[10px] font-mono text-slate-400">
                  {s.params}B · {s.tokens} tok · ${s.rate}/s · util {s.util}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6">
        <NapkinMath />
      </div>
      <div className="mt-4 text-xs text-slate-500 leading-relaxed max-w-3xl">
        This treats every forward pass as dense FP16 on an H100. It ignores attention cost scaling with context length, MoE sparsity, and quantization wins. It gets you to within a factor of ~2 for most dense transformers — close enough to argue about.
      </div>
    </section>
  )
}

function CostDropTracker() {
  return (
    <section id="cost-drops" className="py-12 border-t border-slate-200/60">
      <SectionHeader kicker="02" title="Recent price movements" lede="A rolling log of public cost changes — cuts, launches, and direct-API sightings. Sourced from the same docs the table below scrapes." />
      <ol className="mt-8 relative border-l border-slate-200 ml-3 space-y-6">
        {COST_EVENTS.map(e => (
          <li key={e.id} className="pl-6 relative">
            <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${PROVIDER_ACCENT[e.provider] ?? 'bg-slate-900'}`} />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[11px] font-mono text-slate-400">{e.date}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{e.provider}</span>
              <span className="text-sm font-semibold text-slate-900">{e.model}</span>
            </div>
            <div className="mt-1 text-sm text-slate-800">{e.headline}</div>
            <div className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">{e.detail}</div>
            <a href={e.href} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs text-slate-500 hover:text-slate-900 underline decoration-slate-300">
              {new URL(e.href).hostname.replace(/^www\./, '')}
            </a>
          </li>
        ))}
      </ol>
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
