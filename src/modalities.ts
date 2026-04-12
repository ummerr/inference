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

export interface Scenario {
  icon: string
  title: string
  blurb: string
  cost: string
  footnote: string
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
    'On Google Vertex AI, the Imagen 4 family prices this three ways: Fast ($0.02/image), Standard ($0.04), and Ultra ($0.06). Same mechanic, more or less compute per call.',
  ],
  whyExpensive: 'More steps = better image, linearly more compute. Guidance (CFG) runs the model twice per step. Resolution scales the per-step work by pixels². Vertex hides the knobs behind a tier name — you pick Fast / Standard / Ultra, it picks the steps for you.',
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
        { value: 'small',  label: 'Imagen 4 Fast ($0.02/img)' },
        { value: 'medium', label: 'Imagen 4 Standard ($0.04/img)' },
        { value: 'large',  label: 'Imagen 4 Ultra ($0.06/img)' },
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
    const sizeMul  = size === 'small' ? 0.5 : size === 'medium' ? 1 : 1.5
    const passes   = guided ? 2 : 1

    // Calibrated so the default knobs (Standard tier, 25 steps, guided, 1024²)
    // land on the real Vertex Imagen 4 Standard price of $0.04/image. Fast tier
    // defaults likewise hit $0.02, Ultra hits $0.06.
    const gpuSeconds = steps * passes * sizeMul * pixelMul * 0.05
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
    { icon: '🖼️', title: 'Product thumbnail',  blurb: 'Imagen 4 Fast, 1024²',         cost: '$0.02',   footnote: 'Vertex list price per image' },
    { icon: '🎨', title: 'Hero banner',        blurb: 'Imagen 4 Standard, 1024²',     cost: '$0.04',   footnote: 'Vertex list price per image' },
    { icon: '🖨️', title: 'Photography / print',blurb: 'Imagen 4 Ultra, 1024²',        cost: '$0.06',   footnote: 'Vertex list price per image' },
    { icon: '📦', title: 'Catalogue of 10k',   blurb: 'Imagen 4 Fast, batched',       cost: '~$200',   footnote: '10k × $0.02; committed-use discounts apply' },
  ],
  deepDive: [
    {
      title: 'U-Net → DiT → 2026 reality',
      body: 'Early diffusion models (SD 1.5, SDXL) used a U-Net: a convolutional hourglass on pixel-like space. Modern models (Flux 2, GPT Image 1.5, Imagen 4, Nano Banana Pro) use Diffusion Transformers — the attention-based architecture of LLMs applied to image patches. DiTs scale cleanly and hit photorealism, but Flux 2 in FP16 wants ~24GB of VRAM. Quantization (FP8/FP4) brings that down to 12GB/8GB at some quality cost.',
    },
    {
      title: 'Latent space, the secret weapon',
      body: 'Modern image models don\'t denoise pixels — they denoise a compressed latent (e.g. 128×128 for a 1024² image), then a VAE decoder upsamples at the end. Denoising in latent space is ~64× cheaper than pixel space. Without this, image diffusion would be unaffordable.',
    },
    {
      title: 'How Vertex serves Imagen 4 at $0.02/image',
      body: 'The Fast/Standard/Ultra split isn\'t a different model — it\'s the same Imagen 4 family served with different inference budgets. Fast uses a step-distilled variant (4–8 steps), graph-compiled kernels (XLA), and INT8/FP8 weights on TPU v5e pods. Standard runs the full 25-ish-step model. Ultra adds more steps plus a higher-res refiner pass. The external equivalent is the "juiced endpoint" stack — First Block Cache, torch_compile, FP8 quantization — that third-party providers layer onto Flux.1 Dev to hit single-digit-second latency on L20. Same techniques, different silicon.',
    },
    {
      title: 'Consumer GPUs are now competitive',
      body: 'The RTX 5090 has 1,792 GB/s of GDDR7 bandwidth — only 11% behind the H100 PCIe\'s 2,000 GB/s — but rents for ~$0.76/hr vs. ~$2.00 for an H100 PCIe. For standard 1024² diffusion, a 5090 does ~38 SDXL images/min vs. 42 on H100 PCIe. For everything that fits in 32GB VRAM, consumer GPUs now win on $/image. H100s only pull ahead when you need the 80GB for large batches or video.',
    },
    {
      title: 'Why guidance doubles your bill',
      body: 'Classifier-free guidance runs the model twice per step — once with your prompt, once without — and extrapolates. Dramatically improves prompt-following but literally doubles the FLOPs. Step-distilled variants (Imagen 4 Fast, Flux Schnell, LCM distillations) compile this away so one pass suffices — which is how Vertex can ship Imagen 4 Fast at half the price of Standard.',
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
  fields: [
    { id: 'seconds',    type: 'slider', label: 'Length',     min: 1, max: 60, step: 1,  default: 6, unit: 's',
      hint: v => v <= 8 ? 'social clip' : v <= 20 ? 'short ad' : v <= 40 ? 'scene' : 'short film',
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
    { icon: '📱', title: '6s social clip',    blurb: 'Veo 3.1 Fast, 720p',         cost: '~$0.90',   footnote: 'Vertex $0.15/sec w/ audio' },
    { icon: '🎞️', title: '6s silent B-roll',  blurb: 'Veo 3.1 Lite, 720p',         cost: '~$0.30',   footnote: 'Vertex $0.05/sec, no audio' },
    { icon: '📺', title: '30s ad spot',       blurb: 'Veo 3.1 Standard, 1080p',    cost: '~$12',     footnote: 'Vertex $0.40/sec · stitched from ≤8s clips' },
    { icon: '🎬', title: '1hr generated film',blurb: 'Veo 3.1 Standard, 1080p',    cost: '~$1,440',  footnote: 'linear at $0.40/sec — before retries & edits' },
  ],
  deepDive: [
    {
      title: 'The Sora postmortem (March 2026)',
      body: 'OpenAI shut Sora down on March 24, 2026 — not because the model was bad, but because the unit economics were catastrophic. At peak, Sora burned ~$15M/day in inference against ~$2.1M in lifetime in-app revenue. A single 10-second clip used ~40 GPU-minutes (10 min of wall time across 4× H100), so the marginal cost was ~$1.30 per clip. A $20/mo subscriber who generated 15 clips already cost more than they paid. The industry learned: you cannot flat-rate high-fidelity video. Kling, Runway Gen-4, and Veo 3.1 all now price per-second because that is the only way the math works.',
    },
    {
      title: 'Why video is much more expensive than an image',
      body: 'A 6s/24fps clip is 144 frames. Even with sparse attention, each frame has to do per-frame diffusion (roughly a 1024² image\'s worth of FLOPs) plus enough cross-frame work to stay consistent. That\'s why Veo 3.1 Standard at $0.40/sec comes out to roughly $0.017 per frame — ~40× what an Imagen 4 Standard image costs when amortized. Even the Lite tier at $0.05/sec is still ~2× per frame what a Fast image costs.',
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
      body: 'Serving infra — whether it\'s Vertex fronting Veo on TPU v5p pods or Fal.ai / Replicate / BFL fronting Flux on H100s — layers the same ideas: First Block Cache (FBCache), graph compilation (XLA or torch_compile), and FP8/INT8 quantization on top of the base model. This can drop wall time by ~3.5× vs. a cold reference implementation. The reason Vertex list prices beat what a naive reproduction would cost on rented GPUs is almost entirely sustained-utilization plus this compilation stack.',
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
    'Audio models come in two flavors: speech (TTS, voice cloning) and music. On Google Vertex AI, that\'s Chirp 3 HD for speech and Lyria 2 for music.',
    'Both typically generate audio tokens autoregressively — one small chunk at a time — then a vocoder turns tokens into waveform. Per second, audio is far cheaper than video. Per *hour* of output, it adds up.',
  ],
  whyExpensive: 'Cost scales linearly with output duration. On Vertex, Lyria 2 music (~$0.002/sec) runs ~4× Chirp 3 HD speech (~$0.0005/sec) because music encodes richer tokens — multiple instruments, wider frequency range.',
  fields: [
    { id: 'kind', type: 'select', label: 'Kind', default: 'speech',
      options: [
        { value: 'speech', label: 'Speech / TTS' },
        { value: 'music',  label: 'Music generation' },
      ],
    },
    { id: 'seconds', type: 'slider', label: 'Duration', min: 5, max: 600, step: 5, default: 60, unit: 's',
      hint: v => v < 30 ? 'one-liner' : v < 120 ? 'short VO' : v < 300 ? 'podcast segment' : 'full episode',
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

    // Per-second base tuned against Vertex list pricing: Chirp 3 HD speech at
    // $0.030 / 1K characters ≈ $0.0005/sec (at ~15 chars/sec), and Lyria 2
    // music at $0.06 / 30 sec = $0.002/sec. Music costs ~4× speech because it
    // encodes richer signal (instruments, wider frequency range).
    const gpuSeconds = seconds * 0.6 * kindMul * qualityMul
    const dollars = gpuSeconds * GPU_SECOND * 1.4 + cloneAdd

    return {
      headline: fmt(dollars),
      sub: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s of speech`,
      dollars,
      unitLabel: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s`,
      breakdown: [
        { label: 'Kind', value: kind === 'music' ? `Lyria 2 music (${kindMul}×)` : 'Chirp 3 HD speech (1×)' },
        { label: 'Quality multiplier', value: `${qualityMul}×` },
        { label: 'GPU-seconds', value: gpuSeconds.toFixed(3) },
        ...(cloneAdd > 0 ? [{ label: 'Voice-clone overhead', value: fmt(cloneAdd) }] : []),
      ],
    }
  },
  scenarios: [
    { icon: '📢', title: '30s ad voiceover',    blurb: 'Chirp 3 HD · Vertex',       cost: '~$0.015', footnote: '$0.030 / 1K chars ≈ $0.0005/sec' },
    { icon: '🎙️', title: '1hr podcast TTS',     blurb: 'Chirp 3 HD · Vertex',       cost: '~$1.80',  footnote: '3600s × ~$0.0005/sec' },
    { icon: '🎵', title: '3min Lyria 2 track',  blurb: 'Lyria 2 · Vertex',          cost: '~$0.36',  footnote: '180s × $0.06 / 30s = $0.002/sec' },
    { icon: '📚', title: '10hr audiobook',      blurb: 'Chirp 3 HD · cloned voice', cost: '~$18',    footnote: 'vs $1k+ for a human narrator' },
  ],
  deepDive: [
    {
      title: 'Autoregressive tokens + vocoders',
      body: 'Most audio models (Chirp 3 HD, Lyria 2, Bark, VALL-E, MusicGen) generate discrete audio tokens one at a time via a transformer, then a neural vocoder (HiFi-GAN, SoundStream) converts tokens to waveform. The transformer dominates cost; the vocoder is comparatively cheap.',
    },
    {
      title: 'Why music costs more than speech',
      body: 'Music encodes multiple simultaneous instruments across a wider frequency range, usually at higher sample rates (44.1/48 kHz vs 16–24 kHz for speech). More tokens per second and bigger models. On Vertex, Lyria 2 is $0.06 per 30 seconds (~$0.002/sec) versus Chirp 3 HD at $0.030 / 1K characters (~$0.0005/sec at a normal speaking rate) — roughly 4× the per-second cost. Consumer music products like Suno and Udio ship at flat $10–$30/mo subscriptions that subsidize this cost.',
    },
    {
      title: 'Licensing is now the business model',
      body: 'In 2026, technical quality between Lyria 2, Suno, Udio, and ElevenLabs Music has converged. The differentiator is training-data licensing. Google\'s Lyria lineage was trained in partnership with YouTube / music labels and ships with Vertex\'s standard generative-AI indemnification. Suno and Udio are cheaper but carry ongoing legal risk from copyright settlements. For anything that has to clear Content ID at scale, the enterprise answer is usually "run it on Vertex so the provenance and indemnity are somebody else\'s problem".',
    },
    {
      title: 'Streaming changes the math',
      body: 'Real-time TTS streams audio as it generates — the model never has to "see the whole future". This keeps latency low but doesn\'t change total cost. If you need sub-200ms latency (voice agents, phone, live-translate), Chirp 3 HD streaming and the dedicated `journey` voices are tuned for it; higher-fidelity studio voices sacrifice latency for quality.',
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
    { icon: '🕹️', title: '2-min demo playthrough', blurb: 'Genie 3 · 360p · 1× H100',    cost: '~$0.11',  footnote: 'research / solo session' },
    { icon: '🎮', title: '1hr gameplay session',    blurb: 'Genie 3 · 720p · 4× H100',    cost: '~$13',    footnote: '4 GPU-hrs × ~$3.24 retail' },
    { icon: '🧪', title: '10k evaluation rollouts', blurb: 'Genie 3 Lite · RL sweep',     cost: '~$135',   footnote: '~50 GPU-hrs at lite tier' },
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
