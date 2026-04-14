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

type Confidence2 = 'Low' | 'Medium' | 'High'

type Bet = {
  id: string
  title: string
  color: { text: string; bg: string; border: string; bgSoft: string }
  floorToday: string
  floor2027: string
  multiple: string
  unlock: string
  confidence: Confidence2
  confidenceReason: string
  zoneId: string
}

const BETS: Bet[] = [
  {
    id: 'images',
    title: 'Images',
    color: { text: 'text-indigo-700', bg: 'bg-indigo-600', border: 'border-indigo-200', bgSoft: 'bg-indigo-50' },
    floorToday: '$0.039 / image (Flash Image 2.5, 1024²)',
    floor2027: '~$0.005 / image',
    multiple: '~8×',
    unlock: 'Single-step or 2-step generation that holds diversity at flagship quality. Consistency-model successors plus MoE sparsity in the denoiser.',
    confidence: 'High',
    confidenceReason: 'Distillation has already delivered 6× in one generation; another 2–3× is within the current research trajectory.',
    zoneId: 'images',
  },
  {
    id: 'video',
    title: 'Video',
    color: { text: 'text-rose-700', bg: 'bg-rose-600', border: 'border-rose-200', bgSoft: 'bg-rose-50' },
    floorToday: '$0.40 / sec (Veo 3.1 Standard, post 2026-04-07 cut)',
    floor2027: '~$0.05 / sec',
    multiple: '~8×',
    unlock: 'Sub-quadratic temporal attention (linear or state-space) plus frame-token compression. Hierarchical plan-then-fill architectures shipping in production.',
    confidence: 'Medium',
    confidenceReason: 'Research direction is clear but memory-bound workloads are bandwidth-limited; HBM roadmaps set the ceiling more than algorithms.',
    zoneId: 'video',
  },
  {
    id: 'audio',
    title: 'Audio',
    color: { text: 'text-emerald-700', bg: 'bg-emerald-600', border: 'border-emerald-200', bgSoft: 'bg-emerald-50' },
    floorToday: '$0.005 / voice-min input, $0.018 / voice-min output (Flash Live)',
    floor2027: '~$0.001 / voice-min blended',
    multiple: '~5×',
    unlock: 'Speculative decoding tuned for audio tokenizers, plus KV-cache eviction co-designed with the streaming scheduler. Cheap end-to-end, not just cheap per token.',
    confidence: 'High',
    confidenceReason: 'Speculative decoding is already proven for text; porting it to audio codecs is an engineering fight, not a research bet.',
    zoneId: 'audio',
  },
  {
    id: 'world',
    title: 'World',
    color: { text: 'text-amber-700', bg: 'bg-amber-600', border: 'border-amber-200', bgSoft: 'bg-amber-50' },
    floorToday: 'Tier-dependent; minute-scale sessions only',
    floor2027: 'Hour-scale sessions at today\'s per-minute cost',
    multiple: '~10× in session length, not $/min',
    unlock: 'Learned neural memory for world-state persistence — not a growing KV-cache. Sparse read, sparse write, compositional scene representations.',
    confidence: 'Low',
    confidenceReason: 'No public architecture yet credibly cracks persistence cheaply. This is the modality where a research breakthrough — not scaling — is required.',
    zoneId: 'world',
  },
]

const CONFIDENCE2_STYLE: Record<Confidence2, string> = {
  High: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-rose-50 text-rose-700 border-rose-200',
}

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

type Technique = {
  id: string
  name: string
  where: string
  gain: string
  maturity: 'Shipping' | 'Early' | 'Research'
  what: string
  tradeoff: string
  paper?: { label: string; href: string }
}

