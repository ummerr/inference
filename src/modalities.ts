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

// A single "GPU-second" unit cost for a modern accelerator (~H100 class, cloud-rented).
// Real rates: ~$2–4 / GPU-hour ⇒ ~$0.0006–$0.001 / GPU-second. We use $0.0008.
const GPU_SECOND = 0.0008

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
    'So cost scales with two things: how many steps you take, and how big the image (and model) is on each step.',
  ],
  whyExpensive: 'More steps = better image, linearly more compute. Guidance (CFG) runs the model twice per step. Resolution scales the per-step work by pixels².',
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
      id: 'modelSize', type: 'select', label: 'Model size', default: 'medium',
      options: [
        { value: 'small',  label: 'Small (SDXL-Turbo-ish, ~1B)' },
        { value: 'medium', label: 'Medium (SDXL / Flux-schnell, ~3–4B)' },
        { value: 'large',  label: 'Large (Flux-dev, DiT, ~12B+)' },
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
    const sizeMul  = size === 'small' ? 0.3 : size === 'medium' ? 1 : 3.5
    const passes   = guided ? 2 : 1

    // A "medium model at 1024, 1 step, 1 pass" ≈ 0.05 GPU-seconds.
    const gpuSeconds = steps * passes * sizeMul * pixelMul * 0.05
    const dollars = gpuSeconds * GPU_SECOND * 1.4 // 40% provider margin

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
    { icon: '🖼️', title: 'Product thumbnail',  blurb: 'SDXL, 20 steps, 512²',        cost: '~$0.001', footnote: 'basically free at batch' },
    { icon: '🎨', title: 'Hero banner',        blurb: 'Flux-dev, 30 steps, 1024²',    cost: '~$0.02',   footnote: 'a cent or two each' },
    { icon: '🖨️', title: 'Print poster',       blurb: 'Flux-dev, 40 steps, 2048²',    cost: '~$0.15',   footnote: '4× pixels = 4× cost' },
    { icon: '📦', title: 'Catalogue of 10k',   blurb: 'SDXL, 25 steps, 1024²',        cost: '~$50',     footnote: 'batching brings this way down' },
  ],
  deepDive: [
    {
      title: 'U-Net vs DiT',
      body: 'Early diffusion models (SD 1.5, SDXL) used a U-Net: a convolutional hourglass that works in pixel-like space. Newer models (SD3, Flux, Sora internals) use Diffusion Transformers — the same attention-based architecture as LLMs, applied to image patches. DiTs scale more predictably with compute but cost more per step.',
    },
    {
      title: 'Latent space, the secret weapon',
      body: 'Modern image models don\'t actually denoise pixels — they denoise a compressed "latent" representation (e.g. 128×128 for a 1024² image), then a VAE decoder upsamples at the end. Denoising in latent space is ~64× cheaper than pixel space. Without this trick, image diffusion would be unaffordable.',
    },
    {
      title: 'Why guidance doubles your bill',
      body: 'Classifier-free guidance runs the model twice per step — once with your prompt, once without — and extrapolates. It dramatically improves prompt-following but literally doubles the FLOPs. Some new models (Flux-schnell, LCM) distill this away so one pass suffices.',
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
    'That consistency isn\'t free. Models use temporal attention: every frame looks at every other frame. That\'s where the cost blows up.',
  ],
  whyExpensive: 'Cost = (per-frame image cost) × frames + temporal attention, which grows with frames² (O(n²)). A 6-second clip isn\'t 6× an image — it\'s more like 100–1000×.',
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
    { id: 'tier', type: 'select', label: 'Model tier', default: 'good',
      options: [
        { value: 'fast', label: 'Fast (LTX, AnimateDiff)' },
        { value: 'good', label: 'Good (Kling, Runway Gen-3)' },
        { value: 'sota', label: 'SOTA (Veo 3, Sora)' },
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
    const tierMul  = tier === 'fast' ? 0.4 : tier === 'good' ? 1 : 3.5

    // Per-frame cost, tuned so a 6s/24fps/720p good-tier clip lands near Runway Gen-3
    // real public pricing (~$0.50). A single video frame at "good" tier is substantially
    // more expensive than one SDXL image because of 3D attention, longer contexts, and
    // higher-quality VAEs.
    const perFrameGpuS = 2.5 * pixelMul * tierMul
    // Temporal attention: quadratic in frames, but attention is only *part* of the net.
    const temporalGpuS = (frames * frames / 1000) * tierMul * pixelMul

    const gpuSeconds = frames * perFrameGpuS + temporalGpuS
    const dollars = gpuSeconds * GPU_SECOND * 1.5

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
    { icon: '📱', title: '6s TikTok clip',    blurb: 'Kling 3.0, 720p',           cost: '~$0.45',   footnote: '~$0.075/sec, the cheapest tier' },
    { icon: '📺', title: '30s ad spot',       blurb: 'Veo 3 Standard, 1080p',     cost: '~$12',     footnote: '$0.40/sec × 30s' },
    { icon: '🎬', title: '2min short scene',  blurb: 'Veo 3 Standard, 1080p',     cost: '~$50',     footnote: 'stitched from shorter clips' },
    { icon: '🎞️', title: '1hr generated film',blurb: 'Veo 3 Standard, 1080p',     cost: '~$1,500',  footnote: 'pure inference — before retries & editing' },
  ],
  deepDive: [
    {
      title: 'Why video is ~100–1000× an image',
      body: 'If a 1024² image takes N FLOPs, a 6-second 24fps 720² video takes roughly (144 frames × per-frame cost) + temporal-attention overhead. The per-frame part alone is ~70× an image. The attention part scales with frames squared — doubling video length more than doubles cost.',
    },
    {
      title: 'Spatiotemporal attention, chunking, and VAEs',
      body: 'Modern video models (Sora, Veo) use 3D transformers that attend across space *and* time, over a compressed spatiotemporal latent. Generating more than a few seconds at once exceeds VRAM, so models chunk + blend, sacrificing some consistency for cost. This is why long videos sometimes "drift".',
    },
    {
      title: 'The caching trick',
      body: 'A lot of production cost is saved by caching intermediate activations across steps (DeepCache, block caching). A 30-step video generation can run at ~15-step cost with negligible quality loss. If you\'re building on top of video APIs, most providers already do this for you.',
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
    'Audio models come in two flavors: speech (TTS, voice cloning) and music (Suno, Udio, MusicGen).',
    'Both typically generate audio tokens autoregressively — one small chunk at a time — then a vocoder turns tokens into waveform. Per second, audio is far cheaper than video. Per *hour* of output, it adds up.',
  ],
  whyExpensive: 'Cost scales linearly with output duration. Music models cost ~5–10× speech models because they generate richer tokens (multiple instruments, wider frequency range).',
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

    const kindMul    = kind === 'music' ? 5 : 1
    const qualityMul = quality === 'fast' ? 0.5 : quality === 'standard' ? 1 : 2
    const cloneAdd   = kind === 'speech' && cloning ? 0.0005 : 0

    // Per-second base cost tuned against real TTS pricing (ElevenLabs-ish:
    // ~$0.0002/sec standard speech, ~$0.001/sec studio).
    const gpuSeconds = seconds * 0.15 * kindMul * qualityMul
    const dollars = gpuSeconds * GPU_SECOND * 1.4 + cloneAdd

    return {
      headline: fmt(dollars),
      sub: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s of speech`,
      dollars,
      unitLabel: kind === 'music' ? `per ${seconds}s track` : `per ${seconds}s`,
      breakdown: [
        { label: 'Kind', value: kind === 'music' ? `music (${kindMul}×)` : 'speech (1×)' },
        { label: 'Quality multiplier', value: `${qualityMul}×` },
        { label: 'GPU-seconds', value: gpuSeconds.toFixed(3) },
        ...(cloneAdd > 0 ? [{ label: 'Voice-clone overhead', value: fmt(cloneAdd) }] : []),
      ],
    }
  },
  scenarios: [
    { icon: '📢', title: '30s ad voiceover',   blurb: 'ElevenLabs-ish, standard',  cost: '~$0.005', footnote: 'basically free' },
    { icon: '🎙️', title: '1hr podcast TTS',    blurb: 'Standard TTS',              cost: '~$0.60',   footnote: 'audiobooks are feasible' },
    { icon: '🎵', title: '3min generated song',blurb: 'Suno/Udio-ish',             cost: '~$0.15',   footnote: 'per retry, and you\'ll retry a lot' },
    { icon: '📚', title: '10hr audiobook',     blurb: 'HQ TTS with cloned voice',  cost: '~$12',     footnote: 'vs $1k+ for a human narrator' },
  ],
  deepDive: [
    {
      title: 'Autoregressive tokens + vocoders',
      body: 'Most audio models (Bark, VALL-E, MusicGen) generate discrete audio tokens one at a time via a transformer, then a neural vocoder (HiFi-GAN, EnCodec) converts tokens to waveform. The transformer dominates cost; the vocoder is comparatively cheap.',
    },
    {
      title: 'Why music costs more than speech',
      body: 'Music needs to encode multiple simultaneous instruments across a wider frequency range, usually at higher sample rates (44.1/48 kHz vs 16–24 kHz for speech). More tokens per second, bigger models, and typically more attempts per usable output.',
    },
    {
      title: 'Streaming changes the math',
      body: 'Real-time TTS streams audio as it generates — the model never has to "see the whole future". This keeps latency low but doesn\'t change total cost. If you need sub-200ms latency (phone agents), you\'re paying for smaller, faster models — usually at some quality cost.',
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
    'World models (Genie, Oasis, GameNGen) are video models with a twist: you give them an action each frame — an arrow key, a mouse move, a controller input — and they render the consequence.',
    'That means inference can\'t run in the background. It runs now, every frame, at the framerate of the experience. The hard constraint isn\'t cost — it\'s latency.',
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

    const frames   = minutes * 60 * fps
    const pixelMul = (res / 360) ** 2
    const tierMul  = tier === 'lite' ? 0.5 : tier === 'mid' ? 1.5 : 5
    // Interactivity penalty: unbatched, single-frame inference is ~2–3× the amortized cost
    // of batch video generation at the same quality.
    const interactivity = 2.5

    const perFrameGpuS = 0.02 * pixelMul * tierMul * interactivity
    const gpuSeconds = frames * perFrameGpuS
    const dollars = gpuSeconds * GPU_SECOND * 1.5

    // Latency budget check
    const msPerFrameBudget = 1000 / fps
    const msPerFrameActual = perFrameGpuS * 1000 // 1 GPU is the budget
    const warn = msPerFrameActual > msPerFrameBudget
      ? `At this tier + resolution, one frame takes ~${msPerFrameActual.toFixed(0)}ms but you only have ${msPerFrameBudget.toFixed(0)}ms per frame — the session would drop below target fps on a single GPU.`
      : undefined

    return {
      headline: fmt(dollars),
      sub: `per ${minutes}-min session`,
      dollars,
      unitLabel: `per ${minutes}-min session`,
      breakdown: [
        { label: 'Frames generated',         value: `${frames.toLocaleString()} (${minutes}min × 60 × ${fps}fps)` },
        { label: 'Per-frame GPU time',       value: `${(perFrameGpuS * 1000).toFixed(0)} ms` },
        { label: 'Latency budget per frame', value: `${msPerFrameBudget.toFixed(0)} ms` },
        { label: 'Interactivity penalty',    value: `${interactivity}× (no batching)` },
      ],
      warn,
    }
  },
  scenarios: [
    { icon: '🕹️', title: '2-min demo playthrough', blurb: 'Genie-ish, 360p',       cost: '~$0.30',  footnote: 'research quality' },
    { icon: '🎮', title: '1hr gameplay session',    blurb: 'SOTA, 720p, 30fps',      cost: '~$130',    footnote: 'pricier than a AAA game' },
    { icon: '🧪', title: '10k evaluation rollouts', blurb: '100-step research rollouts', cost: '~$80', footnote: 'cost of RL research' },
    { icon: '🌍', title: '1M users × 20min',        blurb: 'SOTA, scaled',           cost: '~$40M',   footnote: 'why this isn\'t live yet' },
  ],
  deepDive: [
    {
      title: 'Why real-time is the hard part',
      body: 'Regular video models amortize compute across a whole clip — they generate many frames in parallel. World models can\'t: the next frame depends on the user input that just happened. You lose batching, lose pipelining, and pay for every frame serially.',
    },
    {
      title: 'Action conditioning',
      body: 'The model takes the previous frame(s) plus an action embedding and predicts the next frame. Genie learns this unsupervised from gameplay video; Oasis was trained on Minecraft. The action space is the interesting design choice — keyboard, mouse, continuous controls all have very different token budgets.',
    },
    {
      title: 'The distillation race',
      body: 'Most world-model cost reduction right now comes from distilling diffusion-based teachers into smaller single-pass student models (consistency models, LCMs adapted for video). Expect 5–10× cost drops over the next couple of years — this is the gating factor for consumer use cases.',
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
