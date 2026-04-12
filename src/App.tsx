import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  Hammer, Brain, Cpu, Car, Sparkles, Zap, DollarSign,
  Image as ImageIcon, Compass, Scale, ChevronDown, Info,
  Type, Coins, BarChart3, MessageSquareQuote, Film,
} from 'lucide-react'
import { computeImageCost, type ModelSize, type Hardware, type Hosting } from './pricing'
import { SideNav, type NavItem } from './components/SideNav'
import { TokensWidget } from './components/TokensWidget'
import { IOPricingCard } from './components/IOPricingCard'
import { ScenariosGrid } from './components/ScenariosGrid'

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
        (active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
      }
    >
      {children}
    </button>
  )
}

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={'bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 p-5 sm:p-7 ' + className}>
      {children}
    </div>
  )
}

function useCountUp(value: number, ms = 400) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const from = prev.current
    const to = value
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return display
}

function SectionHeader({
  icon: Icon, eyebrow, title, subtitle, accent = 'bg-indigo-500',
}: {
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  subtitle?: string
  accent?: string
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/5 ring-1 ring-white/20 ' + accent}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em]">{eyebrow}</div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  )
}

function Explainer({
  icon: Icon, title, accent, children, deepDive,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  accent: string
  children: ReactNode
  deepDive?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 p-5 sm:p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
      <div className={'w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/5 ring-1 ring-white/20 ' + accent}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-display text-2xl text-slate-900 leading-tight">{title}</h3>
      <div className="text-slate-600 text-sm leading-relaxed space-y-2">{children}</div>
      {deepDive && (
        <div className="pt-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <ChevronDown className={'w-4 h-4 transition-transform ' + (open ? 'rotate-180' : '')} />
            {open ? 'Hide the real story' : 'The real story (for the curious)'}
          </button>
          {open && (
            <div className="mt-3 text-xs text-slate-600 leading-relaxed space-y-2 bg-slate-50 rounded-lg p-3 ring-1 ring-slate-200">
              {deepDive}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Bar({ label, units, max }: { label: string; units: number; max: number }) {
  const pct = (units / max) * 100
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <div className="sm:w-44 text-sm text-slate-700 font-medium shrink-0">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-end pr-3 text-xs font-semibold text-white transition-all duration-500"
          style={{ width: `${pct}%` }}
        >
          {units.toFixed(0)}
        </div>
      </div>
    </div>
  )
}

function StepDots({ n }: { n: number }) {
  const dots = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div className="flex items-center gap-1">
      {dots.map((i) => {
        const noise = Math.max(0, 1 - (i / 5) * (n / 6))
        return (
          <div
            key={i}
            className="w-7 h-7 rounded-md"
            style={{
              background: `linear-gradient(135deg, rgba(99,102,241,${1 - noise}), rgba(16,185,129,${1 - noise}))`,
              filter: `blur(${noise * 4}px) contrast(${1 + noise})`,
              opacity: 0.4 + (1 - noise) * 0.6,
            }}
          />
        )
      })}
    </div>
  )
}

function Ticker({
  units, dollarsPer1k, hosting,
}: { units: number; dollarsPer1k: number; hosting: Hosting }) {
  const animUnits = useCountUp(units)
  const animDollars = useCountUp(dollarsPer1k)
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-[0_20px_60px_-20px_rgba(49,46,129,0.5)] p-7 text-white flex flex-col justify-between min-h-[380px] bg-slate-950">
      <div
        className="absolute inset-0 -z-0 opacity-90"
        style={{
          background:
            'radial-gradient(600px 300px at 20% 0%, rgba(99,102,241,0.55), transparent 60%),' +
            'radial-gradient(500px 280px at 100% 100%, rgba(16,185,129,0.35), transparent 60%),' +
            'radial-gradient(400px 200px at 80% 10%, rgba(244,114,182,0.30), transparent 60%),' +
            'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        }}
      />
      <div className="relative flex items-center gap-2 text-indigo-200">
        <DollarSign className="w-5 h-5" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">Live Estimate</h3>
      </div>
      <div className="relative space-y-2">
        <div className="text-indigo-200/80 text-sm uppercase tracking-wider">Compute Units</div>
        <div className="font-display text-7xl sm:text-8xl tabular-nums leading-none bg-gradient-to-br from-white to-indigo-200 bg-clip-text text-transparent">
          {animUnits.toFixed(1)}
        </div>
        <div className="text-indigo-100 text-lg pt-1">
          ≈ <span className="font-semibold text-emerald-300 tabular-nums">${animDollars.toFixed(2)}</span>
          <span className="text-indigo-200/80"> per 1,000 images</span>
        </div>
      </div>
      <div className="relative text-xs text-indigo-200/90 border-t border-white/10 pt-3">
        {hosting === 'cloud'
          ? '⚠️ Cloud billing runs 24/7 — an idle GPU still burns ~$3/hour.'
          : '💡 API pricing is predictable — you pay per generation, nothing while idle.'}
      </div>
    </div>
  )
}

const NAV_ITEMS: NavItem[] = [
  { id: 'what',       label: 'What is inference?' },
  { id: 'image',      label: 'Image AI' },
  { id: 'text',       label: 'Text AI' },
  { id: 'video',      label: 'Video AI' },
  { id: 'calculator', label: 'Image calculator' },
  { id: 'io',         label: 'Input vs output' },
  { id: 'cfg',        label: 'Guidance (CFG)' },
  { id: 'scenarios',  label: 'Real scenarios' },
  { id: 'knobs',      label: 'All the knobs' },
]

export default function App() {
  const [steps, setSteps] = useState(10)
  const [guided, setGuided] = useState(true)
  const [modelSize, setModelSize] = useState<ModelSize>('small')
  const [hardware, setHardware] = useState<Hardware>('gpu')
  const [hosting, setHosting] = useState<Hosting>('api')

  const { units, dollarsPer1k } = computeImageCost({ steps, guided, modelSize, hardware, hosting })

  const baseline = { modelSize: 'small' as const, hardware: 'gpu' as const, hosting: 'api' as const }
  const comparisons = [
    { label: '10 steps · Unguided', units: computeImageCost({ steps: 10, guided: false, ...baseline }).units },
    { label: '12 steps · Unguided', units: computeImageCost({ steps: 12, guided: false, ...baseline }).units },
    { label: '10 steps · Guided',   units: computeImageCost({ steps: 10, guided: true,  ...baseline }).units },
    { label: '12 steps · Guided',   units: computeImageCost({ steps: 12, guided: true,  ...baseline }).units },
  ]
  const maxBar = Math.max(...comparisons.map((c) => c.units))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero (full width, above the nav grid) */}
        <header className="relative text-center space-y-5 mb-16 pt-8 pb-4 fade-up">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="blob absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-indigo-300/40" />
            <div className="blob absolute -top-10 right-1/4 w-[28rem] h-[28rem] rounded-full bg-emerald-200/40" style={{ animationDelay: '-6s' }} />
            <div className="blob absolute top-20 left-1/2 w-80 h-80 rounded-full bg-rose-200/30" style={{ animationDelay: '-12s' }} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-slate-200 text-indigo-700 text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4" />
            The Fun Inference Calculator
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] text-slate-900 px-2">
            What does AI <em className="bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 bg-clip-text text-transparent not-italic">actually</em> cost?
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every time you use an AI, a massive computer runs a lot of math. The knobs below are the
            same ones engineers turn to balance quality and cost. Play with them — and learn why the
            bill swings the way it does.
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-12">
          <SideNav items={NAV_ITEMS} />

          <main className="space-y-16 min-w-0">
            {/* 1 — What is inference? */}
            <section id="what" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={Sparkles}
                  eyebrow="Primer"
                  title="First — what is 'inference,' actually?"
                  accent="bg-gradient-to-br from-indigo-400 to-indigo-600"
                />
                <div className="space-y-3 text-slate-600 leading-relaxed">
                  <p>
                    <strong>Training</strong> is the months-long, millions-of-dollars process of
                    teaching a model. <strong>Inference</strong> is what happens every time <em>you</em>{' '}
                    use it — one image, one chat reply, one answer. Training is the textbook.
                    Inference is the exam, taken fresh every single time.
                  </p>
                  <p>
                    Every cost you'll see on this page traces back to one question:{' '}
                    <em>how many times, and how hard, does the model have to run?</em>
                  </p>
                </div>
              </Card>
            </section>

            {/* 2 — How image AI works */}
            <section id="image" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={ImageIcon}
                  eyebrow="Modality · Images"
                  title="How image AI actually works"
                  subtitle="De-noising, one chisel strike at a time."
                  accent="bg-gradient-to-br from-indigo-400 to-indigo-600"
                />
                <div className="space-y-3 text-slate-600 leading-relaxed">
                  <p>
                    Image generators (Stable Diffusion, DALL·E, Midjourney, Flux) work like
                    <strong> de-noising</strong>: the AI starts with pure static — TV snow — and, step
                    by step, subtracts the noise until a picture emerges. Each step is one pass
                    through a giant neural network.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-slate-500 font-medium">Noise</span>
                    <StepDots n={steps} />
                    <span className="text-xs text-slate-500 font-medium">Image</span>
                    <span className="text-xs text-slate-400 ml-2">({steps} steps — adjust in the calculator below)</span>
                  </div>
                  <p className="pt-2">
                    More steps = finer detail, more passes through the network, more compute. That's
                    the first knob you'll play with.
                  </p>
                </div>
              </Card>
            </section>

            {/* 3 — How text AI works */}
            <section id="text" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={Type}
                  eyebrow="Modality · Text"
                  title="How text AI actually works"
                  subtitle="Tokens: the atoms that language models see."
                  accent="bg-gradient-to-br from-violet-400 to-violet-600"
                />
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    Language models (Claude, ChatGPT, Gemini, Llama) don't see words or letters —
                    they see <strong>tokens</strong>. A token is a chunk of text, usually 3–4
                    characters in English, or about ¾ of a word. "Hello" is one token. "Antidisestablishmentarianism"
                    is about seven.
                  </p>
                  <p>
                    When you chat with an AI, it reads all your tokens at once (that's the "input"),
                    then generates its reply <strong>one token at a time</strong>, looping through the
                    full neural network for each one. A 500-word reply ≈ 650 trips through the model.
                  </p>
                </div>
                <div className="mt-6">
                  <TokensWidget />
                </div>
              </Card>
            </section>

            {/* 3b — How video AI works */}
            <section id="video" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={Film}
                  eyebrow="Modality · Video"
                  title="How video AI actually works"
                  subtitle="Images, but with the extra rule that nothing can pop, flicker, or slide."
                  accent="bg-gradient-to-br from-rose-400 to-rose-600"
                />
                <div className="space-y-3 text-slate-600 leading-relaxed">
                  <p>
                    Video generators (Sora, Veo, Runway, Kling) are built on the same de-noising idea
                    as image models — but instead of one picture, they denoise a whole <strong>stack
                    of frames at once</strong>. A 5-second clip at 24 fps is 120 images the model has
                    to cough up together.
                  </p>
                  <p>
                    The hard part isn't the frames themselves — it's <strong>temporal consistency</strong>.
                    If a character's shirt is blue in frame 1 and teal in frame 2, the video looks
                    broken. So the model uses a mechanism called <em>temporal attention</em>: every
                    frame peeks at every other frame while it's being denoised, keeping objects,
                    lighting, and motion coherent.
                  </p>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Frames</div>
                    <div className="font-display text-2xl sm:text-3xl text-slate-900 leading-tight">120+</div>
                    <div className="text-xs text-slate-500 mt-1">5 seconds × 24 fps</div>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4 ring-1 ring-rose-100">
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-[0.15em]">Per-frame work</div>
                    <div className="font-display text-2xl sm:text-3xl text-rose-900 leading-tight">~1 image</div>
                    <div className="text-xs text-rose-600 mt-1">Each frame = one denoise pass</div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4 ring-1 ring-indigo-100">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-[0.15em]">Attention cost</div>
                    <div className="font-display text-2xl sm:text-3xl text-indigo-900 leading-tight">O(n²)</div>
                    <div className="text-xs text-indigo-600 mt-1">Every frame checks every other</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-slate-600 leading-relaxed">
                  <p>
                    Here's why it's so expensive: doubling the clip length doesn't just double the
                    cost — the temporal attention grows <strong>quadratically</strong>. 10 seconds
                    doesn't cost 2× the 5-second clip; closer to 3–4×. That's why most tools still
                    cap videos at 5–10 seconds.
                  </p>
                  <div className="bg-rose-50 ring-1 ring-rose-200 rounded-lg p-4 text-sm text-rose-900">
                    <strong>Rough mental model:</strong> one second of AI video ≈ 24 images + the overhead
                    of keeping all 24 agreeing with each other. A 5-second clip from a modern model can
                    cost the same as generating a few hundred high-quality still images. This is why
                    "one click, get a movie" is still very much the frontier.
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 text-sm text-slate-500 italic">
                  <Film className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>The flipbook analogy:</strong> imagine an artist flipping 120 pages in a
                    flipbook, redrawing each one — but also having to glance at every other page to
                    make sure the cat's tail moves smoothly. That's video inference.
                  </span>
                </div>
              </Card>
            </section>

            {/* 4 — Image calculator */}
            <section id="calculator" className="scroll-mt-8">
              <SectionHeader
                icon={Zap}
                eyebrow="Interactive"
                title="The Image Cost Calculator"
                subtitle="Play with the knobs. Watch the ticker."
                accent="bg-gradient-to-br from-indigo-400 to-indigo-600"
              />
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 p-5 sm:p-7 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">Steps</span>
                      <span className="text-2xl font-bold text-indigo-600 tabular-nums">{steps}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>1 (fast & rough)</span><span>25</span><span>50 (slow & polished)</span>
                    </div>
                  </div>

                  <ControlRow label="Generation Mode">
                    <Pill active={!guided} onClick={() => setGuided(false)}>Unguided</Pill>
                    <Pill active={guided}  onClick={() => setGuided(true)}>Guided (CFG)</Pill>
                  </ControlRow>

                  <ControlRow label="Model Size">
                    <Pill active={modelSize === 'small'} onClick={() => setModelSize('small')}>Small · 8B</Pill>
                    <Pill active={modelSize === 'huge'}  onClick={() => setModelSize('huge')}>Huge · 70B+</Pill>
                  </ControlRow>

                  <ControlRow label="Hardware">
                    <Pill active={hardware === 'gpu'} onClick={() => setHardware('gpu')}>NVIDIA GPU</Pill>
                    <Pill active={hardware === 'tpu'} onClick={() => setHardware('tpu')}>Google TPU</Pill>
                  </ControlRow>

                  <ControlRow label="Hosting Approach">
                    <Pill active={hosting === 'api'}   onClick={() => setHosting('api')}>API (Claude/OpenAI)</Pill>
                    <Pill active={hosting === 'cloud'} onClick={() => setHosting('cloud')}>Rent Cloud Hardware</Pill>
                  </ControlRow>
                </div>

                <Ticker units={units} dollarsPer1k={dollarsPer1k} hosting={hosting} />
              </div>

              <Card className="mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">Steps × Guidance — same pattern, always</h3>
                  <p className="text-sm text-slate-500">Small model, GPU, API pricing. Guidance doubles the bill; steps scale linearly.</p>
                </div>
                <div className="space-y-3">
                  {comparisons.map((c) => (
                    <Bar key={c.label} label={c.label} units={c.units} max={maxBar} />
                  ))}
                </div>
              </Card>
            </section>

            {/* 5 — Input vs Output */}
            <section id="io" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={Coins}
                  eyebrow="Pricing asymmetry"
                  title="Input tokens are cheap. Output tokens are not."
                  subtitle="The single most misunderstood line item on your AI bill."
                  accent="bg-gradient-to-br from-amber-400 to-amber-600"
                />
                <IOPricingCard />
              </Card>
            </section>

            {/* 6 — CFG deep dive */}
            <section id="cfg" className="scroll-mt-8">
              <Card>
                <SectionHeader
                  icon={Compass}
                  eyebrow="Deep dive"
                  title="Why does 'guided' cost twice as much?"
                  subtitle="The most misunderstood knob in image generation. Let's do this properly."
                  accent="bg-gradient-to-br from-emerald-400 to-emerald-600"
                />
                <div className="space-y-3 text-slate-600 leading-relaxed">
                  <p>
                    If you just hand a prompt to a diffusion model, it will try to draw it — but it
                    doesn't really <em>care</em> how closely. Some steps it wanders off toward "a
                    generic photo"; some steps it stays faithful to your prompt. The result is often
                    mushy, or only loosely on-topic.
                  </p>
                  <p>
                    <strong>Classifier-Free Guidance (CFG)</strong> is the trick that fixed this. At
                    every step, the model denoises the image <em>twice</em>:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 my-2">
                    <div className="bg-indigo-50 rounded-lg p-4 ring-1 ring-indigo-100">
                      <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Pass 1 · Conditional</div>
                      <div className="text-sm text-slate-700">"Here's the noisy image <em>and</em> the prompt 'a red fox in snow.' What should it look like?"</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 ring-1 ring-slate-200">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Pass 2 · Unconditional</div>
                      <div className="text-sm text-slate-700">"Here's the same noisy image, <em>no prompt</em>. What would a generic picture look like?"</div>
                    </div>
                  </div>
                  <p>
                    The model subtracts the "generic" answer from the "prompt-aware" answer and
                    amplifies the difference. It literally <strong>steers away from generic and toward
                    your prompt</strong>. That push is the guidance scale (usually 5–12).
                  </p>
                  <p>
                    And here's the cost story: that happens <strong>every step</strong>. Two forward
                    passes through the network, per step, instead of one. Double the math, double the
                    electricity, double the bill.
                  </p>
                  <div className="bg-amber-50 ring-1 ring-amber-200 rounded-lg p-4 text-sm text-amber-900 flex gap-3">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <strong>The tradeoff:</strong> unguided is cheap but vague. Guided is 2× the cost
                      but prompts actually come out looking like what you asked for. Almost every image
                      model you've used in the last three years uses CFG by default.
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 7 — Real scenarios */}
            <section id="scenarios" className="scroll-mt-8">
              <SectionHeader
                icon={BarChart3}
                eyebrow="Grounding"
                title="What do real workloads actually cost?"
                subtitle="Compute Units are abstract. Dollars on real tasks are not."
                accent="bg-gradient-to-br from-emerald-400 to-emerald-600"
              />
              <ScenariosGrid />
              <p className="text-xs text-slate-400 italic mt-4 text-center">
                All figures use the same pricing constants as the calculators above. Illustrative — not
                a production quote.
              </p>
            </section>

            {/* 8 — All the knobs */}
            <section id="knobs" className="scroll-mt-8">
              <SectionHeader
                icon={MessageSquareQuote}
                eyebrow="Reference"
                title="Every knob, in plain English"
                subtitle="Bookmark-grade analogies. Open the 'real story' toggle on any card for the actual mechanics."
                accent="bg-gradient-to-br from-violet-400 to-violet-600"
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Explainer
                  icon={Hammer}
                  title="Steps — the sculptor's chisel"
                  accent="bg-gradient-to-br from-indigo-400 to-indigo-600"
                  deepDive={
                    <>
                      <p>Under the hood, each step solves a tiny piece of a differential equation that
                      predicts "how much noise is here, which direction is less noisy?" Better samplers
                      (DPM++, Euler) hit good quality in 20–30 steps; older ones needed 100+.</p>
                      <p>Cost scales linearly: 20 steps costs exactly 2× what 10 steps costs.</p>
                    </>
                  }
                >
                  <p>Each step is one chisel strike on the block of marble — it removes a little noise
                  and reveals a little more of the final image.</p>
                  <p>More strikes = finer detail, but proportionally more time. Linear, predictable.</p>
                </Explainer>

                <Explainer
                  icon={Compass}
                  title="Guidance — the 'yes, really, THAT prompt' dial"
                  accent="bg-gradient-to-br from-emerald-400 to-emerald-600"
                  deepDive={
                    <>
                      <p>Formally:
                      <code className="bg-white px-1 rounded mx-1">ε_final = ε_uncond + scale·(ε_cond − ε_uncond)</code>.
                      Scale (5–12) controls how hard to push toward the prompt.</p>
                      <p>Higher scale = more faithful but more saturated. Scale has <em>no effect on cost</em> —
                      you still do exactly 2 forward passes regardless of it.</p>
                    </>
                  }
                >
                  <p>At every step, the model draws the image twice — once with your prompt, once
                  without — and amplifies the difference. That's what makes it listen.</p>
                  <p>Two draws per step = twice the compute.</p>
                </Explainer>

                <Explainer
                  icon={Type}
                  title="Tokens — the atoms of text AI"
                  accent="bg-gradient-to-br from-violet-400 to-violet-600"
                  deepDive={
                    <>
                      <p>Real tokenizers use Byte-Pair Encoding (BPE) or similar. Common words get one
                      token; rare words and code get split into many. Emoji, Chinese, and code often
                      tokenize 2–5× worse than English.</p>
                      <p>Text models generate one token per forward pass, autoregressively — the bill
                      is fundamentally per-token.</p>
                    </>
                  }
                >
                  <p>Language models see tokens, not words. ~4 English characters per token; ~¾ of a
                  word. "Hello world" is 2 tokens; a long compound word might be 5.</p>
                  <p>Each output token requires one full trip through the network. Long responses = lots
                  of trips.</p>
                </Explainer>

                <Explainer
                  icon={Brain}
                  title="Model size — intern vs. professor"
                  accent="bg-gradient-to-br from-rose-400 to-rose-600"
                  deepDive={
                    <>
                      <p>"8B" = 8 billion learned parameters. Every forward pass reads and computes over
                      all of them.</p>
                      <p>A 70B model needs ~140 GB of GPU memory (at 16-bit precision), often spread
                      across multiple high-end GPUs. Cost multiplier comes from both more math and more
                      hardware.</p>
                    </>
                  }
                >
                  <p>An 8B model is a sharp intern: fast, good enough for most tasks. A 70B+ is a
                  tenured professor: slower, pricier, but subtler.</p>
                  <p>Powering up the bigger brain dominates the bill.</p>
                </Explainer>

                <Explainer
                  icon={Cpu}
                  title="GPUs vs. TPUs — sports car vs. bullet train"
                  accent="bg-gradient-to-br from-amber-400 to-amber-600"
                  deepDive={
                    <>
                      <p>GPUs (NVIDIA H100/A100) dominate because every ML framework supports them
                      natively. Cloud rental is ~$2–$10/hour each.</p>
                      <p>TPUs are Google's custom silicon, great for massive batches on Google Cloud;
                      less useful if you need PyTorch + custom kernels.</p>
                    </>
                  }
                >
                  <p><strong>GPUs</strong> are sports cars: fast, flexible, everyone can drive them.
                  Pricey by the hour but handle anything.</p>
                  <p><strong>TPUs</strong> are bullet trains built just for AI math — extraordinarily
                  efficient, but only on Google's tracks.</p>
                </Explainer>

                <Explainer
                  icon={Car}
                  title="Hosting — taxi vs. car lease"
                  accent="bg-gradient-to-br from-sky-400 to-sky-600"
                  deepDive={
                    <>
                      <p>API pricing bakes in provider margin, reserved capacity, and idle time. You
                      pay ~3–5× raw compute cost for someone else to handle scaling and on-call.</p>
                      <p>Self-hosted GPUs win only at &gt; 40% duty cycle. Below that, the API is cheaper.</p>
                    </>
                  }
                >
                  <p><strong>API</strong>: a taxi. Premium per mile, no car to buy, insure, or park.
                  Best for almost everyone.</p>
                  <p><strong>Cloud GPUs</strong>: leasing the sports car. Cheap per mile at 24/7 use —
                  painful if it sits idle.</p>
                </Explainer>

                <Explainer
                  icon={Scale}
                  title="Putting it all together"
                  accent="bg-gradient-to-br from-violet-400 to-violet-600"
                >
                  <p>Image bill = <em>steps × guidance × brain-size × hardware-rate</em>, priced by
                  hosting. Text bill = <em>(input tokens × rate-in) + (output tokens × rate-out)</em>.</p>
                  <p>Biggest levers: model size (up to 8×), guidance (2×), and — for text — output
                  length (which can be 5× more expensive than input).</p>
                </Explainer>
              </div>
            </section>

            <footer className="text-center text-sm text-slate-400 pt-8">
              Built as a playful explainer. Numbers are illustrative for teaching — not a production quote.
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