const TECHNIQUES: Technique[] = [
  {
    id: 'distillation',
    name: 'Step distillation',
    where: 'Images (shipped), video (early)',
    gain: '6–25×',
    maturity: 'Shipping',
    what: 'Train a student to match a teacher in far fewer denoising passes. 25 → 4 steps is the industry floor; 25 → 1 (consistency models, ADD) is the frontier. This is the single largest source of the 2024–2026 image-cost collapse.',
    tradeoff: 'Quality envelope narrows at the top. Prompt adherence and fine detail degrade before overall fidelity does — which is why flagship tiers keep the teacher.',
    paper: { label: 'Adversarial Diffusion Distillation (Sauer et al., 2023)', href: 'https://arxiv.org/abs/2311.17042' },
  },
  {
    id: 'speculative',
    name: 'Speculative decoding',
    where: 'Text (everywhere), audio next',
    gain: '2–3×',
    maturity: 'Shipping',
    what: 'A small draft model proposes N tokens; the target model verifies them in a single batched forward. Accepted tokens are free tokens. Rejections fall back to normal decoding.',
    tradeoff: 'Net gain depends on draft-acceptance rate. A weak draft wastes verification compute; a too-strong draft defeats the point.',
    paper: { label: 'Fast Inference via Speculative Decoding (Leviathan et al., 2023)', href: 'https://arxiv.org/abs/2211.17192' },
  },
  {
    id: 'moe',
    name: 'Mixture of Experts',
    where: 'Text (all frontier), video next',
    gain: '3–5× at equal quality',
    maturity: 'Shipping',
    what: 'The FFN is split into N experts; a router sends each token to the top-k. Active parameters per token drop to 10–25% of total. Mixtral, DeepSeek-V3, and every frontier flagship now use some variant.',
    tradeoff: 'Memory footprint is the full model; only FLOPs are saved. All-to-all communication across GPUs becomes the new bottleneck — MoE gains only show up with the right topology.',
    paper: { label: 'Mixtral of Experts (Jiang et al., 2024)', href: 'https://arxiv.org/abs/2401.04088' },
  },
  {
    id: 'quant',
    name: 'Low-precision inference',
    where: 'All modalities',
    gain: '1.5–2×',
    maturity: 'Shipping',
    what: 'Run the forward pass at FP8 or INT4 instead of FP16. Weights shrink, memory bandwidth roughly doubles, tensor cores run faster on H100/B200.',
    tradeoff: 'Near-lossless at FP8 with calibration; perceptible at INT4 without. Requires hardware support and per-layer quantization-aware tuning — not a free switch.',
    paper: { label: 'SmoothQuant (Xiao et al., 2022)', href: 'https://arxiv.org/abs/2211.10438' },
  },
  {
    id: 'kvcache',
    name: 'KV-cache compression',
    where: 'Long-context text, video, audio',
    gain: '2–10× (context-dependent)',
    maturity: 'Shipping (paging), research (eviction)',
    what: 'PagedAttention (vLLM) eliminates fragmentation. H2O and StreamingLLM evict low-importance keys. Quantized caches halve memory. Together they raise the concurrent-users-per-GPU ceiling.',
    tradeoff: 'Eviction can drop keys that turn out to matter. Quantized caches lose a long-range accuracy tail that shows up on needle-in-haystack tasks, not on benchmarks.',
    paper: { label: 'vLLM / PagedAttention (Kwon et al., 2023)', href: 'https://arxiv.org/abs/2309.06180' },
  },
  {
    id: 'prefix',
    name: 'Prompt / prefix caching',
    where: 'Text — every major API',
    gain: '5–10× on repeated prefixes',
    maturity: 'Shipping',
    what: 'Cache the KV state of the shared prefix (system prompt, RAG context, tool schema) and reuse it across requests. You pay full rate only for the tail.',
    tradeoff: 'Provider-side and opaque. Cache evictions are invisible — you get the discount when you get it, and small prompt variations break the hit.',
  },
]

const MATURITY_STYLE: Record<Technique['maturity'], string> = {
  Shipping: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Early: 'bg-amber-50 text-amber-700 border-amber-200',
  Research: 'bg-rose-50 text-rose-700 border-rose-200',
}

