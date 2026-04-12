import { ShoppingBag, MessageCircle, Images, Palette, FileText, PenLine } from 'lucide-react'
import { computeImageCost, textCost } from '../pricing'

type ScenarioCard = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  blurb: string
  cost: number
  assumption: string
  accent: string
}

const descriptionOutput = 300
const descriptionInput = 120
const descCost = textCost(1000 * descriptionInput, 1000 * descriptionOutput).total

const chatExchanges = 30
const chatTokensIn = 600
const chatTokensOut = 300
const chatCost = textCost(chatExchanges * chatTokensIn, chatExchanges * chatTokensOut).total

const thumbCost =
  computeImageCost({ steps: 12, guided: true, modelSize: 'small', hardware: 'gpu', hosting: 'api' })
    .dollarsPer1k

const heroCost =
  (computeImageCost({ steps: 40, guided: true, modelSize: 'huge', hardware: 'gpu', hosting: 'api' })
    .dollarsPer1k) / 1000

const pdfCost = textCost(25_000, 1_000).total

const blogCost = textCost(500, 15_000).total

const SCENARIOS: ScenarioCard[] = [
  {
    icon: ShoppingBag,
    title: '1,000 product descriptions',
    blurb: 'E-commerce back-fill: each SKU gets a paragraph generated from a short spec sheet.',
    cost: descCost,
    assumption: '~120 in / ~300 out per SKU · Claude-Sonnet-tier text model',
    accent: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: MessageCircle,
    title: 'One hour of support chat',
    blurb: 'A customer-support bot in active conversation for an hour, ~30 exchanges.',
    cost: chatCost,
    assumption: '~600 in / ~300 out per exchange · ~30 exchanges',
    accent: 'from-sky-400 to-sky-600',
  },
  {
    icon: Images,
    title: '1,000 thumbnails',
    blurb: 'Bulk-generating low-res illustrations for a content pipeline.',
    cost: thumbCost,
    assumption: 'Small model · 12 steps · guided · API',
    accent: 'from-indigo-400 to-indigo-600',
  },
  {
    icon: Palette,
    title: 'One marketing hero image',
    blurb: 'A single high-quality, on-brand image for a landing page.',
    cost: heroCost,
    assumption: 'Huge model · 40 steps · guided · API',
    accent: 'from-rose-400 to-rose-600',
  },
  {
    icon: FileText,
    title: 'Summarize a 50-page PDF',
    blurb: 'Feeding an entire report in, getting a one-page exec summary out.',
    cost: pdfCost,
    assumption: '~25k in / ~1k out',
    accent: 'from-amber-400 to-amber-600',
  },
  {
    icon: PenLine,
    title: 'Draft a 10k-word blog post',
    blurb: 'Short brief, long-form essay. Output-heavy workloads like this dominate AI bills.',
    cost: blogCost,
    assumption: '~500 in / ~15k out',
    accent: 'from-violet-400 to-violet-600',
  },
]

function fmt(cost: number) {
  if (cost < 0.01) return `~$${cost.toFixed(4)}`
  if (cost < 1) return `~$${cost.toFixed(3)}`
  if (cost < 100) return `~$${cost.toFixed(2)}`
  return `~$${cost.toFixed(0)}`
}

export function ScenariosGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SCENARIOS.map((s) => {
        const Icon = s.icon
        return (
          <div
            key={s.title}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 p-5 sm:p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
          >
            <div className={'w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/5 ring-1 ring-white/20 bg-gradient-to-br ' + s.accent}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-xl text-slate-900 leading-tight">{s.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{s.blurb}</p>
            <div className="mt-auto pt-2 border-t border-slate-100">
              <div className="text-3xl font-bold text-indigo-600 tabular-nums">{fmt(s.cost)}</div>
              <div className="text-xs text-slate-400">{s.assumption}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
