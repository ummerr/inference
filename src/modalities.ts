// Single source of truth for Gen Media modalities.
// All cost numbers are illustrative — designed to teach the *shape* of the
// math (what makes things expensive, how costs scale), not to be quoted as
// authoritative pricing. Real prices vary wildly by provider, batch size,
// and hardware utilization.

import type { LucideIcon } from 'lucide-react'
import {
  Image, Printer, Package, Scissors,
  Smartphone, Tv, Clapperboard, Film, Sparkles, MessagesSquare,
  Music, Disc, Sofa, PhoneCall, Globe, Headphones, Phone,
  Joystick, Gamepad2, FlaskConical,
} from 'lucide-react'

export type FieldType = 'slider' | 'toggle' | 'select'

export interface SliderField {
  id: string
  type: 'slider'
  label: string
  min: number
  max: number
  step: number
  default: number
  unit?: string
  hint?: (v: number) => string
  visibleWhen?: (inputs: Inputs) => boolean
}
export interface ToggleField {
  id: string
  type: 'toggle'
  label: string
  default: boolean
  onLabel: string
  offLabel: string
  hint?: string
  visibleWhen?: (inputs: Inputs) => boolean
}
export interface SelectField {
  id: string
  type: 'select'
  label: string
  default: string
  options: { value: string; label: string; hint?: string; estimated?: boolean }[]
  visibleWhen?: (inputs: Inputs) => boolean
  // When true, render as a full-width tab header above the rest of the
  // fields instead of as an inline pill row. Used for mode switches.
  prominent?: boolean
}
export type Field = SliderField | ToggleField | SelectField

export type Inputs = Record<string, number | boolean | string>

export interface CostBreakdownRow {
  label: string
  value: string
}

export interface CostResult {
  // Human-readable headline — what does this generation cost?
  headline: string
  // Sub-headline — the "per what" context
  sub: string
  // Raw dollars (for cross-modality comparison)
  dollars: number
  // Per-unit label e.g. "per image", "per 6s clip"
  unitLabel: string
  breakdown: CostBreakdownRow[]
  // Optional warning surfaced when the math blows up (e.g. VRAM walls)
  warn?: string
}

export interface ScenarioTier {
  label: string
  cost: string
  // Optional: extra inputs to merge on top of the scenario's base inputs
  // when this tier is clicked.
  inputs?: Partial<Inputs>
}

export interface Scenario {
  icon: LucideIcon
  title: string
  blurb: string
  cost: string
  footnote: string
  // Optional: per-tier pricing for the same scenario (e.g. Veo Lite / Fast /
  // Standard). When present, the card shows the breakdown instead of the
  // single cost.
  tiers?: ScenarioTier[]
  // Optional: base inputs to apply to the calculator when the card (or a
  // tier inside it) is clicked. If omitted, the scenario is a pure display
  // card and is not clickable.
  inputs?: Partial<Inputs>
}

export interface DeepDiveSource {
  label: string
  href?: string
}

export interface DeepDiveBlock {
  title: string
  hook: string
  body?: string
  bullets?: string[]
  stat?: { value: string; label: string }
  metaphor?: string
  sources?: DeepDiveSource[]
}