type FailureMode = {
  id: string
  modality: string
  color: { text: string; bg: string; border: string; bgSoft: string }
  stillBreaks: string
  whyItMatters: string
  zoneId: string
}

const FAILURES: FailureMode[] = [
  {
    id: 'images',
    modality: 'Images',
    color: { text: 'text-indigo-700', bg: 'bg-indigo-600', border: 'border-indigo-200', bgSoft: 'bg-indigo-50' },
    stillBreaks: 'Typography at small scale (text inside signs, packaging, UI), hands in occlusion (gloves, gripping objects), and prompt adherence on 4+ subject compositions. Flash Image 2.5 hallucinates sign text at a rate no retry loop fixes.',
    whyItMatters: 'These are the failures that push draft-tier users back to flagship models. The true price of a cheap image is the retry multiplier, not the sticker.',
    zoneId: 'images',
  },
  {
    id: 'video',
    modality: 'Video',
    color: { text: 'text-rose-700', bg: 'bg-rose-600', border: 'border-rose-200', bgSoft: 'bg-rose-50' },
    stillBreaks: 'Physics under fast motion (pouring liquid, cloth, collisions), face identity past 6 seconds, and object permanence across cuts. Even Veo 3.1 Standard produces liquids that defy gravity mid-clip on common prompts.',
    whyItMatters: '$/sec hides that most production pipelines burn 3 generations to land one usable shot. The effective price is 3× the list.',
    zoneId: 'video',
  },
  {
    id: 'audio',
    modality: 'Audio',
    color: { text: 'text-emerald-700', bg: 'bg-emerald-600', border: 'border-emerald-200', bgSoft: 'bg-emerald-50' },
    stillBreaks: 'Barge-in latency on live voice sits at 400–700ms, which is where interruptions feel wrong. Code-switching mid-sentence still collapses prosody. Flash Live sounds flat on one-word replies — the exact case voice agents hit most.',
    whyItMatters: 'Voice agents feel "AI" in precisely the places where the cheap tier drops performance. The cost of sounding human is mostly paid above $0.02/min.',
    zoneId: 'audio',
  },
  {
    id: 'world',
    modality: 'World',
    color: { text: 'text-amber-700', bg: 'bg-amber-600', border: 'border-amber-200', bgSoft: 'bg-amber-50' },
    stillBreaks: 'Persistence past a minute — walk away, come back, the scene has drifted. State consistency under active player intervention. No public system crosses five minutes without visible world-state loss.',
    whyItMatters: 'This is the ceiling that keeps world models a research question, not a pricing one. The bet isn\'t cheaper minutes — it\'s longer ones.',
    zoneId: 'world',
  },
]

type HiddenCost = {
  id: string
  icon: string
  title: string
  detail: string
  magnitude: string
}

