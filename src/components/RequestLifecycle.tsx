import { useState } from 'react'
import { Send, Scissors, BookOpen, Repeat, MonitorPlay, Brain, Sparkles, CircleDot, Wand2, ImageIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Stage = {
  icon: LucideIcon
  label: string
  oneLiner: string
  costNote: string
  accent: string
}

const TOKEN_STAGES: Stage[] = [
  {
    icon: Send,
    label: 'You hit send',
    oneLiner: 'Your words leave your device and arrive at a datacenter a few hundred milliseconds away.',
    costNote: 'Negligible compute — but a real chunk of the latency you feel.',
    accent: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  {
    icon: Scissors,
    label: 'Tokenize',
    oneLiner: 'Your prompt is chopped into ~4-character chunks (tokens) — the only thing the model actually sees.',
    costNote: 'Free in dollars, but token count sets every downstream cost.',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    icon: BookOpen,
    label: 'Prefill',
    oneLiner: 'The model reads your entire prompt in one big parallel pass, building a working memory called the KV cache.',
    costNote: 'This is why long prompts cost more — roughly quadratic in length.',
    accent: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    icon: Repeat,
    label: 'Decode',
    oneLiner: 'The model generates one token at a time, each new token looking back at every prior one in memory.',
    costNote: "Long outputs are expensive — and can't be parallelized. This is why streaming exists.",
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    icon: MonitorPlay,
    label: 'Stream back',
    oneLiner: "Tokens appear on your screen as they're produced, not after the whole answer finishes.",
    costNote: 'Why ChatGPT "types" at you — it\'s not theatre, it\'s the decode loop leaking live.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
]

const REASONING_GOTCHA: Stage = {
  icon: Brain,
  label: 'Hidden think pass',
  oneLiner: 'Reasoning models (o-series, thinking modes) run an invisible extra decode loop before the visible answer starts.',
  costNote: 'The accessible gotcha: a $0.01 call can become $0.30. You pay for tokens you never see.',
  accent: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
}

const DIFFUSION_STAGES: Stage[] = [
  {
    icon: Send,
    label: 'You hit send',
    oneLiner: 'Your prompt travels to a datacenter and lands in a queue.',
    costNote: 'Same network hop as text — the difference starts next.',
    accent: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  {
    icon: Scissors,
    label: 'Encode prompt',
    oneLiner: 'Your words are tokenized and turned into a vector that describes the image you want.',
    costNote: 'Tiny cost — the prompt is just a steering wheel for what comes next.',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    icon: CircleDot,
    label: 'Start from noise',
    oneLiner: 'The canvas is pure random static. No picture yet — just a field of noise the same shape as the final image.',
    costNote: 'Free. This is the seed everything is sculpted from.',
    accent: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    icon: Sparkles,
    label: 'Denoise × N steps',
    oneLiner: 'The model predicts "what noise to subtract" 20–50 times, gradually pulling a picture out of the static.',
    costNote: 'This is the whole cost. Each step = one full forward pass of a huge model.',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    icon: Wand2,
    label: 'Guidance (CFG)',
    oneLiner: 'At each step, the model also runs a second "unguided" pass and blends the two — sharpening toward your prompt.',
    costNote: 'Guided mode literally doubles the math. The knob that trades dollars for obedience.',
    accent: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  },
  {
    icon: ImageIcon,
    label: 'Return image',
    oneLiner: 'The final clean tensor is decoded to pixels and sent back as a single blob.',
    costNote: 'No streaming — you wait for the whole denoise loop to finish before seeing anything.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
]

type Mode = 'token' | 'diffusion'

export function RequestLifecycle() {
  const [mode, setMode] = useState<Mode>('token')
  const stages = mode === 'token' ? TOKEN_STAGES : DIFFUSION_STAGES

  return (
    <section id="lifecycle" className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        Under the hood
      </div>
      <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight max-w-3xl">
        What your prompt does in the <em>two seconds</em> before the answer.
      </h2>
      <p className="mt-5 max-w-2xl text-slate-700 leading-relaxed">
        Every bill on this page comes from the same rough journey: your prompt enters a datacenter, gets chopped up,
        and a very expensive chip does a lot of math on it. The shape of that journey is different for text and images
        — and it's where all the cost actually hides.
      </p>

      <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-white/70 p-1 text-sm">
        <ModeBtn active={mode === 'token'} onClick={() => setMode('token')}>
          Text / LLM
        </ModeBtn>
        <ModeBtn active={mode === 'diffusion'} onClick={() => setMode('diffusion')}>
          Image / Diffusion
        </ModeBtn>
      </div>

      {/* Flow diagram */}
      <div className="mt-8 overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {stages.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <StageNode stage={s} index={i} />
              {i < stages.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((s, i) => (
          <StageCard key={s.label} stage={s} index={i} />
        ))}
      </div>

      {/* Reasoning gotcha — token mode only */}
      {mode === 'token' && (
        <div className="mt-8 max-w-3xl rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-fuchsia-100 text-fuchsia-700 p-2">
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">
              The reasoning-model gotcha
            </div>
          </div>
          <div className="mt-3 font-semibold text-slate-900">{REASONING_GOTCHA.oneLiner}</div>
          <div className="mt-2 text-sm text-slate-600 leading-relaxed">{REASONING_GOTCHA.costNote}</div>
        </div>
      )}

      <p className="mt-8 text-xs text-slate-500 leading-relaxed max-w-2xl">
        Simplified — real stacks add batching, speculative decoding, KV-cache sharing, and scheduler queues. But if
        you understand this skeleton, every cost on the rest of this page has somewhere to land.
      </p>
    </section>
  )
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function StageNode({ stage, index }: { stage: Stage; index: number }) {
  const Icon = stage.icon
  return (
    <div className={[
      'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 min-w-[120px]',
      stage.accent,
    ].join(' ')}>
      <Icon className="w-5 h-5" />
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step {index + 1}</div>
      <div className="text-sm font-semibold text-center leading-tight">{stage.label}</div>
    </div>
  )
}

function Arrow() {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" className="text-slate-400 shrink-0" aria-hidden>
      <path d="M0 6 H16 M12 2 L16 6 L12 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const Icon = stage.icon
  return (
    <div className="rounded-2xl bg-white/70 border border-slate-200 p-5">
      <div className="flex items-center gap-2">
        <div className={['rounded-lg p-1.5 border', stage.accent].join(' ')}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Step {index + 1}</div>
      </div>
      <div className="font-semibold text-slate-900 mt-3">{stage.label}</div>
      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{stage.oneLiner}</div>
      <div className="text-xs text-slate-500 mt-3 leading-relaxed italic">{stage.costNote}</div>
    </div>
  )
}