export interface Modality {
  id: 'images' | 'video' | 'audio' | 'world'
  label: string
  short: string
  // Accent color tokens (Tailwind class fragments)
  accent: {
    // bg tints, text, border, ring — all as short class fragments
    text: string        // e.g. 'text-indigo-600'
    bg: string          // e.g. 'bg-indigo-500'
    bgSoft: string      // e.g. 'bg-indigo-50'
    border: string      // e.g. 'border-indigo-200'
    ring: string        // e.g. 'ring-indigo-300'
    from: string        // gradient from
    to: string          // gradient to
    hex: string         // raw hex for SVG / canvas use
  }
  tagline: string
  // Optional banner rendered between the primer and the cost-shape box.
  // Used for modalities where calculator numbers are illustrative rather
  // than anchored to any vendor list price (e.g. world models).
  disclaimer?: string
  primer: string[]       // short paragraphs
  whyExpensive: string   // one-liner explaining the cost shape
  // Plain-English rendering of what the calc is doing. Shown behind a
  // "Show the math" toggle so curious readers can see the formula.
  formula: string
  fields: Field[]
  calc: (inputs: Inputs) => CostResult
  scenarios: Scenario[]
  deepDive: DeepDiveBlock[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) => {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(3)}`
  if (n >= 0.0001) return `$${n.toFixed(5)}`
  return `$${n.toExponential(2)}`
}

// A single "GPU-second" anchor for a modern accelerator (H100-class, cloud-rented).
// As of April 2026, on-demand H100 pricing across neocloud providers sits around
// $1.99–$2.99/hr (RunPod, TensorDock, Lambda). Hyperscalers price substantially
// higher. Blackwell B200 is $5.49–$6.69/hr. We use ~$2.16/hr ≈ $0.0006/GPU-s.
//
// Important framing: this is a top-down *anchor*, not a bottom-up measurement.
// We are not claiming Vertex's per-image cost equals steps × GPU-seconds ×
// this rate. We pick this anchor and then back-solve calibration constants
// (see VERTEX_CALIBRATION_* below) so that default-knob outputs match Vertex
// list prices. It's a teaching parameterisation, not a cost model.
const GPU_SECOND = 0.0006

// Calibration constants, back-solved so that GPU-seconds × GPU_SECOND ×
// CALIBRATION matches Vertex list price at the default-knob settings. These
// are *not* "retail API markup" in any meaningful margin sense — they are
// the fudge factor that absorbs everything we haven't modelled bottom-up
// (custom chips, compiled graphs, lower-precision weights, caching, batch
// economics, and yes, margin). Call them calibration, not markup.
const VERTEX_CALIBRATION_IMAGE = 27  // anchors Nano Banana 2 default = $0.067/img
// Gemini Omni Flash bills video as output tokens rather than per second.
// $17.50 / 1M video-output tokens, and a second of 720p video is ~5,700
// tokens — which is where the quoted "≈$0.10 per second" comes from.
const OMNI_VIDEO_TOKENS_PER_SECOND = 5700
const OMNI_VIDEO_PER_MTOK = 17.5
const VERTEX_CALIBRATION_VIDEO = 11  // anchors Veo 3.1 Standard 6s/720p = $2.40

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
const images: Modality = {
  id: 'images',
  label: 'Images',
  short: 'Images',
  accent: {
    text: 'text-indigo-600',
    bg: 'bg-indigo-500',
    bgSoft: 'bg-indigo-50',
    border: 'border-indigo-200',
    ring: 'ring-indigo-300',
    from: 'from-indigo-400',
    to: 'to-violet-500',
    hex: '#6366f1',
  },
  tagline: 'Diffusion: sculpt an image out of pure static.',
  primer: [
    'Image models start with random noise — a screen of static — and gradually clean it up into a picture. Each round of cleanup ("denoising") is one full pass through the network, and a typical image takes about 25 passes.',
    'Google\'s current image lineup is the Gemini Flash Image family — nicknamed "Nano Banana" in the developer community. As of May 2026 the ladder is Nano Banana 2 Lite / Gemini 3.1 Flash-Lite Image ($0.034/image, ~4 seconds), Nano Banana 2 / Gemini 3.1 Flash Image ($0.067), and Nano Banana Pro / Gemini 3 Pro Image ($0.134). Same underlying technique — the top tier just spends more compute per call. The older 2.5 Flash Image tier is still callable but no longer the price floor.',
  ],
  whyExpensive: 'More denoising steps = a cleaner image and a linearly bigger bill. "Guidance" — the trick that makes the image match your prompt — runs the model twice per step, so turning it on roughly doubles the cost. Doubling the resolution quadruples the work (twice as wide × twice as tall). Google hides these knobs behind a tier name: you pick NB 2 Lite / NB 2 / NB Pro, it picks the rest for you. Worth knowing: the *bill* no longer follows that quadratic, because images are now billed as output tokens and a 2K image costs barely more tokens than a 1K one.',
  formula: 'gpu_seconds = steps × passes × size_mul × (res / 1024)² × 0.083\ndollars    = gpu_seconds × $0.0006/s × 27   # calibration, not margin\n\n# size_mul: NB 2 Lite 0.5, NB 2 1.0, NB Pro 2.0\n# passes:   guided = 2, unguided = 1\n# the 27× is back-solved from Google list price, not a measured markup.\n# this models the *work*; the token-based price ladder is flatter (see below).',
  fields: [
    {
      id: 'steps', type: 'slider', label: 'Denoising steps',
      min: 1, max: 50, step: 1, default: 25,
      hint: v => v <= 4 ? 'ultra-fast, rough' : v <= 15 ? 'quick, decent' : v <= 30 ? 'sweet spot' : 'slow, polished',
    },
    {
      id: 'guided', type: 'toggle', label: 'Guidance (CFG)',
      default: true, onLabel: 'on · 2× passes', offLabel: 'off · 1× pass',
      hint: 'Runs the model twice per step to nudge output toward your prompt.',
    },
    {
      id: 'resolution', type: 'select', label: 'Resolution', default: '1024',
      options: [
        { value: '512',  label: '512²',  hint: 'thumbnail-ish' },
        { value: '1024', label: '1024²', hint: 'standard' },
        { value: '2048', label: '2048²', hint: 'print-ready, 4× the pixels' },
      ],
    },
    {
      id: 'modelSize', type: 'select', label: 'Model tier', default: 'medium',
      options: [
        { value: 'small',  label: 'Gemini 3.1 Flash-Lite Image · "Nano Banana 2 Lite" ($0.034/img)' },
        { value: 'medium', label: 'Gemini 3.1 Flash Image · "Nano Banana 2" ($0.067/img)' },
        { value: 'large',  label: 'Gemini 3 Pro Image · "Nano Banana Pro" ($0.134/img)' },
      ],
    },
  ],
  calc: (inputs) => {
    const steps = Number(inputs.steps)
    const guided = Boolean(inputs.guided)
    const res = Number(inputs.resolution)
    const size = String(inputs.modelSize)

    // Per-step cost scales ~linearly with pixel count and ~linearly with params.
    const pixelMul = (res / 1024) ** 2     // 0.25 at 512, 1 at 1024, 4 at 2048
    // Lite is exactly half NB 2's list price, Pro exactly double — the family
    // lands on a clean 0.5 / 1 / 2 compute ladder.
    const sizeMul  = size === 'small' ? 0.5 : size === 'medium' ? 1 : 2
    const passes   = guided ? 2 : 1

    // Scaling is physical: linear in denoising steps × guidance passes,
    // quadratic in resolution (pixel count), linear in model size. The
    // 0.083 GPU-s/step constant is anchored so Nano Banana 2 at default
    // knobs (25 steps, guided, 1024²) matches Vertex's list price of
    // $0.067/image — the whole family falls out from one anchor.
    const gpuSeconds = steps * passes * sizeMul * pixelMul * 0.083
    const dollars = gpuSeconds * GPU_SECOND * VERTEX_CALIBRATION_IMAGE

    return {
      headline: fmt(dollars),
      sub: 'per image',
      dollars,
      unitLabel: 'per image',
      breakdown: [
        { label: 'Passes through the model', value: `${steps * passes} (${steps} steps × ${passes})` },
        { label: 'Resolution multiplier',    value: `${pixelMul.toFixed(2)}× (${res}²)` },
        { label: 'Model-size multiplier',    value: `${sizeMul.toFixed(1)}×` },
        { label: 'GPU-seconds',              value: gpuSeconds.toFixed(2) },
      ],
    }
  },
  scenarios: [
    {
      icon: Image, title: 'One 1024² image', blurb: 'Single Gemini image call',
      cost: '$0.034 → $0.134', footnote: 'List price per image — tier = NB 2 Lite (3.1 Flash-Lite Image) / NB 2 (3.1 Flash Image) / NB Pro (3 Pro Image)',
      inputs: { steps: 25, guided: true, resolution: '1024' },
      tiers: [
        { label: 'Gemini 3.1 Flash-Lite Image', cost: '$0.034', inputs: { modelSize: 'small' } },
        { label: 'Gemini 3.1 Flash Image',      cost: '$0.067', inputs: { modelSize: 'medium' } },
        { label: 'Gemini 3 Pro Image',          cost: '$0.134', inputs: { modelSize: 'large' } },
      ],
    },
    {
      icon: Printer, title: '2K print-ready', blurb: 'Native 2048² output',
      cost: '$0.101 → $0.134', footnote: '3.1 Flash Image scales gently with resolution ($0.045 at 512², $0.067 at 1K, $0.101 at 2K, $0.151 at 4K); 3 Pro Image is flat $0.134 through 2K, then $0.24 at 4K.',
      inputs: { steps: 25, guided: true, resolution: '2048' },
      tiers: [
        { label: 'Gemini 3.1 Flash Image', cost: '$0.101', inputs: { modelSize: 'medium' } },
        { label: 'Gemini 3 Pro Image',     cost: '$0.134', inputs: { modelSize: 'large' } },
      ],
    },
    {
      icon: Package, title: 'Catalogue of 10k', blurb: 'Batched via the Batch API',
      cost: '$168 → $670', footnote: 'Batch API is exactly 50% of online list; committed-use discounts stack on top',
      tiers: [
        { label: 'Gemini 3.1 Flash-Lite Image', cost: '$168' },
        { label: 'Gemini 3.1 Flash Image',      cost: '$335' },
        { label: 'Gemini 3 Pro Image',          cost: '$670' },
      ],
    },
    {
      icon: Scissors, title: 'Edit pass', blurb: 'Send an image in, get an edited image back',
      cost: '$0.034 – $0.134', footnote: 'Editing costs the same as generating from scratch — price is per output image, regardless of whether you supplied one as input',
    },
  ],
  deepDive: [
    {
      title: 'Image generation is now a Gemini feature, not a separate product',
      hook: 'The same model that reads your prompt is the one that draws the picture — image output is built into Gemini itself.',
      metaphor: 'One brain, two output modes — the model that writes you a reply can now hand back a PNG.',
      bullets: [
        'Earlier Imagen models (1–3) were standalone, with a separate component for understanding prompts.',
        'Imagen 4 (May 2025) plugged a Gemini-style prompt-reader into the image model, and prompt-following jumped noticeably.',
        'Nano Banana goes further: image generation is built directly into Gemini. That\'s why it\'s good at multi-turn edits ("now make it sunset"), keeping the same character across images, and rendering legible text inside pictures.',
        'Billing treats image output as just another kind of token: roughly $30, $60, or $120 per million image tokens for the three tiers.',
      ],
      sources: [
        { label: 'Vertex AI Gemini image generation pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
        { label: 'Google DeepMind — Imagen 4 announcement', href: 'https://deepmind.google/technologies/imagen/' },
      ],
    },
    {
      title: 'Working on a thumbnail is why this is affordable',
      hook: 'Image models never actually touch full-resolution pixels during the cleanup loop — they work on a tiny compressed version and blow it up at the end.',
      stat: { value: '~64×', label: 'less data per step vs. working on raw pixels' },
      metaphor: 'Sketch the thumbnail, then scale up — nobody paints at poster size.',
      bullets: [
        'A small helper network squashes a 1024×1024 image (~3 million numbers) down to a 128×128 representation (~66k numbers).',
        'The main model does its 20–30 cleanup passes on that compressed version.',
        'One final pass expands the result back into full-resolution pixels.',
        'Without this shortcut, $0.034/image pricing wouldn\'t exist — every call would cost dollars instead of cents.',
      ],
      body: 'Every serious modern image model — Imagen 3/4, the Nano Banana line, Flux 2, GPT Image 1.5 — uses some version of this trick for the same reason: it\'s the only way the math pencils out.',
      sources: [
        { label: 'Rombach et al. — Latent Diffusion Models (CVPR 2022)', href: 'https://arxiv.org/abs/2112.10752' },
      ],
    },
    {
      title: 'NB 2 Lite / NB 2 / NB Pro: one family, three compute budgets',
      hook: 'Same underlying model, same brand — the cheaper tiers are squeezed and shortcut for speed, while Pro runs the full Gemini 3 weights.',
      bullets: [
        'Nano Banana 2 Lite ($0.034) — shipped May 2026 as the new floor: an image in about 4 seconds, roughly 2.7× faster than 3.1 Flash Image, aimed at high-throughput catalogue and ad workloads.',
        'Nano Banana 2 ($0.067 at 1K, $0.101 at 2K, $0.151 at 4K) — the default tier, and the only one that scales cleanly across the whole resolution ladder.',
        'Nano Banana Pro ($0.134 through 2K, $0.24 at 4K) — the full-quality model. This is the tier that handles multiple objects in one scene and legible text inside the image.',
        'The list prices land on a clean 0.5× / 1× / 2× ladder, which is the tell that these are three compute budgets for one model, not three products.',
      ],
      sources: [
        { label: 'Google — Nano Banana 2 Lite & Gemini Omni Flash launch', href: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/' },
        { label: 'Gemini API pricing (Jul 2026)', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
      ],
    },
    {
      title: 'The physics is quadratic. The price ladder isn\'t.',
      hook: 'Doubling an image\'s width and height quadruples the pixels — but only raises the bill about 50%, because you\'re billed for tokens, not pixels.',
      stat: { value: '1,120', label: 'output tokens for a 1K image — and for a 2K one on NB Pro' },
      metaphor: 'You\'re not buying canvas by the square inch. You\'re buying a description of the painting, and longer paintings barely need longer descriptions.',
      bullets: [
        'Every Gemini output — text, image, and now video — is metered in tokens on one bill. An image is priced at $30 / $60 / $120 per million image-output tokens across the three tiers.',
        'A 1K image is ~1,120 output tokens. Nano Banana Pro charges the same 1,120 through 2K, so 2K output is literally free relative to 1K on that tier.',
        'On 3.1 Flash Image the ladder runs $0.045 → $0.067 → $0.101 → $0.151 across 512² → 4K. That is 64× the pixels for 3.4× the price.',
        'The calculator on this page models the *work*, which really is quadratic in resolution. The gap between that curve and the price ladder is Google absorbing the difference — a bet on volume, not a measurement of cost.',
      ],
      sources: [
        { label: 'Gemini API pricing — image output tokens', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
      ],
    },
    {
      title: 'Why "guidance" roughly doubles your bill',
      hook: 'To actually follow your prompt, diffusion models run each cleanup step twice — once imagining what the image should look like given your prompt, once without it — and steer toward the difference.',
      stat: { value: '2×', label: 'passes through the model per cleanup step' },
      bullets: [
        'This is the trick that makes image models listen to prompts at all — turn it off and you get mushy, generic output.',
        'But it means every step costs double: one pass with the prompt, one without.',
        'Faster tiers ("step-distilled" variants like NB 2 Lite, Flux Schnell) train a smaller model to do both passes in one, which is mostly why they\'re so much cheaper — and why Lite returns an image in about 4 seconds.',
        'And at 1024×1024 the quality gap is rarely visible, so you\'re paying for speed without giving up much.',
      ],
      sources: [
        { label: 'Ho & Salimans — Classifier-Free Diffusion Guidance', href: 'https://arxiv.org/abs/2207.12598' },
      ],
    },
    {
      title: 'Why Google\'s $0.034 beats self-hosting Flux',
      hook: 'On paper, renting your own GPU can match Google per image. In practice, its serving infrastructure is what you can\'t easily replicate.',
      metaphor: 'Anyone can buy the same flour. Google runs the bakery 24/7 with the ovens always full.',
      bullets: [
        'Raw GPU rental gets close: an RTX 5090 on spot (~$0.89/hr) or H100 (~$2/hr) is in the ballpark.',
        'What Google adds: custom chips running at near-100% utilization, faster-shortcut model variants, compiled graphs that cut software overhead, smaller numeric formats, caching tricks that reuse intermediate results, plus legal cover on training-data copyright.',
        'Third-party Flux endpoints (Fal, Replicate, BFL) rebuild most of this and land at similar per-image cost — that\'s the honest comparison.',
        'Self-hosting wins when you need custom fine-tunes, offline generation, or total control — not for API-scale traffic.',
      ],
      sources: [
        { label: 'RunPod — H100 & RTX 5090 on-demand pricing', href: 'https://www.runpod.io/pricing' },
        { label: 'Lambda Cloud — GPU pricing', href: 'https://lambdalabs.com/service/gpu-cloud' },
        { label: 'TensorDock — GPU marketplace pricing', href: 'https://www.tensordock.com/' },
        { label: 'Black Forest Labs — Flux 2 release notes', href: 'https://blackforestlabs.ai/' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------
const video: Modality = {
  id: 'video',
  label: 'Video',
  short: 'Video',
  accent: {
    text: 'text-rose-600',
    bg: 'bg-rose-500',
    bgSoft: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'ring-rose-300',
    from: 'from-rose-400',
    to: 'to-orange-500',
    hex: '#f43f5e',
  },
  tagline: 'An image is one frame. Video is hundreds — and each frame has to agree with the others.',
  primer: [
    'A video model has to generate every frame *and* keep them consistent with each other — a cup on a table in frame 1 has to be the same cup in frame 120.',
    'Early video models compared every frame to every other frame, which got painful fast: a clip twice as long cost four times as much to generate. Newer models (Veo 3.1, Kling, Runway Gen-4) only compare each frame to its neighbors, which is why an 8-second clip now renders in about a minute instead of several.',
    'Two things sell video today. Veo 3.1 is the dedicated generator, billed per second of output on a Lite / Fast / Standard ladder. Gemini Omni Flash, launched May 2026, is the other shape: video generation folded into a Gemini model, billed in output tokens like everything else, with conversational editing on top — "make it night, keep the same car" as a follow-up turn rather than a fresh prompt.',
  ],
  whyExpensive: 'Cost ≈ (work per frame) × (number of frames). Older video models got drastically more expensive as clips got longer, because every frame had to "look at" every other frame. Newer models only check nearby frames, which keeps cost roughly linear with length. Each frame still does almost as much work as a full image, though, so seconds and pixels add up quickly. Omni Flash adds a second cost driver that has nothing to do with pixels: every conversational edit turn regenerates the clip from scratch.',
  formula: [
    '# Veo 3.1 — per-second billing, modelled bottom-up',
    'frames      = seconds × fps',
    'per_frame   = 2.5 × (res / 720)² × tier_mul     # linear',
    'temporal    = frames² / 8000 × tier_mul × pixel_mul  # quadratic residue',
    'gpu_seconds = frames × per_frame + temporal',
    'dollars     = gpu_seconds × $0.0006/s × 11       # calibration, not margin',
    '',
    '# tier_mul: Lite 0.125, Fast 0.25, Standard 1.0',
    '# 8000 is a shape constant (not a measurement) tuned so the quadratic tail',
    '# is ~5% at 8s/24fps/720p; the 11× back-solves to Google list price.',
    '',
    '# Gemini Omni Flash — token billing, straight off the price sheet',
    'video_tokens = seconds × 5,700          # ~5.7k tokens per second at 720p',
    'dollars      = turns × video_tokens / 1M × $17.50   # ≈ $0.10 / second',
  ].join('\n'),
  fields: [
    { id: 'engine', type: 'select', label: 'Engine', default: 'veo', prominent: true,
      options: [
        { value: 'veo',  label: 'Veo 3.1 · per second' },
        { value: 'omni', label: 'Omni Flash · per token' },
      ],
    },
    { id: 'seconds',    type: 'slider', label: 'Length',     min: 4, max: 8, step: 2,  default: 6, unit: 's',
      visibleWhen: i => i.engine !== 'omni',
      hint: v => v === 4 ? 'short take' : v === 6 ? 'default clip' : 'max single generation',
    },
    { id: 'fps',        type: 'slider', label: 'Frame rate', min: 8, max: 30, step: 2, default: 24, unit: ' fps',
      visibleWhen: i => i.engine !== 'omni',
    },
    { id: 'resolution', type: 'select', label: 'Resolution', default: '720',
      visibleWhen: i => i.engine !== 'omni',
      options: [
        { value: '480', label: '480p' },
        { value: '720', label: '720p' },
        { value: '1080', label: '1080p' },
        { value: '2160', label: '4K' },
      ],
    },
    { id: 'tier', type: 'select', label: 'Veo tier', default: 'fast',
      visibleWhen: i => i.engine !== 'omni',
      options: [
        { value: 'lite', label: 'Veo 3.1 Lite ($0.05/s, no audio)' },
        { value: 'fast', label: 'Veo 3.1 Fast ($0.10/s, w/ audio)' },
        { value: 'good', label: 'Veo 3.1 Standard ($0.40/s, w/ audio)' },
      ],
    },
    // --- Omni Flash fields ---
    { id: 'omniSeconds', type: 'slider', label: 'Clip length', min: 2, max: 10, step: 1, default: 8, unit: 's',
      visibleWhen: i => i.engine === 'omni',
      hint: v => v <= 4 ? 'beat' : v <= 8 ? 'shot' : 'current per-call ceiling',
    },
    { id: 'turns', type: 'slider', label: 'Conversation turns', min: 1, max: 12, step: 1, default: 3,
      visibleWhen: i => i.engine === 'omni',
      hint: v => v === 1 ? 'one-shot generation' : v <= 4 ? 'a few refinements' : v <= 8 ? 'real direction session' : 'this is where the bill lives',
    },
  ],
  calc: (inputs) => {
    if (String(inputs.engine) === 'omni') {
      const secs  = Number(inputs.omniSeconds)
      const turns = Number(inputs.turns)

      // Omni Flash needs no bottom-up model: video output is metered in
      // tokens on the same bill as text, at a published per-token rate.
      const tokensPerTurn = secs * OMNI_VIDEO_TOKENS_PER_SECOND
      const dollars = turns * (tokensPerTurn / 1e6) * OMNI_VIDEO_PER_MTOK

      const warn = turns >= 8
        ? 'Every edit turn regenerates the whole clip. Eight turns on an 8-second shot costs more than a full 30-second Veo 3.1 Fast spot — conversational editing is convenience priced by the round trip.'
        : undefined

      return {
        headline: fmt(dollars),
        sub: `for a ${secs}s clip over ${turns} turn${turns === 1 ? '' : 's'}`,
        dollars,
        unitLabel: `per ${secs}s clip · ${turns} turn${turns === 1 ? '' : 's'}`,
        breakdown: [
          { label: 'Video output tokens', value: `${(tokensPerTurn * turns).toLocaleString()} (${secs}s × ~5.7k × ${turns})` },
          { label: 'Rate',                value: '$17.50 / 1M video-output tokens' },
          { label: 'Effective per second', value: '≈ $0.10 at 720p, audio included' },
          { label: 'Regenerations',       value: `${turns}× — each turn redraws the clip` },
        ],
        warn,
      }
    }

    const seconds = Number(inputs.seconds)
    const fps     = Number(inputs.fps)
    const res     = Number(inputs.resolution)
    const tier    = String(inputs.tier)

    const frames   = seconds * fps
    const pixelMul = (res / 720) ** 2
    const tierMul  = tier === 'lite' ? 0.125 : tier === 'fast' ? 0.25 : 1

    // Scaling is physical: linear in frames × per-frame work, quadratic in
    // resolution, plus a small quadratic residual for temporal attention.
    // The 2.5 GPU-s/frame constant is anchored so a 6s/24fps/720p Standard
    // clip matches Vertex Veo 3.1 Standard pricing (6s × $0.40/s = $2.40);
    // Lite and Fast fall out from the same anchor via their tier multipliers.
    const perFrameGpuS = 2.5 * pixelMul * tierMul
    // Residual quadratic term (smaller than pre-sparse-attention era). The
    // divisor below is a *shape constant*, chosen so the quadratic tail is
    // ~5% of the linear term at 8s/24fps/720p. It is not derived from
    // attention head counts or sequence length — it's the curve that
    // teaches the right intuition (long clips still cost more than
    // linearly) without overpowering the per-frame term at default knobs.
    const QUADRATIC_SHAPE_DIVISOR = 8000
    const temporalGpuS = (frames * frames / QUADRATIC_SHAPE_DIVISOR) * tierMul * pixelMul

    const gpuSeconds = frames * perFrameGpuS + temporalGpuS
    const dollars = gpuSeconds * GPU_SECOND * VERTEX_CALIBRATION_VIDEO

    const warn = res >= 2160 && seconds >= 20
      ? 'At 4K for 20s+, real models hit VRAM walls and have to chunk — real cost often balloons 2–4× over this estimate.'
      : undefined

    return {
      headline: fmt(dollars),
      sub: `per ${seconds}s clip`,
      dollars,
      unitLabel: `per ${seconds}s clip`,
      breakdown: [
        { label: 'Frames to generate',        value: `${frames} (${seconds}s × ${fps}fps)` },
        { label: 'Per-frame work',            value: `${(frames * perFrameGpuS).toFixed(1)} GPU-s · linear` },
        { label: 'Temporal attention (O(n²))', value: `${temporalGpuS.toFixed(1)} GPU-s · quadratic` },
        { label: 'Tier multiplier',           value: `${tierMul}×` },
      ],
      warn,
    }
  },
  scenarios: [
    {
      icon: Smartphone, title: '6s social clip', blurb: '720p, one generation',
      cost: '$0.30 → $2.40', footnote: 'Lite has no audio; Fast/Standard include synchronized audio',
      inputs: { engine: 'veo', seconds: 6, fps: 24, resolution: '720' },
      tiers: [
        { label: 'Lite',     cost: '$0.30', inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$0.60', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$2.40', inputs: { tier: 'good' } },
      ],
    },
    {
      icon: Tv, title: '30s ad spot', blurb: 'Stitched from ≤8s clips',
      cost: '$1.50 → $12', footnote: 'List price: 30s × per-second rate. Retries and edits are extra in practice.',
      inputs: { engine: 'veo', fps: 24, resolution: '720' },
      tiers: [
        { label: 'Lite',     cost: '$1.50', inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$3',    inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$12',   inputs: { tier: 'good' } },
      ],
    },
    {
      icon: Clapperboard, title: '2min short scene', blurb: '~15 clips stitched',
      cost: '$6 → $48', footnote: 'List price: 120s × per-second rate, before the VFX/color pass a real short needs.',
      inputs: { engine: 'veo', fps: 24, resolution: '720' },
      tiers: [
        { label: 'Lite',     cost: '$6',  inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$12', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$48', inputs: { tier: 'good' } },
      ],
    },
    {
      icon: Sparkles, title: '10s Omni Flash clip', blurb: 'One-shot, native audio',
      cost: '$1.00', footnote: '10s × ~5.7k video-output tokens × $17.50/1M ≈ $0.10/s — the same headline rate as Veo 3.1 Fast, reached through a completely different meter',
      inputs: { engine: 'omni', omniSeconds: 10, turns: 1 },
    },
    {
      icon: MessagesSquare, title: 'Directed shot', blurb: 'Omni Flash · 8s over 5 turns',
      cost: '$4.00', footnote: 'Each "now make it night" is a full regeneration at $0.80. Conversational editing is priced by the round trip, not by the change.',
      inputs: { engine: 'omni', omniSeconds: 8, turns: 5 },
    },
    {
      icon: Film, title: '1hr generated film', blurb: 'Linear extrapolation',
      cost: '$180 → $1,440', footnote: 'just inference — before retries, rejects, and post',
      tiers: [
        { label: 'Lite',     cost: '$180' },
        { label: 'Fast',     cost: '$360' },
        { label: 'Standard', cost: '$1,440' },
      ],
    },
  ],
  deepDive: [
    {
      title: 'Why per-second billing won',
      hook: 'Flat-rate subscriptions can\'t absorb video\'s real unit cost, so the whole industry converged on per-second.',
      bullets: [
        'A single 8s clip can burn dollars of real compute — no fixed-price tier survives heavy users.',
        'Veo 3.1, Kling, and Runway Gen-4 all use per-second billing; it\'s the only unit that tracks what GPUs actually do.',
        'Veo 3.1 ladder at 720p: Lite $0.05/s, Fast $0.10/s, Standard $0.40/s. 4K costs more on every rung — Fast jumps to $0.30/s, Standard to $0.60/s.',
        'The ladder lets you trade fidelity for cost explicitly instead of guessing at a tier name.',
      ],
      sources: [
        { label: 'Gemini API pricing — Veo (Jul 2026)', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
        { label: 'Veo on Vertex — video generation docs (durations & tiers)', href: 'https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos' },
      ],
    },
    {
      title: 'Omni Flash: video generation moved into the chat model',
      hook: 'Google I/O, May 2026 — Gemini Omni Flash makes a clip an output type of a Gemini model, not a call to a separate video product.',
      stat: { value: '~5.7k', label: 'output tokens per second of 720p video' },
      metaphor: 'Veo is a render farm you send a brief to. Omni Flash is a director you keep talking to.',
      bullets: [
        'Same meter as everything else Gemini emits: $1.50/1M in, $9/1M for text out, $17.50/1M for video out — which works out to about $0.10 per second at 720p, audio included.',
        'Ten seconds per call today, "longer durations coming soon." Video references are capped at 3 seconds, and audio input isn\'t supported yet — you describe the audio in the prompt.',
        'The real feature is multi-turn editing: "same shot, now at night" preserves the character, lighting, and continuity instead of rerolling a fresh clip from a longer prompt.',
        'The catch that shows up on the invoice: each turn regenerates the whole clip. Five turns on an 8-second shot is $4.00 — the edits are conversational, the billing isn\'t.',
        'Every generation carries a SynthID watermark. It shipped in public preview across AI Studio, the Gemini API, the Gemini app, and Flow.',
      ],
      sources: [
        { label: 'Google — Start building with Nano Banana 2 Lite and Gemini Omni Flash', href: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-omni-flash-nano-banana-2-lite/' },
        { label: 'Gemini API pricing — Omni Flash video output', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
      ],
    },
    {
      title: 'Two meters, one price — for now',
      hook: 'Omni Flash lands at $0.10/second, exactly Veo 3.1 Fast. That coincidence is a positioning decision, not a physics result.',
      bullets: [
        'Per-second billing prices the artifact. Token billing prices the computation — and lets video share one bill, one rate card, and one rate limit with text and images.',
        'Token billing is also what makes editing coherent: the conversation is context, and context is already the unit Gemini charges for.',
        'Where they diverge: Veo still owns the long tail — 4K, 1080p, the $0.05/s Lite floor, and durations past 10 seconds. Omni Flash owns iteration.',
        'Choose by workflow, not by rate: one-shot render at a spec sheet, or a directed session where you expect to say "not quite" four times.',
      ],
      sources: [
        { label: 'Gemini API pricing (Jul 2026)', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
      ],
    },
    {
      title: 'Why a video clip costs 40× an image',
      hook: 'A 6-second clip is 144 images that all have to agree with each other.',
      stat: { value: '~36×', label: 'the cost of one Nano Banana 2 image ($0.067)' },
      bullets: [
        '6s × 24fps = 144 frames, each doing ~1024² image diffusion plus cross-frame attention.',
        'Veo 3.1 Standard at $0.40/s → $2.40 per 6s clip.',
        'Per-frame cost is actually low: ~$0.017 at Standard, ~$0.0021 at Lite — Veo amortizes well.',
        'Cost scales with volume, not per-frame difficulty: you pay for 144 generations at once.',
      ],
      sources: [
        { label: 'Vertex AI Veo 3.1 pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
        { label: 'Ho et al. — Video Diffusion Models', href: 'https://arxiv.org/abs/2204.03458' },
      ],
    },
    {
      title: 'Only-check-your-neighbors broke the long-clip curse',
      hook: 'Old video models got exponentially more expensive as clips got longer. A trick from 2025 flattened that curve to near-linear.',
      metaphor: 'Old way: every frame reads every other frame\'s diary. New way: frames only check in with their neighbors.',
      bullets: [
        'Before 2025: every frame had to compare itself to every other frame. Doubling the length quadrupled the cost.',
        'Newer models limit each frame to a small set of nearby or relevant frames instead.',
        'Result: Veo 3.1 renders an 8-second clip in about a minute. First-gen video models took many.',
        'Pricing now scales honestly with length instead of hiding an exponential tail.',
      ],
      sources: [
        { label: 'Lumiere: Space-Time Diffusion (Bar-Tal et al., 2024)', href: 'https://arxiv.org/abs/2401.12945' },
        { label: 'VideoPoet (Kondratyuk et al., 2024)', href: 'https://arxiv.org/abs/2312.14125' },
        { label: 'Google DeepMind — Veo overview (product page)', href: 'https://deepmind.google/technologies/veo/' },
      ],
    },
    {
      title: 'Why long clips still "drift"',
      hook: 'A long clip doesn\'t fit in GPU memory all at once, so it has to be generated in chunks — and by chunk six, the model\'s memory of chunk one is fading.',
      bullets: [
        'Generating more than a few seconds at 1080p+ overflows what fits in GPU memory, so models generate in overlapping chunks and blend them.',
        'The "only check your neighbors" trick helps within a chunk, but keeping state consistent across chunks is still unsolved.',
        'Past ~20 seconds of continuous generation you start to see textures shimmer and physics go weird.',
        'That\'s why providers cap single-clip length at 16–30 seconds.',
      ],
      sources: [
        { label: 'Lumiere: Space-Time Diffusion (Bar-Tal et al., 2024)', href: 'https://arxiv.org/abs/2401.12945' },
        { label: 'Ho et al. — Video Diffusion Models (chunked generation)', href: 'https://arxiv.org/abs/2204.03458' },
        { label: 'Runway Gen-4 announcement (single-clip caps)', href: 'https://runwayml.com/research/introducing-runway-gen-4' },
      ],
    },
    {
      title: 'The caching + compilation stack',
      hook: 'Most of the gap between list price and what you\'d pay running this yourself comes from serving infrastructure, not the model.',
      stat: { value: '~3.5×', label: 'faster vs. a plain reference implementation' },
      bullets: [
        'Reuse work: early layers of the model often produce similar output across steps, so cache them instead of recomputing.',
        'Compile the math graph ahead of time so the GPU isn\'t waiting on Python between operations.',
        'Store model weights in a smaller numeric format (8-bit instead of 16-bit) where quality allows — twice the throughput for almost no visible difference.',
        'Keep the hardware busy across millions of requests — the efficiency margin hourly-rental shops can\'t match.',
      ],
      body: 'Google applies this stack on its own TPU hardware; Fal, Replicate, and BFL rebuild it on H100s, which is why third-party Flux pricing lands close to Vertex\'s.',
      sources: [
        { label: 'Google Cloud — Trillium TPU', href: 'https://cloud.google.com/blog/products/compute/trillium-tpu-is-ga' },
        { label: 'PyTorch — torch.compile', href: 'https://pytorch.org/docs/stable/torch.compiler.html' },
        { label: 'OpenXLA', href: 'https://openxla.org/xla' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Audio (Music + Voice)
// ---------------------------------------------------------------------------
// One section, two cost shapes. The `kind` select at the top of the calculator
// flips between Lyria-family music generation and Gemini Flash Live voice.
const audio: Modality = {
  id: 'audio',
  label: 'Audio',
  short: 'Audio',
  accent: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-500',
    bgSoft: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-300',
    from: 'from-emerald-400',
    to: 'to-teal-500',
    hex: '#10b981',
  },
  tagline: 'Two cost shapes under one roof: songs that bill per clip, conversations that bill per minute.',
  primer: [
    'Audio splits cleanly in two. Music is the Lyria line, and as of the April 2026 Lyria 3 release it finally has published list prices: Lyria 3 at $0.04 per 30-second clip, Lyria 3 Pro at $0.08 flat for a full song up to three minutes. Both take text or a reference image as the prompt, and both can sing.',
    'Voice is Gemini 3.1 Flash Live — one model that both listens and speaks, replacing the old three-step pipeline (speech-to-text → language model → text-to-speech). Billing is split: $0.005 per minute of audio you send in, $0.018 per minute of audio it speaks back. Gemini 3.5 Live Translate is the specialist sibling, priced at $0.0053 in and $0.0315 out.',
  ],
  whyExpensive: 'Music bills per clip (or flat per song) because the Lyria models are trained to emit one fixed-size chunk of high-quality audio per call. Voice splits input and output because listening is cheap (one pass through the model) but speaking is expensive (the model has to generate each chunk of audio one after another, each one building on the last). That\'s why output costs ~3.6× input. Two different billing shapes, one category.',
  formula: [
    '# Music (Lyria 3)',
    'clips        = ceil(seconds / 30)     # Lyria 3 per-clip billing',
    'dollars_L3   = clips × $0.04',
    'dollars_L3P  = $0.08                  # flat per song, up to 180s',
    '',
    '# Voice (Live models)',
    'dollars = input_min × in_rate + output_min × out_rate',
    '# Flash Live:    $0.005 in / $0.018 out',
    '# Live Translate: $0.0053 in / $0.0315 out',
  ].join('\n'),
  fields: [
    { id: 'kind', type: 'select', label: 'Mode', default: 'music',
      prominent: true,
      options: [
        { value: 'music', label: 'Music · Lyria' },
        { value: 'voice', label: 'Voice · Flash Live' },
      ],
    },
    // --- Music fields ---
    { id: 'tier', type: 'select', label: 'Music model', default: 'lyria3',
      visibleWhen: i => i.kind === 'music',
      options: [
        { value: 'lyria3',    label: 'Lyria 3 · $0.04 / 30s clip' },
        { value: 'lyria3pro', label: 'Lyria 3 Pro · $0.08 flat per song (≤3 min)' },
      ],
    },
    { id: 'seconds', type: 'slider', label: 'Track length', min: 5, max: 300, step: 5, default: 30, unit: 's',
      visibleWhen: i => i.kind === 'music',
      hint: v => v <= 15 ? 'stinger' : v <= 45 ? 'jingle' : v <= 120 ? 'single cue' : v <= 180 ? 'full song' : 'extended',
    },
    // --- Voice fields ---
    { id: 'voiceModel', type: 'select', label: 'Voice model', default: 'flashLive',
      visibleWhen: i => i.kind === 'voice',
      options: [
        { value: 'flashLive', label: 'Gemini 3.1 Flash Live · $0.005 / $0.018 per min' },
        { value: 'translate', label: 'Gemini 3.5 Live Translate · $0.0053 / $0.0315 per min' },
      ],
    },
    { id: 'minutes', type: 'slider', label: 'Session length', min: 1, max: 600, step: 1, default: 10, unit: 'min',
      visibleWhen: i => i.kind === 'voice',
      hint: v => v < 5 ? 'quick exchange' : v < 30 ? 'conversation' : v < 120 ? 'long call' : 'marathon session',
    },
    { id: 'outputShare', type: 'slider', label: 'Share spoken by the model', min: 10, max: 90, step: 5, default: 50, unit: '%',
      visibleWhen: i => i.kind === 'voice',
      hint: v => v < 30 ? 'mostly listening' : v < 60 ? 'balanced' : 'mostly talking',
    },
  ],
  calc: (inputs) => {
    const kind = String(inputs.kind)

    if (kind === 'music') {
      const tier    = String(inputs.tier)
      const seconds = Number(inputs.seconds)

      let dollars: number
      let clipInfo: string
      if (tier === 'lyria3') {
        const clips = Math.max(1, Math.ceil(seconds / 30))
        dollars = clips * 0.04
        clipInfo = `${clips} × 30s clip @ $0.04`
      } else {
        dollars = 0.08
        clipInfo = 'flat per-song rate'
      }

      const warn = tier === 'lyria3pro' && seconds > 180
        ? 'Lyria 3 Pro caps at 3-minute tracks — longer runs have to be stitched from multiple calls.'
        : undefined

      return {
        headline: fmt(dollars),
        sub: `per ${seconds}s track`,
        dollars,
        unitLabel: `per ${seconds}s track`,
        breakdown: [
          { label: 'Mode',         value: 'Music' },
          { label: 'Model',        value: tier === 'lyria3' ? 'Lyria 3' : 'Lyria 3 Pro' },
          { label: 'Billing unit', value: clipInfo },
          { label: 'Sample rate',  value: '48 kHz WAV' },
        ],
        warn,
      }
    }

    // Voice
    const minutes     = Number(inputs.minutes)
    const outputShare = Number(inputs.outputShare) / 100

    const model       = String(inputs.voiceModel ?? 'flashLive')
    const translating = model === 'translate'

    const outputMin = minutes * outputShare
    const inputMin  = minutes * (1 - outputShare)

    // Live Translate carries a premium on both legs, and a much steeper one
    // on output — it is speaking continuously, in a second language, while
    // still listening to the first.
    const inRate  = translating ? 0.0053 : 0.005
    const outRate = translating ? 0.0315 : 0.018

    const dollars = inputMin * inRate + outputMin * outRate

    return {
      headline: fmt(dollars),
      sub: `per ${minutes}-min session`,
      dollars,
      unitLabel: `per ${minutes}-min session`,
      breakdown: [
        { label: 'Mode',         value: 'Voice' },
        { label: 'Input audio',  value: `${inputMin.toFixed(1)} min × $${inRate}` },
        { label: 'Output audio', value: `${outputMin.toFixed(1)} min × $${outRate}` },
        { label: 'Model',        value: translating ? 'Gemini 3.5 Live Translate' : 'Gemini 3.1 Flash Live' },
      ],
    }
  },
  scenarios: [
    // --- Music ---
    {
      icon: Music, title: '30s jingle', blurb: 'One Lyria 3 clip',
      cost: '$0.04', footnote: 'exactly one billing unit on Lyria 3',
      inputs: { kind: 'music', tier: 'lyria3', seconds: 30 },
    },
    {
      icon: Disc, title: '3-min full song', blurb: 'Lyria 3 Pro flat vs Lyria 3 stitched',
      cost: '$0.08 → $0.24', footnote: 'Lyria 3: 6 × $0.04 = $0.24, and the six clips have to be made to agree. Lyria 3 Pro writes the whole arrangement — intro, verse, chorus, bridge — for $0.08.',
      inputs: { kind: 'music', seconds: 180 },
      tiers: [
        { label: 'Lyria 3 Pro (flat)', cost: '$0.08', inputs: { tier: 'lyria3pro' } },
        { label: 'Lyria 3 (6 clips)',  cost: '$0.24', inputs: { tier: 'lyria3' } },
      ],
    },
    {
      icon: Package, title: '20-song album', blurb: 'Lyria 3 Pro batch',
      cost: '$1.60', footnote: '20 × $0.08/song — before iteration and rejected takes',
      inputs: { kind: 'music', tier: 'lyria3pro', seconds: 180 },
    },
    {
      icon: Sofa, title: '1hr background bed', blurb: 'Lyria 3 continuous',
      cost: '$4.80', footnote: '120 × 30s clips at $0.04 — crossfaded to loop seamlessly',
      inputs: { kind: 'music', tier: 'lyria3' },
    },
    // --- Voice ---
    {
      icon: PhoneCall, title: '10-min support call', blurb: 'Flash Live · balanced turns',
      cost: '$0.12', footnote: '5 min in @ $0.005 + 5 min out @ $0.018',
      inputs: { kind: 'voice', voiceModel: 'flashLive', minutes: 10, outputShare: 50 },
    },
    {
      icon: Globe, title: '1hr live translation', blurb: 'Gemini 3.5 Live Translate',
      cost: '~$1.42', footnote: '42 min out @ $0.0315 + 18 min in @ $0.0053 — the specialist model costs 1.75× Flash Live on output, because it speaks continuously while still listening',
      inputs: { kind: 'voice', voiceModel: 'translate', minutes: 60, outputShare: 70 },
    },
    {
      icon: Headphones, title: '30-min listening agent', blurb: 'Mostly intake, short replies',
      cost: '~$0.21', footnote: '25.5 min in + 4.5 min out — cheap because the model listens',
      inputs: { kind: 'voice', voiceModel: 'flashLive', minutes: 30, outputShare: 15 },
    },
    {
      icon: Phone, title: '100k × 5-min calls', blurb: 'Call-center scale',
      cost: '~$5,750', footnote: '100k × $0.0575/call (50/50 split) — before grounding, tools, or STT fallbacks',
      inputs: { kind: 'voice', voiceModel: 'flashLive', minutes: 5, outputShare: 50 },
    },
  ],
  deepDive: [
    {
      title: 'Why music bills per-clip (or per-song), not per-second',
      hook: 'The pricing unit follows whatever the model was trained to produce in a single call.',
      bullets: [
        'Lyria 3 returns a fixed 30s track — billed as one unit at $0.04. Need 31s? Pay for two.',
        'Lyria 3 Pro was retrained for full-song coherence — it understands intros, verses, choruses, bridges — and is priced flat at $0.08 per song up to three minutes.',
        'So the sixth 30-second clip costs the same $0.04 as the first, while seconds 31–180 inside one Pro call are free. Past ~60 seconds, Pro is simply cheaper *and* better.',
        'Both take a reference image as a prompt and can generate vocals over supplied lyrics; both carry SynthID watermarks and C2PA provenance.',
      ],
      sources: [
        { label: 'Google Cloud — Lyria 3 and Lyria 3 Pro on Vertex AI', href: 'https://cloud.google.com/blog/products/ai-machine-learning/lyria-3-and-lyria-3-pro-on-vertex-ai' },
        { label: 'Gemini API pricing — Lyria', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
      ],
    },
    {
      title: 'Why music costs many times speech per second',
      hook: 'Music is a denser signal that the model must keep coherent across instruments and minutes.',
      stat: { value: '~4.4×', label: 'Lyria 3 per-second rate vs. Flash Live voice output' },
      bullets: [
        'Speech: 16–24 kHz mono, one speaker at a time — thin signal.',
        'Music: 48 kHz, multiple instruments, full audible band, often stereo — several-times-denser token stream.',
        'The model must predict harmony + rhythm across instruments and stay coherent over minutes.',
        'Concrete: Lyria 3 at $0.0013/s ($0.04/30s) vs. Gemini 3.1 Flash Live voice output ~$0.0003/s.',
      ],
      sources: [
        { label: 'Gemini API pricing — Lyria & Live models', href: 'https://ai.google.dev/gemini-api/docs/pricing' },
        { label: 'Google DeepMind — Lyria', href: 'https://deepmind.google/technologies/lyria/' },
      ],
    },
    {
      title: '"Audio-to-audio in one model" is a bigger deal than it sounds',
      hook: 'One model that both hears and speaks replaces a three-step pipeline: speech-to-text → language model → text-to-speech.',
      metaphor: 'The old way was three models in a trenchcoat pretending to be one. Now it\'s actually one.',
      bullets: [
        'Old pipeline: every hand-off dropped tone, flattened emotion, and added a beat of latency.',
        'Gemini 3.1 Flash Live keeps tone, pacing, laughter, and interruptions intact because it never converts to text in the middle.',
        'Billing simplifies too: one invoice ($0.005/min in, $0.018/min out) instead of separate speech-recognition and text-to-speech bills.',
      ],
      sources: [
        { label: 'Google DeepMind — Gemini Live', href: 'https://deepmind.google/technologies/gemini/' },
      ],
    },
    {
      title: 'Why voice output costs 3.6× input',
      hook: 'Listening happens in one sweep through the model. Speaking has to be generated chunk by chunk, each chunk building on the one before.',
      stat: { value: '3.6×', label: '$0.018/min output vs. $0.005/min input' },
      bullets: [
        'Input: the model processes incoming audio in one pass — small, predictable cost.',
        'Output: each chunk of spoken audio depends on everything spoken so far, so the model runs over and over, one chunk at a time.',
        'A voice agent that listens more than it talks is materially cheaper than one that monologues.',
        'Product decisions — when to speak, when to stay quiet — now have a direct line to the bill.',
        'The ratio gets steeper for specialists: Gemini 3.5 Live Translate charges $0.0315/min out against $0.0053/min in — nearly 6×, because a translator talks through the entire session.',
      ],
      sources: [
        { label: 'Vertex AI Gemini Live pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
        { label: 'Google — Gemini Live API docs', href: 'https://ai.google.dev/gemini-api/docs/live' },
      ],
    },
    {
      title: 'Licensing is the enterprise moat for music',
      hook: 'Quality between Lyria, Suno, Udio, and ElevenLabs Music has largely converged — provenance is the differentiator.',
      bullets: [
        'Lyria trained on material YouTube and Google hold rights to, and outputs are filtered against existing recordings before they come back.',
        'Ships under Vertex\'s standard generative-AI indemnification, with SynthID watermarks and C2PA metadata on every track — Google absorbs the provenance risk.',
        'Suno, Udio are cheaper but carry ongoing copyright exposure.',
      ],
      sources: [
        { label: 'DeepMind × YouTube — Lyria partnership', href: 'https://blog.youtube/news-and-events/dream-track-ai-experiment/' },
        { label: 'Google Cloud generative AI indemnification', href: 'https://cloud.google.com/terms/service-terms' },
        { label: 'RIAA v. Suno / Udio complaint (2024)', href: 'https://www.riaa.com/riaa-record-labels-sue-ai-music-generators-suno-and-udio/' },
      ],
    },
    {
      title: 'When to use Chirp 3 HD or Gemini TTS Pro instead of Live',
      hook: 'Flash Live is priced for conversation. For monologue, text-first TTS is an order of magnitude cheaper.',
      bullets: [
        'Chirp 3 HD — $30 per 1M chars ($0.00003/char).',
        'Gemini TTS Pro — $20 per 1M output tokens.',
        'A 10-hour audiobook (~1.8M chars) ≈ $54 on Chirp 3 HD vs. several dollars per minute on Live.',
        'Rule of thumb: Live for dialogue, TTS for monologue.',
      ],
      sources: [
        { label: 'Google Cloud — Chirp 3 HD pricing', href: 'https://cloud.google.com/text-to-speech/pricing' },
        { label: 'Vertex AI Gemini TTS pricing', href: 'https://cloud.google.com/vertex-ai/generative-ai/pricing' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// World Models
// ---------------------------------------------------------------------------
const world: Modality = {
  id: 'world',
  label: 'World Models',
  short: 'Worlds',
  accent: {
    text: 'text-amber-600',
    bg: 'bg-amber-500',
    bgSoft: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-300',
    from: 'from-amber-400',
    to: 'to-pink-500',
    hex: '#f59e0b',
  },
  tagline: 'Video you can *play*. Every input generates the next frame in real time.',
  disclaimer: 'Still the one modality with no public per-unit price. Project Genie shipped to consumers in January 2026, but as a subscription perk — no vendor has published serving cluster sizes, fps targets, or per-session costs. The tiers below (1× / 4× / 8× H100) are illustrative, chosen to teach the cost shape, not to predict what Genie or Oasis actually run on.',
  primer: [
    'World models (Genie 3, Oasis, GameNGen) are video models with a twist: every frame, you give them an action — an arrow key, a mouse move, a controller input — and they draw what happens next.',
    'The cost shape is unusual: you rent the whole cluster for the duration of a session, not per frame. Because each frame depends on the input the user just pressed, there\'s nothing to batch.',
    'This is the only modality here you still can\'t buy by the unit. Project Genie opened to Google AI Ultra subscribers in the US on 29 January 2026, capped at 60-second generations — a rationed subscription, not an API with a rate card. The prices below are ours, not Google\'s.',
    'Consistency is the other wall: after a minute or two of play, generated worlds start to drift — textures jitter, collision rules break, rooms you\'ve already visited look different when you come back. That\'s why none of this has replaced a real game engine yet.',
  ],
  whyExpensive: 'A regular video model pre-plans a whole clip and generates many frames together, sharing the work. A world model can\'t — it only knows what to draw next after you\'ve pressed a key. Every frame is generated one at a time, under a deadline, which throws away the usual savings. So you rent the whole GPU cluster for as long as someone is playing.',
  formula: 'cluster_size (H100s) = Lite 1 · Mid 4 · SOTA 8\ngpu_hours            = (minutes / 60) × cluster_size\ndollars              = gpu_hours × $2.16/hr × 1.5   # blended retail\n\n# no Vertex list price exists — these are teaching estimates.\n# you rent the whole cluster for the session; fps and resolution\n# are absorbed into the tier multiplier.',
  fields: [
    { id: 'minutes', type: 'slider', label: 'Session length', min: 1, max: 120, step: 1, default: 10, unit: 'min',
      hint: v => v < 5 ? 'demo' : v < 30 ? 'short session' : v < 90 ? 'gameplay session' : 'long session',
    },
    { id: 'tier', type: 'select', label: 'Model tier', default: 'mid',
      options: [
        { value: 'lite', label: 'Lite · distilled · 1× H100', estimated: true },
        { value: 'mid',  label: 'Mid · research SOTA · 4× H100', estimated: true },
        { value: 'sota', label: 'SOTA · film-quality · 8× H100', estimated: true },
      ],
    },
  ],
  calc: (inputs) => {
    const minutes = Number(inputs.minutes)
    const tier    = String(inputs.tier)

    // World-model inference isn't per-frame work you can batch. You rent a
    // whole GPU cluster for the session duration. No Vertex list price
    // exists, so these are teaching estimates anchored to blended H100
    // retail rates. Tier encodes the whole resolution/quality story.
    const clusterSize = tier === 'lite' ? 1 : tier === 'mid' ? 4 : 8
    const gpuHours = (minutes / 60) * clusterSize
    const H100_HOURLY = GPU_SECOND * 3600        // $2.16/hr at our blended rate
    const dollars = gpuHours * H100_HOURLY * 1.5 // retail margin

    return {
      headline: fmt(dollars),
      sub: `per ${minutes}-min session`,
      dollars,
      unitLabel: `per ${minutes}-min session`,
      breakdown: [
        { label: 'Cluster size',             value: `${clusterSize}× H100` },
        { label: 'Session length',           value: `${minutes} min` },
        { label: 'GPU-hours',                value: gpuHours.toFixed(3) },
        { label: 'Blended H100 retail rate', value: `$${(H100_HOURLY * 1.5).toFixed(2)}/GPU-hr` },
      ],
    }
  },
  scenarios: [
    { icon: Joystick, title: '2-min demo playthrough', blurb: 'Lite · 1× H100',    cost: '~$0.11',  footnote: 'research / solo session',
      inputs: { minutes: 2, tier: 'lite' },
    },
    {
      icon: Gamepad2, title: '1hr gameplay session', blurb: 'varies by model tier',
      cost: '$3.24 → $26', footnote: 'tier drives cluster size — Lite 1×, Mid 4×, SOTA 8× H100',
      inputs: { minutes: 60 },
      tiers: [
        { label: 'Lite (distilled)',    cost: '~$3.24', inputs: { tier: 'lite' } },
        { label: 'Mid (research SOTA)', cost: '~$13',   inputs: { tier: 'mid'  } },
        { label: 'SOTA (film-quality)', cost: '~$26',   inputs: { tier: 'sota' } },
      ],
    },
    { icon: FlaskConical, title: '10k evaluation rollouts', blurb: 'Lite tier · 30s each',  cost: '~$270',   footnote: '10k × 30s on 1× H100 ≈ 83 GPU-hrs × $3.24/hr retail' },
    { icon: Globe, title: '1M users × 20min',        blurb: 'SOTA tier · multi-GPU/session',   cost: '~$4M',    footnote: 'why this isn\'t yet free-to-play — the unit economics still assume a rented cluster per player' },
  ],
  deepDive: [
    {
      title: 'Why real-time is the hard part',
      hook: 'Video models batch; world models can\'t — each frame depends on the input the user just pressed.',
      metaphor: 'A video model is a film crew. A world model is an improv partner — it has to respond before you finish the thought.',
      bullets: [
        'Regular video models generate many frames in parallel and amortize compute across a clip.',
        'World models generate 1 frame conditioned on the last input — no batching, no pipelining.',
        'Every frame pays the full per-frame cost serially.',
        'That\'s why the unit of cost is "cluster-hours," not "generations."',
      ],
      sources: [
        { label: 'Google DeepMind — Genie 3', href: 'https://deepmind.google/discover/blog/genie-3/' },
        { label: 'Valevski et al. — GameNGen (Diffusion Models Are Real-Time Game Engines)', href: 'https://arxiv.org/abs/2408.14837' },
      ],
    },
    {
      title: 'Project Genie shipped — as a subscription, not an API',
      hook: 'The first consumer world model went live on 29 January 2026, and the way it\'s sold tells you everything about what it costs to serve.',
      stat: { value: '60s', label: 'cap on a single generation at launch' },
      metaphor: 'When a product ships with a queue and a cap instead of a price, the price is the part that isn\'t ready.',
      bullets: [
        'Access is bundled into Google AI Ultra, US-only, 18+, as an "experimental research prototype" — not a metered endpoint.',
        'Every other modality on this page has a published per-unit rate. This one has a monthly fee and a daily allowance, which is what rationing looks like when marginal cost is high and unpredictable.',
        'Run the arithmetic against our Mid tier estimate (~$13 per gameplay hour): an hour a day would cost several times a single subscription. Caps are doing the work a price would.',
        'When world models get a per-second rate, that\'s the signal the serving cost finally fits inside a normal unit economic — the same transition video made in 2024.',
      ],
      sources: [
        { label: 'Google — Project Genie for AI Ultra subscribers', href: 'https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/' },
        { label: 'Google DeepMind — Genie 3', href: 'https://deepmind.google/discover/blog/genie-3/' },
      ],
    },
    {
      title: 'The bottleneck is memory speed, not raw math',
      hook: 'World models aren\'t limited by how many calculations the GPU can do. They\'re limited by how fast the GPU can shuffle the model\'s memory of the world in and out.',
      stat: { value: '3.35 TB/s', label: 'H100 memory bandwidth — the current ceiling' },
      bullets: [
        'The model has to keep track of everything you\'ve seen — objects, rooms, where you\'ve been — and pull that memory into the chip for every new frame.',
        'It has to do that within ~100 ms per frame or the game feels laggy.',
        'The H100 is the workhorse; the newer B200 raises the ceiling a bit but is still in short supply.',
        'This is why world models are gated behind subscriptions instead of sold by the second — the hardware can barely keep up.',
      ],
      sources: [
        { label: 'NVIDIA H100 datasheet', href: 'https://www.nvidia.com/en-us/data-center/h100/' },
      ],
    },
    {
      title: 'The controls are learned, not programmed',
      hook: 'World models learn physics and controls by watching video — there\'s no hand-coded game engine inside.',
      bullets: [
        'The model figures out on its own that "arrow key up" means "move forward" and "mouse right" means "look right."',
        'Those mappings generalize across most generated environments — a big leap over 2024 models.',
        'There\'s no explicit collision box, no authored gravity — the physics is all statistical, inferred from millions of videos.',
        'The tradeoff: the model pays for that generality on every single frame.',
      ],
    },
    {
      title: 'The two-minute wall',
      hook: 'Around 120 seconds of continuous play, generated worlds start to forget themselves.',
      stat: { value: '~120s', label: 'before visible texture and physics drift' },
      bullets: [
        'Textures shimmer, collision rules break, rooms you visited earlier look different when you come back.',
        'The cause: the model\'s memory of what just happened fades as new frames push old ones out.',
        'Nobody has yet replaced a real game engine with a world model for more than short demos — Project Genie ships with a 60-second cap for exactly this reason.',
        'This memory wall — not picture quality — is the real blocker for shipping a real game.',
      ],
      sources: [
        { label: 'Google DeepMind — Genie 3', href: 'https://deepmind.google/discover/blog/genie-3/' },
        { label: 'Decart/Etched — Oasis model card', href: 'https://oasis.decart.ai/' },
      ],
    },
  ],
}

export const MODALITIES: Modality[] = [images, video, audio, world]

// Given the default inputs for each modality, compute dollars — used by
// the cross-modality "same $1" finale.
export function defaultCost(m: Modality): CostResult {
  const inputs: Inputs = {}
  for (const f of m.fields) inputs[f.id] = f.default
  return m.calc(inputs)
}