const HIDDEN_COSTS: HiddenCost[] = [
  {
    id: 'retries',
    icon: '🔁',
    title: 'The retry tax',
    detail: 'Draft-tier image and video models need 2–3 generations to land one usable output. The list price divides per call; the real price per shipped asset does not.',
    magnitude: '2–4× on draft-tier $/output',
  },
  {
    id: 'failed-gens',
    icon: '⛔',
    title: 'Failed generations you still pay for',
    detail: 'Content-filter refusals and safety rejections on most video and image APIs charge full generation cost. Only a handful of providers refund, and the policy is buried.',
    magnitude: '3–15% surcharge on prompt-heavy work',
  },
  {
    id: 'cold-starts',
    icon: '🥶',
    title: 'Cold starts',
    detail: 'Loading a 70B model into GPU memory is 15–60 seconds of compute someone pays for. Shared endpoints amortize it into the base rate; dedicated endpoints charge it to the first caller.',
    magnitude: '$0.01–0.20 per first-after-idle request',
  },
  {
    id: 'rate-limit',
    icon: '🚧',
    title: 'Rate-limit overhead',
    detail: '429s mean retries, which means paying for compute queued but not delivered on time. Bursty workloads pay this invisibly — it looks like latency, not cost.',
    magnitude: '10–30% on spiky traffic',
  },
  {
    id: 'egress',
    icon: '🚚',
    title: 'Egress',
    detail: 'Moving a minute of 4K video out of the provider\'s cloud is non-trivial. Text is negligible; generated media is not. Cross-region makes it worse.',
    magnitude: '$0.01–0.12 per GB',
  },
  {
    id: 'storage',
    icon: '🗄️',
    title: 'Storage TTL',
    detail: 'Video providers typically store outputs for 24–72 hours. Re-fetching past the TTL means regenerating — you pay the full generation cost for an asset you already made.',
    magnitude: 'Full $/gen on expired assets',
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
        <SectionLink id="frontier-frictions">Frictions</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="techniques">Techniques</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="forward-bets">Bets</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="failure-modes">Failures</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="unit-swap">Unit swap</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="hidden-costs">Hidden</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="cost-drops">Drops</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="video-price-watch">Prices</SectionLink>
        <span className="text-slate-300">·</span>
        <SectionLink id="playground">Napkin</SectionLink>
      </div>
      <main className="max-w-5xl mx-auto px-5 sm:px-8">
        <Header />
        <FrontierFrictions />
        <TechniquesLadder />
        <ForwardBets />
        <FailureModes />
        <UnitSwap />
        <HiddenCosts />
        <CostDropTracker />
        <VideoPriceWatch />
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
      <SectionHeader kicker="05" title="Unit swap" lede="Re-expressing list prices as physical quantities. Numbers are illustrative, shape-correct." />

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
      <SectionHeader kicker="08" title="Video price watch" lede="List prices for frontier video APIs, scraped from provider docs. Live — refreshed via the scrape-genmedia-prices skill." />

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
      <SectionHeader kicker="01" title="Frontier frictions" lede="What's actually hard right now. One card per modality — bottleneck, what a 10× cost drop would require, and papers worth reading." />

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

function ForwardBets() {
  return (
    <section id="forward-bets" className="py-12 border-t border-slate-200/60">
      <SectionHeader
        kicker="02"
        title="Four bets for the next 18 months"
        lede="Where the floor lands once the frictions above break. Calibrated guesses, not forecasts — confidence levels spell out which bets are engineering and which are research."
      />

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {BETS.map(b => (
          <Claim key={b.id} id={`bet-${b.id}`}>
            <div className={`rounded-2xl border ${b.color.border} ${b.color.bgSoft} p-5 sm:p-6 h-full`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-semibold uppercase tracking-wider ${b.color.text}`}>{b.title}</div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CONFIDENCE2_STYLE[b.confidence]}`}>
                  {b.confidence} confidence
                </span>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mb-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold self-center">Today</div>
                <div className="text-slate-700 font-mono text-xs leading-relaxed">{b.floorToday}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold self-center">End-2027</div>
                <div className="text-slate-700 font-mono text-xs leading-relaxed">{b.floor2027}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold self-center">Move</div>
                <div className={`font-mono text-xs ${b.color.text} font-semibold`}>{b.multiple}</div>
              </div>

              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Required unlock</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{b.unlock}</p>

              <div className={`rounded-lg border ${b.color.border} bg-white/60 px-3 py-2 text-xs text-slate-600 leading-relaxed`}>
                <span className={`font-semibold ${b.color.text} mr-1.5`}>Why {b.confidence.toLowerCase()}:</span>
                {b.confidenceReason}
              </div>

              <a href={`#/?zone=${b.zoneId}`} className={`mt-4 inline-block text-xs font-medium ${b.color.text} hover:underline`}>
                See {b.title.toLowerCase()} priced on page one →
              </a>
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-3xl">
        Confidence is about the research path, not market timing. High = the technique exists and needs engineering. Medium = research direction is clear, implementation is unproven at scale. Low = a genuine breakthrough is required.
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
      <SectionHeader kicker="09" title="Back-of-envelope playground" lede="Inference cost from first principles. Four numbers in, three-line derivation out. The URL encodes your inputs — share it." />

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
      <SectionHeader kicker="07" title="Recent price movements" lede="A rolling log of public cost changes — cuts, launches, and direct-API sightings. Sourced from the same docs the table below scrapes." />
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

function TechniquesLadder() {
  return (
    <section id="techniques" className="py-12 border-t border-slate-200/60">
      <SectionHeader
        kicker="02"
        title="How models actually get cheaper"
        lede="Six techniques doing the bulk of the work. Headline gain, where it ships today, and the tradeoff the sticker price doesn't show."
      />

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {TECHNIQUES.map(t => (
          <Claim key={t.id} id={`technique-${t.id}`}>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 sm:p-6 h-full">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.where}</div>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${MATURITY_STYLE[t.maturity]}`}>
                  {t.maturity}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Gain</span>
                <span className="font-mono text-sm text-slate-900 font-semibold">{t.gain}</span>
              </div>

              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">What it does</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{t.what}</p>

              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Tradeoff</div>
              <p className="text-sm text-slate-700 leading-relaxed">{t.tradeoff}</p>

              {t.paper && (
                <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Canonical paper: </span>
                  <a href={t.paper.href} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 underline decoration-slate-300">
                    {t.paper.label}
                  </a>
                </div>
              )}
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-600 leading-relaxed max-w-3xl">
        Stack them and you get the cost collapse. Distillation × MoE × FP8 × prefix caching on a well-batched H100 fleet is roughly the delta between a 2023 flagship and a 2026 draft tier — no new silicon required.
      </div>
    </section>
  )
}

function FailureModes() {
  return (
    <section id="failure-modes" className="py-12 border-t border-slate-200/60">
      <SectionHeader
        kicker="04"
        title="What still breaks — April 2026"
        lede="The cheapest thing in each modality that still fails visibly. This is the gap between list price and shipped output."
      />

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {FAILURES.map(f => (
          <Claim key={f.id} id={`failure-${f.id}`}>
            <div className={`rounded-2xl border ${f.color.border} ${f.color.bgSoft} p-5 sm:p-6 h-full`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${f.color.text} mb-3`}>{f.modality}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Still breaks</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{f.stillBreaks}</p>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Why it matters</div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{f.whyItMatters}</p>
              <a href={`#/?zone=${f.zoneId}`} className={`inline-block text-xs font-medium ${f.color.text} hover:underline`}>
                See {f.modality.toLowerCase()} priced on page one →
              </a>
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-3xl">
        Snapshot as of {new Date().toISOString().slice(0, 10)}. Every entry here is a benchmark the cheap tier fails today and the flagship tier mostly passes — the price of quality, in failure modes.
      </div>
    </section>
  )
}

function HiddenCosts() {
  return (
    <section id="hidden-costs" className="py-12 border-t border-slate-200/60">
      <SectionHeader
        kicker="06"
        title="What the bill doesn't price"
        lede="List prices describe a successful, first-try, in-region generation. Real pipelines don't get that. Six things that quietly move the real $/output."
      />

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HIDDEN_COSTS.map(h => (
          <Claim key={h.id} id={`hidden-${h.id}`}>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-xl shrink-0" aria-hidden="true">{h.icon}</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{h.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-500">{h.magnitude}</div>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{h.detail}</p>
            </div>
          </Claim>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-600 leading-relaxed max-w-3xl">
        None of these show up in a $/sec or $/Mtok table, and most of them compound. The honest number for any modality is the sticker price times the retry rate plus the out-of-band fees — which is why procurement teams budget 1.5–2× list.
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
