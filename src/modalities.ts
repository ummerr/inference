// Single source of truth for Gen Media modalities.
// All cost numbers are illustrative — designed to teach the *shape* of the
// math (what makes things expensive, how costs scale), not to be quoted as
// authoritative pricing. Real prices vary wildly by provider, batch size,
// and hardware utilization.

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
}
export interface ToggleField {
  id: string
  type: 'toggle'
  label: string
  default: boolean
  onLabel: string
  offLabel: string
  hint?: string
}
export interface SelectField {
  id: string
  type: 'select'
  label: string
  default: string
  options: { value: string; label: string; hint?: string }[]
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
  icon: string
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

export interface DeepDiveBlock {
  title: string
  body: string
}

export interface Modality {
  id: 'images' | 'video' | 'music' | 'voice' | 'world'
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
  if (n >= 10) return `$${n.toFixed(2)}`
  if (n >= 1) return `$${n.toFixed(3)}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  if (n >= 0.0001) return `$${n.toFixed(5)}`
  return `$${n.toExponential(2)}`
}

// A single "GPU-second" unit cost for a modern accelerator (H100-class, cloud-rented).
// As of April 2026 the H100 on-demand market has settled around $1.38–$3.93/hr
// (RunPod $1.99, TensorDock $2.25, Lambda $2.99, AWS $3.93; Azure/Oracle are
// outliers). Blackwell B200 is $5.49–$6.69/hr. We use $2.16/hr ≈ $0.0006/GPU-s
// as the representative H100 figure.
const GPU_SECOND = 0.0006

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
    'Image models start with random noise and, step by step, "de-noise" it into a picture. Each step is one full pass through a big neural network.',
    'Google\'s current image family on Vertex AI is the Gemini-native "Nano Banana" line: Nano Banana (Gemini 2.5 Flash Image, $0.039/image), Nano Banana 2 (Gemini 3.1 Flash Image, $0.067/image at 1K), and Nano Banana Pro (Gemini 3 Pro Image, $0.134/image at 1K/2K). Same diffusion mechanic, more compute per call at the top.',
  ],
  whyExpensive: 'More steps = better image, linearly more compute. Guidance (CFG) runs the model twice per step. Resolution scales the per-step work by pixels². Vertex hides the knobs behind a tier name — you pick Nano Banana / NB 2 / NB Pro, it picks the steps for you.',
  formula: 'gpu_seconds = steps × passes × size_mul × (res / 1024)² × 0.083\ndollars    = gpu_seconds × $0.0006/s × 27   # retail API markup\n\n# size_mul: Nano Banana 0.58, NB 2 1.0, NB Pro 2.0\n# passes:   guided = 2, unguided = 1',
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
      id: 'modelSize', type: 'select', label: 'Vertex tier', default: 'medium',
      options: [
        { value: 'small',  label: 'Nano Banana · Gemini 2.5 Flash Image ($0.039/img)' },
        { value: 'medium', label: 'Nano Banana 2 · Gemini 3.1 Flash Image ($0.067/img)' },
        { value: 'large',  label: 'Nano Banana Pro · Gemini 3 Pro Image ($0.134/img)' },
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
    const sizeMul  = size === 'small' ? 0.58 : size === 'medium' ? 1 : 2
    const passes   = guided ? 2 : 1

    // Calibrated so the default knobs (Nano Banana 2, 25 steps, guided, 1024²)
    // land on the real Vertex list price of $0.067/image. Nano Banana hits
    // $0.039 and Nano Banana Pro hits $0.134 at the same defaults.
    const gpuSeconds = steps * passes * sizeMul * pixelMul * 0.083
    const dollars = gpuSeconds * GPU_SECOND * 27 // retail API markup

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
      icon: '🖼️', title: 'One 1024² image', blurb: 'Single Gemini image call',
      cost: '$0.039 → $0.134', footnote: 'Vertex list price per image — tier = Nano Banana (2.5 Flash Image) / NB 2 (3.1 Flash Image) / NB Pro (3 Pro Image)',
      inputs: { steps: 25, guided: true, resolution: '1024' },
      tiers: [
        { label: 'Nano Banana',     cost: '$0.039', inputs: { modelSize: 'small' } },
        { label: 'Nano Banana 2',   cost: '$0.067', inputs: { modelSize: 'medium' } },
        { label: 'Nano Banana Pro', cost: '$0.134', inputs: { modelSize: 'large' } },
      ],
    },
    {
      icon: '🖨️', title: '2K print-ready', blurb: 'Native 2048² output',
      cost: '$0.101 → $0.134', footnote: 'NB 2 scales with resolution ($0.101 at 2K); NB Pro is flat $0.134 through 2K (then $0.24 at 4K). Nano Banana is fixed at 1024².',
      inputs: { steps: 25, guided: true, resolution: '2048' },
      tiers: [
        { label: 'Nano Banana 2',   cost: '$0.101', inputs: { modelSize: 'medium' } },
        { label: 'Nano Banana Pro', cost: '$0.134', inputs: { modelSize: 'large' } },
      ],
    },
    {
      icon: '📦', title: 'Catalogue of 10k', blurb: 'Batched via Vertex batch API',
      cost: '$195 → $670', footnote: 'Batch API is ~50% cheaper than online; committed-use discounts stack on top',
      tiers: [
        { label: 'Nano Banana',     cost: '$195' },
        { label: 'Nano Banana 2',   cost: '$335' },
        { label: 'Nano Banana Pro', cost: '$670' },
      ],
    },
    {
      icon: '✂️', title: 'Edit pass', blurb: 'Image-in → image-out with a Nano Banana call',
      cost: '$0.039 – $0.134', footnote: 'Edits and generations bill the same on Gemini image models — one call, one image out',
    },
  ],
  deepDive: [
    {
      title: 'Why Google moved image gen into Gemini itself',
      body: 'Imagen 1–3 were standalone image models with separate text encoders. Imagen 4 (May 2025) was a Latent Diffusion Transformer with a Gemini-derived text encoder bolted on, which is most of why prompt adherence jumped. The Nano Banana family goes one step further: the image head is part of Gemini itself, so the same model that reasons about your prompt also emits the picture. That is why Nano Banana Pro can take multi-turn edit instructions, maintain a character across calls, and render legible text — capabilities classical diffusion pipelines bolt on through ControlNets and IP-Adapters. The pricing reflects this: image output is just "more tokens" on a multimodal model, billed at $30/M (Nano Banana), $60/M (NB 2), or $120/M (NB Pro) output tokens.',
    },
    {
      title: 'Latent space is why any of this is affordable',
      body: 'These models never denoise pixels. A VAE encoder compresses a 1024² image (~1M pixels × 3 channels) into a roughly 128×128×4 latent — ~64× fewer values to touch per step. The transformer runs ~20–30 denoising steps over that latent, then the VAE decoder reconstructs pixels in a single forward pass at the end. Without this trick, a single image call would cost dollars, not cents, and consumer-visible pricing like $0.039/image would not exist. Imagen 3/4, the Nano Banana line, Flux 2, and GPT Image 1.5 all rely on the same latent-space shortcut.',
    },
    {
      title: 'Nano Banana / NB 2 / NB Pro is three inference budgets, one family',
      body: 'Nano Banana (Gemini 2.5 Flash Image, $0.039) is a step-distilled, FP8-quantised variant on Trillium-class TPUs, fixed at 1024² and tuned for latency. Nano Banana 2 (Gemini 3.1 Flash Image, $0.045–$0.151 across 0.5K–4K) keeps the speed profile of a Flash model but unlocks native resolution scaling. Nano Banana Pro (Gemini 3 Pro Image, $0.134 at 1K/2K, $0.24 at 4K) runs the full Gemini 3 Pro weights with the image head active — that is where reasoning-heavy capabilities like multi-object composition and in-image text rendering actually come from. Same family, radically different compute envelopes.',
    },
    {
      title: 'Why guidance doubles your bill',
      body: 'Classifier-free guidance, the trick that makes diffusion follow prompts, runs the model twice per denoising step — once conditioned on the prompt, once unconditioned — and extrapolates between them. It roughly doubles the FLOPs per step. Step-distilled Flash variants (Nano Banana, Flux Schnell, LCM distillations) collapse both CFG and the step count into a single-pass student network, which is why the cheapest tier is dramatically faster and cheaper without looking visibly worse at 1024². Once you move to NB Pro or need native 4K, you are back to the full sampler and the FLOPs show up on the invoice.',
    },
    {
      title: 'Why Vertex\'s $0.039 beats self-hosting Flux',
      body: 'You can run Flux 2 on a rented RTX 5090 (~$0.89/hr spot, 1,792 GB/s GDDR7, only ~12% behind an H100\'s memory bandwidth) or an H100 PCIe (~$2/hr) and get competitive per-image compute cost on paper. What you cannot reproduce is Google\'s serving stack at that price point: sustained TPU utilization, step + CFG distillation baked into the Flash tier, graph-compiled kernels, FP8 weights, First-Block-Cache-style skip logic, and indemnification on the training data. Third-party "juiced endpoint" providers (Fal, Replicate, BFL) rebuild some of this on top of Flux and land around the same per-image cost — which is the honest comparison. A self-hosted 5090 wins only when you need control, custom LoRAs, or offline generation; for API traffic, the managed economics dominate.',
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
    'A video model has to generate every frame *and* keep them consistent — a cup on a table in frame 1 must be the same cup in frame 120.',
    'Classic temporal attention made every frame look at every other frame — O(n²) and brutal. In 2026, sparse-attention methods made long-context video practical, which is why Veo 3.1, Kling, and Runway Gen-4 render a 10-second clip in roughly a minute rather than many.',
    'The market has settled on per-second billing because flat-rate video inference doesn\'t work — the unit cost is too high and too variable to hide inside a subscription.',
  ],
  whyExpensive: 'Cost ≈ (per-frame work) × frames. The old O(n²) temporal attention has been flattened to near-linear by sparse attention, but each frame still does image-worthy compute at higher resolutions. Every extra second or pixel is still real money.',
  formula: 'frames      = seconds × fps\nper_frame   = 2.5 × (res / 720)² × tier_mul     # linear\ntemporal    = frames² / 8000 × tier_mul × pixel_mul  # quadratic residue\ngpu_seconds = frames × per_frame + temporal\ndollars     = gpu_seconds × $0.0006/s × 11       # retail markup\n\n# tier_mul: Lite 0.125, Fast 0.375, Standard 1.0',
  fields: [
    { id: 'seconds',    type: 'slider', label: 'Length',     min: 1, max: 120, step: 1,  default: 6, unit: 's',
      hint: v => v <= 8 ? 'social clip' : v <= 20 ? 'short ad' : v <= 60 ? 'scene' : 'short film',
    },
    { id: 'fps',        type: 'slider', label: 'Frame rate', min: 8, max: 30, step: 2, default: 24, unit: ' fps' },
    { id: 'resolution', type: 'select', label: 'Resolution', default: '720',
      options: [
        { value: '480', label: '480p' },
        { value: '720', label: '720p' },
        { value: '1080', label: '1080p' },
        { value: '2160', label: '4K' },
      ],
    },
    { id: 'tier', type: 'select', label: 'Vertex tier', default: 'good',
      options: [
        { value: 'lite', label: 'Veo 3.1 Lite ($0.05/s, no audio)' },
        { value: 'fast', label: 'Veo 3.1 Fast ($0.15/s, w/ audio)' },
        { value: 'good', label: 'Veo 3.1 Standard ($0.40/s, w/ audio)' },
      ],
    },
  ],
  calc: (inputs) => {
    const seconds = Number(inputs.seconds)
    const fps     = Number(inputs.fps)
    const res     = Number(inputs.resolution)
    const tier    = String(inputs.tier)

    const frames   = seconds * fps
    const pixelMul = (res / 720) ** 2
    const tierMul  = tier === 'lite' ? 0.125 : tier === 'fast' ? 0.375 : 1

    // Per-frame cost, tuned so a 6s/24fps/720p Standard clip lands on Vertex
    // Veo 3.1 Standard pricing (6s × $0.40/s = $2.40). Lite and Fast tiers
    // likewise hit $0.05/s and $0.15/s at their defaults.
    const perFrameGpuS = 2.5 * pixelMul * tierMul
    // Residual quadratic term (smaller than pre-sparse-attention era). Kept small
    // so the teaching point — that long clips still cost more than linearly — is
    // visible without overpowering the per-frame term.
    const temporalGpuS = (frames * frames / 8000) * tierMul * pixelMul

    const gpuSeconds = frames * perFrameGpuS + temporalGpuS
    const dollars = gpuSeconds * GPU_SECOND * 11 // retail API markup

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
      icon: '📱', title: '6s social clip', blurb: '720p, one generation',
      cost: '$0.30 → $2.40', footnote: 'Lite has no audio; Fast/Standard include synchronized audio',
      inputs: { seconds: 6, fps: 24, resolution: '720' },
      tiers: [
        { label: 'Lite',     cost: '$0.30', inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$0.90', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$2.40', inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '📺', title: '30s ad spot', blurb: 'Stitched from ≤8s clips',
      cost: '$1.50 → $12', footnote: '30 × per-second rate; retries and edits add 1.5–3× in practice',
      inputs: { seconds: 30, fps: 24, resolution: '1080' },
      tiers: [
        { label: 'Lite',     cost: '$1.50', inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$4.50', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$12',   inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '🎬', title: '2min short scene', blurb: '~15 clips stitched',
      cost: '$6 → $48', footnote: 'before the VFX/color pass that a real short needs',
      inputs: { seconds: 120, fps: 24, resolution: '1080' },
      tiers: [
        { label: 'Lite',     cost: '$6',     inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$18',    inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$48',    inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '🎞️', title: '1hr generated film', blurb: 'Linear extrapolation',
      cost: '$180 → $1,440', footnote: 'just inference — before retries, rejects, and post',
      tiers: [
        { label: 'Lite',     cost: '$180' },
        { label: 'Fast',     cost: '$540' },
        { label: 'Standard', cost: '$1,440' },
      ],
    },
  ],
  deepDive: [
    {
      title: 'Why per-second billing won',
      body: 'High-fidelity video inference is too expensive to hide inside a flat subscription — a single 10s clip can burn dollars of real compute, so any fixed-price tier has to underprice light users or overcharge heavy ones. Veo 3.1, Kling, and Runway Gen-4 all land on per-second billing for the same reason: it\'s the only unit that tracks what the GPUs actually do. The Veo 3.1 ladder — Lite $0.05/s, Fast $0.15/s, Standard $0.40/s — lets you trade fidelity for cost explicitly instead of guessing.',
    },
    {
      title: 'Why a video clip costs 40× an image',
      body: 'A 6s/24fps clip is 144 frames. Each frame does roughly a 1024² image\'s worth of diffusion FLOPs plus enough cross-frame attention to stay consistent. Veo 3.1 Standard at $0.40/sec means a single 6s clip is $2.40 — about 36× a Nano Banana image ($0.067) or 60× a Nano Banana Flash ($0.039). The per-frame number is actually low (~$0.017 at Standard, ~$0.0021 at Lite) because Veo amortizes compute across the whole clip. The cost comes from volume: you are not paying for one generation, you are paying for 144 of them at once.',
    },
    {
      title: 'Sparse attention broke the O(n²) curse',
      body: 'Until late 2025, temporal attention scaled quadratically with the number of frames — every frame had to look at every other frame, and long clips blew up. Sparse-attention variants restrict each frame to a handful of relevant neighbors, turning the quadratic term into something close to linear. That is why Veo 3.1 and its peers can render a 10-second clip in roughly a minute while the first-generation video models spent many. The pricing ladder now tracks compute honestly instead of hiding a quadratic tail.',
    },
    {
      title: 'Why long clips still "drift"',
      body: 'Generating more than a few seconds at once still exceeds VRAM at 1080p+, so models chunk + blend. Sparse attention helps the attention math, but the model still has to remember what happened in chunk 1 when rendering chunk 6. Beyond ~20 seconds of continuous generation, most systems show subtle texture jitter or physics inconsistencies — the reason providers cap max clip length at 16–30 seconds.',
    },
    {
      title: 'The caching + compilation stack',
      body: 'Serving infra — whether it\'s Google fronting Veo on Trillium-class TPU pods or Fal.ai / Replicate / BFL fronting Flux on H100s — layers the same ideas: First Block Cache (FBCache), graph compilation (XLA or torch_compile), and FP8/INT8 quantization on top of the base model. This can drop wall time by ~3.5× vs. a cold reference implementation. The reason Vertex list prices beat what a naive reproduction would cost on rented GPUs is almost entirely sustained-utilization plus this compilation stack.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------
// Music and Voice are siblings — same emerald hue, different shades — because
// they're both "audio" but they're different model families with genuinely
// different cost shapes.
const music: Modality = {
  id: 'music',
  label: 'Music',
  short: 'Music',
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
  tagline: 'Full-band, 48 kHz, generated from a prompt.',
  primer: [
    'Music generation on Vertex is the Lyria line. Lyria 2 is GA and bills at $0.06 per 30-second clip — a 48 kHz WAV, rendered from a text prompt.',
    'Lyria 3 Pro launched in March 2026 and lifts the ceiling from 30-second clips to full 3-minute songs, with enterprise pricing quoted separately. Reported flat pricing lands near $0.08 per song; Google has not yet published an official Vertex list rate.',
  ],
  whyExpensive: 'Music encodes multiple instruments across a wider frequency range at 48 kHz — several times more tokens per second than speech. Lyria 2 bills per 30-second clip, so a 31-second song rounds up to two clips. Lyria 3 Pro flips that to a flat per-song rate, which is cheaper for full tracks and more expensive for stingers.',
  formula: 'clips       = ceil(seconds / 30)     # Lyria 2 per-clip billing\ndollars_L2  = clips × $0.06\ndollars_L3P = $0.08                   # flat per song, up to ~180s\n\n# Vertex Lyria 2: $0.06 / 30s clip, 48kHz WAV\n# Lyria 3 Pro:    flat ~$0.08 / song, launched Mar 2026',
  fields: [
    { id: 'tier', type: 'select', label: 'Vertex model', default: 'lyria2',
      options: [
        { value: 'lyria2',    label: 'Lyria 2 · $0.06 / 30s clip' },
        { value: 'lyria3pro', label: 'Lyria 3 Pro · ~$0.08 flat per song (≤3 min)' },
      ],
    },
    { id: 'seconds', type: 'slider', label: 'Track length', min: 5, max: 300, step: 5, default: 30, unit: 's',
      hint: v => v <= 15 ? 'stinger' : v <= 45 ? 'jingle' : v <= 120 ? 'single cue' : v <= 180 ? 'full song' : 'extended',
    },
  ],
  calc: (inputs) => {
    const tier    = String(inputs.tier)
    const seconds = Number(inputs.seconds)

    let dollars: number
    let clipInfo: string
    if (tier === 'lyria2') {
      const clips = Math.max(1, Math.ceil(seconds / 30))
      dollars = clips * 0.06
      clipInfo = `${clips} × 30s clip @ $0.06`
    } else {
      dollars = 0.08
      clipInfo = 'flat per-song rate'
    }

    const warn = tier === 'lyria3pro' && seconds > 180
      ? 'Lyria 3 Pro caps at roughly 3-minute tracks — longer runs have to be stitched from multiple calls.'
      : undefined

    return {
      headline: fmt(dollars),
      sub: `per ${seconds}s track`,
      dollars,
      unitLabel: `per ${seconds}s track`,
      breakdown: [
        { label: 'Model',        value: tier === 'lyria2' ? 'Lyria 2' : 'Lyria 3 Pro' },
        { label: 'Billing unit', value: clipInfo },
        { label: 'Sample rate',  value: '48 kHz WAV' },
      ],
      warn,
    }
  },
  scenarios: [
    {
      icon: '🎺', title: '30s jingle', blurb: 'One Lyria 2 clip',
      cost: '$0.06', footnote: 'exactly one billing unit on Lyria 2',
      inputs: { tier: 'lyria2', seconds: 30 },
    },
    {
      icon: '🎵', title: '3-min full song', blurb: 'Lyria 3 Pro flat vs Lyria 2 stitched',
      cost: '$0.08 → $0.36', footnote: 'Lyria 3 Pro at ~$0.08 is ~4.5× cheaper than stitching six Lyria 2 clips',
      inputs: { seconds: 180 },
      tiers: [
        { label: 'Lyria 3 Pro (flat)', cost: '~$0.08', inputs: { tier: 'lyria3pro' } },
        { label: 'Lyria 2 (6 clips)',  cost: '$0.36',  inputs: { tier: 'lyria2' } },
      ],
    },
    {
      icon: '💿', title: '20-song album', blurb: 'Lyria 3 Pro batch',
      cost: '~$1.60', footnote: '20 × ~$0.08/song — before iteration and rejected takes',
      inputs: { tier: 'lyria3pro', seconds: 180 },
    },
    {
      icon: '🛋️', title: '1hr background bed', blurb: 'Lyria 2 continuous',
      cost: '$7.20', footnote: '120 × 30s clips at $0.06 — crossfaded to loop seamlessly',
      inputs: { tier: 'lyria2', seconds: 3600 },
    },
  ],
  deepDive: [
    {
      title: 'Why music bills per-clip (or per-song), not per-second',
      body: 'A Lyria 2 call returns a fixed 30-second WAV — the model was trained and cost-tuned for that unit, so Google bills the unit directly at $0.06. Need 31 seconds? You pay for two clips. Lyria 3 Pro retrained for full-song coherence and Google reportedly priced it flat (near $0.08) because the marginal cost of seconds 31–180 inside one song is much lower than starting a second call. The per-clip vs per-song distinction is the most important pricing knob in music generation right now.',
    },
    {
      title: 'Why music costs many times speech per second',
      body: 'Speech is usually 16–24 kHz mono with one speaker at a time — a thin signal. Music at 48 kHz carries multiple instruments across the full audible band, often in stereo. The audio-token stream is several times denser, the model has to predict harmony and rhythm across instruments simultaneously, and the context has to stay coherent over minutes. All of that shows up in the per-second rate: Lyria 2 at $0.002/sec ($0.06 / 30s) vs Gemini 3.1 Flash Live voice output at ~$0.0003/sec.',
    },
    {
      title: 'Licensing is the enterprise moat',
      body: 'In 2026, technical quality between Lyria, Suno, Udio, and ElevenLabs Music has largely converged. The differentiator is training-data provenance. Lyria was trained in partnership with YouTube and music-industry licensors and ships under Vertex\'s standard generative-AI indemnification. Consumer services like Suno and Udio are cheaper but carry ongoing copyright exposure. For anything that has to clear Content ID at scale — ads, trailers, streamed backgrounds — the enterprise answer is usually Vertex so the provenance risk belongs to Google.',
    },
    {
      title: 'Stems, style, and prompt-to-track',
      body: 'The interesting Lyria 3 Pro features beyond length are stem outputs (drums / bass / melody / vocals separated, so you can re-mix), style conditioning from a reference clip, and continuation from a user-supplied intro. None of these change the flat per-song price — which is the point. Once per-song billing is the unit, workflow complexity stops compounding on the invoice and instead compounds on what you can do inside a single track.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------
// Sibling to Music — same emerald hue, darker shade. The latest Vertex voice
// story is native audio-to-audio via Gemini 3.1 Flash Live; legacy TTS is
// covered in the deep-dive for context.
const voice: Modality = {
  id: 'voice',
  label: 'Voice',
  short: 'Voice',
  accent: {
    text: 'text-emerald-800',
    bg: 'bg-emerald-700',
    bgSoft: 'bg-emerald-100',
    border: 'border-emerald-300',
    ring: 'ring-emerald-500',
    from: 'from-emerald-600',
    to: 'to-teal-700',
    hex: '#047857',
  },
  tagline: 'Native audio-to-audio. The voice-wrapper era is over.',
  primer: [
    'Gemini 3.1 Flash Live is a bidirectional audio-to-audio endpoint — raw 16 kHz PCM goes in, 24 kHz PCM comes out, and the model handles speech recognition, reasoning, and synthesis in one pass instead of stitching together STT + LLM + TTS.',
    'Billing is by minute of audio, split between input and output: $0.005/min in, $0.018/min out. A session where both sides speak about evenly runs roughly $0.023 per wall-clock minute of audio traffic.',
  ],
  whyExpensive: 'Output costs 3.6× input because generating natural-sounding audio tokens is heavier than encoding the user\'s voice. Total cost tracks how much the model *talks*, not how long the session lasts — so a voice agent that listens more than it speaks is materially cheaper.',
  formula: 'dollars = input_min × $0.005 + output_min × $0.018\n\n# Gemini 3.1 Flash Live\n# input:  16 kHz PCM · $0.005 / min\n# output: 24 kHz PCM · $0.018 / min',
  fields: [
    { id: 'minutes', type: 'slider', label: 'Session length', min: 1, max: 600, step: 1, default: 10, unit: 'min',
      hint: v => v < 5 ? 'quick exchange' : v < 30 ? 'conversation' : v < 120 ? 'long call' : 'marathon session',
    },
    { id: 'outputShare', type: 'slider', label: 'Share spoken by the model', min: 10, max: 90, step: 5, default: 50, unit: '%',
      hint: v => v < 30 ? 'mostly listening' : v < 60 ? 'balanced' : 'mostly talking',
    },
  ],
  calc: (inputs) => {
    const minutes     = Number(inputs.minutes)
    const outputShare = Number(inputs.outputShare) / 100

    const outputMin = minutes * outputShare
    const inputMin  = minutes * (1 - outputShare)

    const dollars = inputMin * 0.005 + outputMin * 0.018

    return {
      headline: fmt(dollars),
      sub: `per ${minutes}-min session`,
      dollars,
      unitLabel: `per ${minutes}-min session`,
      breakdown: [
        { label: 'Input audio',  value: `${inputMin.toFixed(1)} min × $0.005` },
        { label: 'Output audio', value: `${outputMin.toFixed(1)} min × $0.018` },
        { label: 'Model',        value: 'Gemini 3.1 Flash Live' },
      ],
    }
  },
  scenarios: [
    {
      icon: '☎️', title: '10-min support call', blurb: 'Balanced user/agent turns',
      cost: '$0.12', footnote: '5 min in @ $0.005 + 5 min out @ $0.018',
      inputs: { minutes: 10, outputShare: 50 },
    },
    {
      icon: '🌐', title: '1hr live translation', blurb: 'Model talks most of the time',
      cost: '~$0.85', footnote: '42 min out @ $0.018 + 18 min in @ $0.005 — model speaking ~70% of the session',
      inputs: { minutes: 60, outputShare: 70 },
    },
    {
      icon: '🎧', title: '30-min listening agent', blurb: 'Mostly intake, short replies',
      cost: '~$0.21', footnote: '25.5 min in + 4.5 min out — cheap because the model listens',
      inputs: { minutes: 30, outputShare: 15 },
    },
    {
      icon: '📞', title: '100k × 5-min calls', blurb: 'Call-center scale',
      cost: '~$5,750', footnote: '100k × $0.0575/call (50/50 split) — before grounding, tools, or STT fallbacks',
      inputs: { minutes: 5, outputShare: 50 },
    },
  ],
  deepDive: [
    {
      title: 'Why "native audio-to-audio" is a bigger deal than it sounds',
      body: 'The legacy voice stack was three models in a trenchcoat — Speech-to-Text, an LLM, and Text-to-Speech. Each one added latency, dropped prosody, and flattened emotion. Gemini 3.1 Flash Live replaces the whole trio with a single model that hears audio and speaks audio natively, so tone, pacing, laughter, and interruption-handling survive. The pricing reflects a single integrated model: $0.005/min input, $0.018/min output, no separate STT or TTS invoices.',
    },
    {
      title: 'Why output costs 3.6× input',
      body: 'Encoding incoming audio into tokens is a forward pass through an audio encoder — small model, predictable cost. Generating natural-sounding audio tokens on the way out is autoregressive: the model emits one chunk at a time, each conditioned on everything it has already said. Output is where the interesting compute lives, which is why a voice agent that listens more than it talks is materially cheaper than one that monologues. Product decisions — when the model should speak, when to stay quiet — now have a direct line to the bill.',
    },
    {
      title: 'Streaming changes latency, not cost',
      body: 'Flash Live streams audio as it generates — the model does not have to see the whole future before producing a sound. That keeps perceived latency under a few hundred milliseconds, which is what makes real-time conversation feel natural. It does not change total billed minutes: you still pay for every second of audio the model produces, streamed or not. Latency is a UX lever; cost is a duration lever.',
    },
    {
      title: 'When to reach for Chirp 3 HD or Gemini TTS Pro instead',
      body: 'Flash Live is for live conversation. For batch narration — audiobooks, voiceovers, localized dubs — text-first pipelines are still cheaper. Chirp 3 HD charges $30 per 1M characters ($0.00003/char) and Gemini TTS Pro charges $20 per 1M output tokens. A 10-hour audiobook at ~180k characters per hour lands around $54 on Chirp 3 HD, versus several dollars per minute on a Live session that you do not actually need to be live. Rule of thumb: Live for dialogue, TTS for monologue.',
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
  primer: [
    'World models (Genie 3, Oasis, GameNGen) are video models with a twist: you give them an action each frame — arrow key, mouse move, controller input — and they render the consequence.',
    'Google DeepMind\'s Genie 3 generates real-time navigable worlds at around 720p/24fps. DeepMind has not published the exact inference cluster size, and there is no Vertex list price — this modality is research-access only. The cost shape is clear even without official numbers: you rent a whole GPU cluster for as long as someone is playing, not per frame.',
    'Consistency is the other ceiling: after ~120 seconds of exploration, worlds tend to drift — textures jitter, collision rules fail, previously visited rooms warp. That\'s why nothing serious replaces a game engine yet.',
  ],
  whyExpensive: 'A video model generates 100 frames in a batch. A world model generates 1 frame, immediately, 30 times a second — and pays for compute that would have been batched.',
  formula: 'cluster_size = max(1, round( (res / 360)² × tier_mul ))  # H100s\ngpu_hours    = (minutes / 60) × cluster_size\ndollars      = gpu_hours × $2.16/hr × 1.5            # retail markup\n\n# tier_mul: Lite 0.5, Mid 1.0, SOTA 2.0\n# you rent the whole cluster for the session — fps doesn\'t enter the bill',
  fields: [
    { id: 'minutes',    type: 'slider', label: 'Session length', min: 1, max: 120, step: 1, default: 10, unit: 'min',
      hint: v => v < 5 ? 'demo' : v < 30 ? 'short session' : v < 90 ? 'gameplay session' : 'long session',
    },
    { id: 'fps', type: 'slider', label: 'Frame rate', min: 10, max: 60, step: 2, default: 24, unit: ' fps',
      hint: v => v < 20 ? 'laggy' : v < 28 ? 'playable' : v < 45 ? 'smooth' : 'crisp',
    },
    { id: 'resolution', type: 'select', label: 'Resolution', default: '360',
      options: [
        { value: '256', label: '256² · research demo' },
        { value: '360', label: '360p · playable' },
        { value: '720', label: '720p · pretty' },
      ],
    },
    { id: 'tier', type: 'select', label: 'Model tier', default: 'mid',
      options: [
        { value: 'lite', label: 'Lite (distilled)' },
        { value: 'mid',  label: 'Mid (research SOTA)' },
        { value: 'sota', label: 'SOTA (playable-film quality)' },
      ],
    },
  ],
  calc: (inputs) => {
    const minutes = Number(inputs.minutes)
    const fps     = Number(inputs.fps)
    const res     = Number(inputs.resolution)
    const tier    = String(inputs.tier)

    // World-model inference isn't per-frame work you can batch. You rent a
    // whole GPU cluster for the session duration. Cluster size scales with
    // resolution + tier — no Vertex list price exists, so these are teaching
    // estimates anchored to blended H100 retail rates.
    const pixelMul = (res / 360) ** 2            // 0.5 at 256, 1 at 360, 4 at 720
    const tierMul  = tier === 'lite' ? 0.5 : tier === 'mid' ? 1 : 2
    const rawCluster = pixelMul * tierMul
    const clusterSize = Math.max(1, Math.round(rawCluster))

    const gpuHours = (minutes / 60) * clusterSize
    const H100_HOURLY = GPU_SECOND * 3600        // $2.16/hr at our blended rate
    const dollars = gpuHours * H100_HOURLY * 1.5 // retail margin

    // Latency budget check — fps is what the cluster has to hit, not what
    // it pays for. If the tier × resolution exceeds what the chosen cluster
    // can sustain at fps, the session will drop frames on real hardware.
    const frames = minutes * 60 * fps
    const msPerFrameBudget = 1000 / fps
    const perFrameMsNeeded = (pixelMul * tierMul / clusterSize) * 80  // 80ms is a loose Genie-3 baseline
    const warn = perFrameMsNeeded > msPerFrameBudget
      ? `At this tier + resolution, the cluster needs ~${perFrameMsNeeded.toFixed(0)}ms per frame but the ${fps}fps budget is only ${msPerFrameBudget.toFixed(0)}ms — you'd need a larger cluster to stay interactive.`
      : undefined

