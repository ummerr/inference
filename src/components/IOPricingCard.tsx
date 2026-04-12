import { useState } from 'react'
import { textCost, TEXT_RATES } from '../pricing'

interface Scenario {
  key: string
  label: string
  blurb: string
  inputTokens: number
  outputTokens: number
}

const SCENARIOS: Scenario[] = [
  {
    key: 'tweet',
    label: 'Write a tweet',
    blurb: 'Short prompt, short output. The kind of task you barely think about.',
    inputTokens: 50,
    outputTokens: 30,
  },
  {
    key: 'summarize',
    label: 'Summarize a book chapter',
    blurb: 'You paste in a lot of text and ask for a paragraph back.',
    inputTokens: 12_000,
    outputTokens: 400,
  },
  {
    key: 'report',
    label: 'Generate a long report',
    blurb: 'Short brief in, thousands of words out. This is where bills balloon.',
    inputTokens: 500,
    outputTokens: 8_000,
  },
]

export function IOPricingCard() {
  const [active, setActive] = useState<Scenario>(SCENARIOS[0])
  const cost = textCost(active.inputTokens, active.outputTokens)
  const total = cost.total
  const inputPct = (cost.inputCost / total) * 100
  const outputPct = (cost.outputCost / total) * 100

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s)}
            className={
              'px-4 py-2 rounded-full text-sm font-medium transition-colors ' +
              (s.key === active.key
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-slate-600 text-sm italic">{active.blurb}</p>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-4 ring-1 ring-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Input</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {active.inputTokens.toLocaleString()}<span className="text-sm font-medium text-slate-500"> tokens</span>
          </div>
          <div className="text-sm text-slate-600 tabular-nums">
            ${cost.inputCost.toFixed(5)} <span className="text-slate-400">@ ${TEXT_RATES.inputPerM}/M</span>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 ring-1 ring-indigo-200">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Output</div>
          <div className="text-2xl font-bold text-indigo-900 tabular-nums">
            {active.outputTokens.toLocaleString()}<span className="text-sm font-medium text-indigo-500"> tokens</span>
          </div>
          <div className="text-sm text-indigo-700 tabular-nums">
            ${cost.outputCost.toFixed(5)} <span className="text-indigo-400">@ ${TEXT_RATES.outputPerM}/M</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Share of total bill</div>
          <div className="text-sm font-bold text-slate-900 tabular-nums">${total.toFixed(4)}</div>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden ring-1 ring-slate-200">
          <div
            className="bg-slate-400 flex items-center justify-center text-xs font-semibold text-white transition-all duration-500"
            style={{ width: `${inputPct}%` }}
          >
            {inputPct >= 10 ? `${inputPct.toFixed(0)}% input` : ''}
          </div>
          <div
            className="bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white transition-all duration-500"
            style={{ width: `${outputPct}%` }}
          >
            {outputPct >= 10 ? `${outputPct.toFixed(0)}% output` : ''}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 ring-1 ring-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <strong>The key insight:</strong> output tokens cost{' '}
        <strong>{(TEXT_RATES.outputPerM / TEXT_RATES.inputPerM).toFixed(0)}×</strong> what input tokens
        cost. Summarization is cheap (lots in, little out). Generation is expensive (little in, lots
        out). When you're estimating AI bills, start by asking: <em>how much will the model write
        back?</em>
      </div>
    </div>
  )
}
