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
    'Classic temporal attention made every frame look at every other frame — O(n²) and brutal. In 2026, sparse-attention methods (VideoNSA, DSA) cut the attention budget to ~3.6% while preserving quality, which is why Kling and Runway Gen-4 generate a 10-second clip in under 90 seconds while Sora needed 3–8 minutes.',
    'Sora shut down on March 24, 2026 — ~$15M/day in inference against $2.1M lifetime revenue. The market has since moved to per-second billing that tracks compute honestly.',
  ],
  whyExpensive: 'Cost ≈ (per-frame work) × frames. The old O(n²) temporal attention has been flattened to near-linear by sparse attention, but each frame still does image-worthy compute at higher resolutions. Every extra second or pixel is still real money.',
  formula: 'frames      = seconds × fps\nper_frame   = 2.5 × (res / 720)² × tier_mul     # linear\ntemporal    = frames² / 8000 × tier_mul × pixel_mul  # quadratic residue\ngpu_seconds = frames × per_frame + temporal\ndollars     = gpu_seconds × $0.0006/s × 11       # retail markup\n\n# tier_mul: Lite 0.125, Fast 0.25, Standard 1.0',
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
        { value: 'fast', label: 'Veo 3.1 Fast ($0.10/s, w/ audio)' },
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
    const tierMul  = tier === 'lite' ? 0.125 : tier === 'fast' ? 0.25 : 1

    // Per-frame cost, tuned so a 6s/24fps/720p Standard clip lands on Vertex
    // Veo 3.1 Standard pricing (6s × $0.40/s = $2.40). Lite and Fast tiers
    // likewise hit $0.05/s and $0.10/s at their defaults.
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
        { label: 'Fast',     cost: '$0.60', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$2.40', inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '📺', title: '30s ad spot', blurb: 'Stitched from ≤8s clips',
      cost: '$2.40 → $12', footnote: '30 × per-second rate; retries and edits add 1.5–3× in practice',
      inputs: { seconds: 30, fps: 24, resolution: '1080' },
      tiers: [
        { label: 'Lite',     cost: '$2.40', inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$3.60', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$12',   inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '🎬', title: '2min short scene', blurb: '~15 clips stitched',
      cost: '$9.60 → $48', footnote: 'before the VFX/color pass that a real short needs',
      inputs: { seconds: 120, fps: 24, resolution: '1080' },
      tiers: [
        { label: 'Lite',     cost: '$9.60',  inputs: { tier: 'lite' } },
        { label: 'Fast',     cost: '$14.40', inputs: { tier: 'fast' } },
        { label: 'Standard', cost: '$48',    inputs: { tier: 'good' } },
      ],
    },
    {
      icon: '🎞️', title: '1hr generated film', blurb: 'Linear extrapolation',
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
      title: 'The Sora postmortem (March 2026)',
      body: 'OpenAI shut Sora down on March 24, 2026 — not because the model was bad, but because the unit economics were catastrophic. At peak, Sora burned ~$15M/day in inference against ~$2.1M in lifetime in-app revenue. A single 10-second clip used ~40 GPU-minutes (10 min of wall time across 4× H100), so the marginal cost was ~$1.30 per clip. A $20/mo subscriber who generated 15 clips already cost more than they paid. The industry learned: you cannot flat-rate high-fidelity video. Kling, Runway Gen-4, and Veo 3.1 all now price per-second because that is the only way the math works.',
    },
    {
      title: 'Why a video clip costs 40× an image',
      body: 'A 6s/24fps clip is 144 frames. Each frame does roughly a 1024² image\'s worth of diffusion FLOPs plus enough cross-frame attention to stay consistent. Veo 3.1 Standard at $0.40/sec means a single 6s clip is $2.40 — about 36× a Nano Banana image ($0.067) or 60× a Nano Banana Flash ($0.039). The per-frame number is actually low (~$0.017 at Standard, ~$0.0021 at Lite) because Veo amortizes compute across the whole clip. The cost comes from volume: you are not paying for one generation, you are paying for 144 of them at once.',
    },
    {
      title: 'Sparse attention broke the O(n²) curse',
      body: 'Until late 2025, temporal attention scaled quadratically with the number of frames. Native Sparse Attention (NSA) and DeepSeek Sparse Attention (DSA) changed that in 2026: by using only ~3.6% of the attention budget on tokens that actually matter for frame coherence, they get up to ~10× faster inference on long contexts. Veo 3.1, Kling 3.0, and Runway Gen-4 all ship variants of this — which is why their 10s clips render in under 90 seconds while Sora was stuck at 3–8 minutes.',
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
// Audio
// ---------------------------------------------------------------------------
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
  tagline: 'Cheap per second — but audio is often *long*.',
  primer: [
    'Audio models come in two flavors: speech (TTS, voice cloning) and music. On the Gemini API that\'s Gemini TTS (Flash & Pro) plus Gemini 3.1 Flash Live for real-time audio-to-audio, and Lyria 3 (Clip / Pro) for music.',
    'Both typically generate audio tokens autoregressively — one small chunk at a time — then a vocoder turns tokens into waveform. Per second, audio is far cheaper than video. Per *hour* of output, it adds up.',
  ],
  whyExpensive: 'Cost scales linearly with output duration. Lyria 3 music (~$0.00133/sec via the $0.04/30s clip tier) runs ~4× Gemini Flash Live speech (~$0.0003/sec at $0.018/min audio output) because music encodes richer tokens — multiple instruments, wider frequency range.',
  formula: 'gpu_seconds = seconds × 0.36 × kind_mul × quality_mul\ndollars     = gpu_seconds × $0.0006/s × 1.4 + clone_overhead\n\n# kind_mul:    speech 1.0, music 4.0\n# quality_mul: fast 0.5, standard 1.0, hifi 1.5\n# clone:       +$0.0005/request for speech + voice cloning',
  fields: [
    { id: 'kind', type: 'select', label: 'Kind', default: 'speech',
      options: [
        { value: 'speech', label: 'Speech / TTS' },
        { value: 'music',  label: 'Music generation' },
      ],
    },
    { id: 'seconds', type: 'slider', label: 'Duration', min: 5, max: 3600, step: 5, default: 60, unit: 's',
      hint: v => v < 30 ? 'one-liner' : v < 120 ? 'short VO' : v < 600 ? 'podcast segment' : v < 1800 ? 'full episode' : 'feature length',
    },
    { id: 'quality', type: 'select', label: 'Quality', default: 'standard',
      options: [
        { value: 'fast',     label: 'Fast / low-latency' },
        { value: 'standard', label: 'Standard' },
        { value: 'hifi',     label: 'Studio / 48kHz' },
      ],
    },
    { id: 'cloning', type: 'toggle', label: 'Voice cloning',
      default: false, onLabel: 'cloned voice', offLabel: 'preset voice',
      hint: 'Speech only: cloning usually adds a small per-request overhead.',
    },
  ],
  calc: (inputs) => {
    const kind     = String(inputs.kind)
    const seconds  = Number(inputs.seconds)
    const quality  = String(inputs.quality)
    const cloning  = Boolean(inputs.cloning)

    const kindMul    = kind === 'music' ? 4 : 1
    const qualityMul = quality === 'fast' ? 0.5 : quality === 'standard' ? 1 : 1.5
    const cloneAdd   = kind === 'speech' && cloning ? 0.0005 : 0

    // Per-second base tuned against Gemini API list pricing: Gemini 3.1 Flash
    // Live audio output at $0.018/min ≈ $0.0003/sec, and Lyria 3 Clip music at
    // $0.04 / 30 sec ≈ $0.00133/sec. Music costs ~4× speech because it encodes
    // richer signal (instruments, wider frequency range).
    const gpuSeconds = seconds * 0.36 * kindMul * qualityMul
    const dollars = gpuSeconds * GPU_SECOND * 1.4 + cloneAdd

    return {
      headline: fmt(dollars),
      sub: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s of speech`,
      dollars,
      unitLabel: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s`,
      breakdown: [
        { label: 'Kind', value: kind === 'music' ? `Lyria 3 music (${kindMul}×)` : 'Gemini TTS speech (1×)' },
        { label: 'Quality multiplier', value: `${qualityMul}×` },
        { label: 'GPU-seconds', value: gpuSeconds.toFixed(3) },
        ...(cloneAdd > 0 ? [{ label: 'Voice-clone overhead', value: fmt(cloneAdd) }] : []),
      ],
    }
  },
  scenarios: [
    {
      icon: '📢', title: '30s voiceover', blurb: 'Gemini TTS vs Lyria 3 jingle',
      cost: '$0.009 → $0.04', footnote: 'same duration, music ~4× speech',
      inputs: { seconds: 30, quality: 'standard', cloning: false },
      tiers: [
        { label: 'Gemini TTS (speech)', cost: '$0.009', inputs: { kind: 'speech' } },
        { label: 'Lyria 3 Clip (music)', cost: '$0.04', inputs: { kind: 'music'  } },
      ],
    },
    {
      icon: '🎙️', title: '1hr podcast episode', blurb: 'Speech TTS vs music bed',
      cost: '$1.08 → $4.80', footnote: '3600s × per-second rate',
      inputs: { seconds: 3600, quality: 'standard', cloning: false },
      tiers: [
        { label: 'Gemini TTS (speech)', cost: '$1.08', inputs: { kind: 'speech' } },
        { label: 'Lyria 3 (music)',     cost: '$4.80', inputs: { kind: 'music'  } },
      ],
    },
    {
      icon: '🎵', title: '3min music track', blurb: 'Lyria 3 Pro generated song',
      cost: '~$0.08', footnote: 'Lyria 3 Pro ships a full song at a flat $0.08 — length doesn\'t enter the bill',
      inputs: { kind: 'music', seconds: 180, quality: 'standard', cloning: false },
    },
    {
      icon: '📚', title: '10hr audiobook', blurb: 'Gemini TTS · cloned voice',
      cost: '~$11', footnote: '36,000s × ~$0.0003/sec — vs $1k+ for a human narrator',
      inputs: { kind: 'speech', seconds: 600, quality: 'standard', cloning: true },
    },
  ],
  deepDive: [
    {
      title: 'Autoregressive tokens + vocoders',
      body: 'Google\'s audio models (Gemini TTS, Gemini Flash Live, Lyria 3, plus research systems like SoundStorm and MusicLM) generate discrete audio tokens one at a time via a transformer, then a neural vocoder (SoundStream, HiFi-GAN) converts tokens to waveform. The transformer dominates cost; the vocoder is comparatively cheap. Open peers — Bark, VALL-E, MusicGen — use the same recipe.',
    },
    {
      title: 'Why music costs more than speech',
      body: 'Music encodes multiple simultaneous instruments across a wider frequency range, usually at higher sample rates (44.1/48 kHz vs 16–24 kHz for speech). More tokens per second and bigger models. The Gemini API prices Lyria 3 Clip at $0.04 per 30 seconds (~$0.00133/sec) and a full Lyria 3 Pro song flat at $0.08, versus Gemini 3.1 Flash Live speech output at $0.018/min (~$0.0003/sec) — roughly 4× the per-second cost for music. Consumer music products like Suno and Udio ship at flat $10–$30/mo subscriptions that subsidize this cost.',
    },
    {
      title: 'Licensing is now the business model',
      body: 'In 2026, technical quality between Lyria 3, Suno, Udio, and ElevenLabs Music has largely converged. The differentiator is training-data licensing. Google\'s Lyria lineage was trained in partnership with YouTube / music labels and ships with Vertex\'s standard generative-AI indemnification. Suno and Udio are cheaper but carry ongoing legal risk from copyright settlements. For anything that has to clear Content ID at scale, the enterprise answer is usually "run it on the Gemini API so the provenance and indemnity are somebody else\'s problem".',
    },
    {
      title: 'Streaming and Live change the math',
      body: 'Real-time TTS streams audio as it generates — the model never has to "see the whole future". This keeps latency low but doesn\'t change total cost. Gemini 3.1 Flash Live takes this further: a bidirectional audio-to-audio endpoint billed per minute of audio in/out ($0.005/min input, $0.018/min output) for voice agents, phones, and live-translate. Studio-grade Gemini TTS Pro ($20/1M output tokens) sacrifices latency for higher fidelity and is the right fit for audiobooks and narration where batch quality beats ms-level responsiveness.',
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
    'Google DeepMind\'s Genie 3 is an ~11B-parameter autoregressive transformer that generates real-time navigable worlds at 720p/24fps. DeepMind hasn\'t published the exact inference cluster size; community estimates put it at roughly 4× H100 per concurrent session. Oasis (the Minecraft world model) is reported at ~5 concurrent users on 8× H100s at 360p/20fps. These aren\'t "per-image" economics — you rent a whole cluster for as long as someone is playing.',
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
    // whole GPU cluster for the session duration. Cluster size is a function
    // of resolution + tier (Genie 3 at 720p/mid uses 4× H100; Oasis at 360p
    // serves ~5 users on 8× H100 ≈ 1.6/user).
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
    { icon: '🌍', title: '1M users × 20min',        blurb: 'Genie 3 · 4× H100/session',   cost: '~$4M',    footnote: 'why this isn\'t yet free-to-play' },
  ],
  deepDive: [
    {
      title: 'Why real-time is the hard part',
      body: 'Regular video models amortize compute across a whole clip — they generate many frames in parallel. World models can\'t: the next frame depends on the user input that just happened. You lose batching, lose pipelining, and pay for every frame serially. That\'s why the unit of cost is "cluster-hours," not "generations."',
    },
    {
      title: 'Memory bandwidth > raw TFLOPs',
      body: 'A world model must keep a latent state for every object and location you\'ve visited this session, plus autoregressively predict the next frame under a sub-100ms budget. That\'s a memory-bandwidth problem, not a compute problem. On an H100 SXM (3.35 TB/s HBM3), community estimates put ~4 GPUs as the minimum to hit 720p/24fps on a Genie-3-sized model. Blackwell B200 (HBM3e, ~$5.49–$6.69/hr retail) eases this substantially but is still capacity-constrained.',
    },
    {
      title: 'Latent action models',
      body: 'Genie 3\'s innovation is learning physics and interaction rules directly from video, not from hard-coded engines. Arrow keys translating to "move forward" is now ~70–80% consistent across generated environments — a big leap from 2024, where controls had to be re-learned for every new seed scene.',
    },
    {
      title: 'The drift ceiling',
      body: 'After ~120 seconds of continuous exploration, current world models drift: textures jitter, collision rules fail, previously visited rooms warp. This is the reason no one has yet replaced a game engine with a world model for anything more than short demos.',
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