    return {
      headline: fmt(dollars),
      sub: `per ${minutes}-min session`,
      dollars,
      unitLabel: `per ${minutes}-min session`,
      breakdown: [
        { label: 'Cluster size',             value: `${clusterSize}× H100` },
        { label: 'Session length',           value: `${minutes} min · ${frames.toLocaleString()} frames` },
        { label: 'GPU-hours',                value: gpuHours.toFixed(3) },
        { label: 'Blended H100 retail rate', value: `$${(H100_HOURLY * 1.5).toFixed(2)}/GPU-hr` },
      ],
      warn,
    }
  },
  scenarios: [
    { icon: '🕹️', title: '2-min demo playthrough', blurb: 'Genie 3 · 360p · 1× H100',    cost: '~$0.11',  footnote: 'research / solo session',
      inputs: { minutes: 2, fps: 24, resolution: '360', tier: 'lite' },
    },
    {
      icon: '🎮', title: '1hr gameplay session', blurb: '720p · varies by model tier',
      cost: '$6.50 → $26', footnote: 'tier drives cluster size — Lite 2×, Mid 4×, SOTA 8× H100 at 720p',
      inputs: { minutes: 60, fps: 24, resolution: '720' },
      tiers: [
        { label: 'Lite (distilled)',    cost: '~$6.50', inputs: { tier: 'lite' } },
        { label: 'Mid (research SOTA)', cost: '~$13',   inputs: { tier: 'mid'  } },
        { label: 'SOTA (film-quality)', cost: '~$26',   inputs: { tier: 'sota' } },
      ],
    },
    { icon: '🧪', title: '10k evaluation rollouts', blurb: 'Genie 3 Lite · 30s each · 360p',  cost: '~$270',   footnote: '10k × 30s on 1× H100 Lite ≈ 83 GPU-hrs × $3.24/hr retail' },
    { icon: '🌍', title: '1M users × 20min',        blurb: 'Genie 3-scale · multi-GPU/session',   cost: '~$4M',    footnote: 'why this isn\'t yet free-to-play — the unit economics still assume a rented cluster per player' },
  ],
  deepDive: [
    {
      title: 'Why real-time is the hard part',
      body: 'Regular video models amortize compute across a whole clip — they generate many frames in parallel. World models can\'t: the next frame depends on the user input that just happened. You lose batching, lose pipelining, and pay for every frame serially. That\'s why the unit of cost is "cluster-hours," not "generations."',
    },
    {
      title: 'Memory bandwidth > raw TFLOPs',
      body: 'A world model must keep a latent state for every object and location you\'ve visited this session, plus autoregressively predict the next frame under a sub-100ms budget. That\'s a memory-bandwidth problem, not a compute problem. H100 SXM cards (3.35 TB/s HBM3) are the current workhorse; Blackwell B200 (HBM3e, higher bandwidth) eases the ceiling but is still capacity-constrained on the supply side. This is why world-model access is gated to research subscribers rather than sold by the second.',
    },
    {
      title: 'Latent action models',
      body: 'Genie 3\'s innovation is learning physics and interaction rules directly from video, not from hard-coded engines. Arrow keys translating to "move forward" now generalizes across most generated environments — a big leap from 2024, where controls had to be re-learned for every new seed scene.',
    },
    {
      title: 'The drift ceiling',
      body: 'After ~120 seconds of continuous exploration, current world models drift: textures jitter, collision rules fail, previously visited rooms warp. This is the reason no one has yet replaced a game engine with a world model for anything more than short demos.',
    },
  ],
}

export const MODALITIES: Modality[] = [images, video, music, voice, world]

// Given the default inputs for each modality, compute dollars — used by
// the cross-modality "same $1" finale.
export function defaultCost(m: Modality): CostResult {
  const inputs: Inputs = {}
  for (const f of m.fields) inputs[f.id] = f.default
  return m.calc(inputs)
}
