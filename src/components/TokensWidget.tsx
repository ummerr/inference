import { useMemo, useState } from 'react'
import { fakeTokenize, textCost } from '../pricing'

const CHIP_COLORS = [
  'bg-indigo-100 text-indigo-900',
  'bg-emerald-100 text-emerald-900',
  'bg-amber-100 text-amber-900',
  'bg-rose-100 text-rose-900',
  'bg-sky-100 text-sky-900',
]

export function TokensWidget() {
  const [text, setText] = useState(
    'The quick brown fox jumps over the lazy dog. Tokens are how language models see your words.',
  )

  const tokens = useMemo(() => fakeTokenize(text), [text])
  const { inputCost } = textCost(tokens.length, 0)
  const costPer1k = (1000 / Math.max(1, tokens.length)) * inputCost

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none p-3 text-sm resize-none font-mono"
        placeholder="Type or paste text to see how it's tokenized…"
      />

      <div className="flex flex-wrap gap-1 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 min-h-[4rem]">
        {tokens.length === 0 ? (
          <span className="text-sm text-slate-400 italic">Tokens will appear here…</span>
        ) : (
          tokens.map((tok, i) => (
            <span
              key={i}
              className={
                'px-1.5 py-0.5 rounded text-xs font-mono whitespace-pre ' +
                CHIP_COLORS[i % CHIP_COLORS.length]
              }
            >
              {tok.replace(/\n/g, '↵')}
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="bg-slate-50 rounded-lg p-3 ring-1 ring-slate-200">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{tokens.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">tokens</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 ring-1 ring-slate-200">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{text.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">characters</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 ring-1 ring-indigo-200">
          <div className="text-xl sm:text-2xl font-bold text-indigo-700 tabular-nums">
            ${costPer1k.toFixed(4)}
          </div>
          <div className="text-xs text-indigo-600 uppercase tracking-wide">per 1k inputs</div>
        </div>
      </div>

      <p className="text-xs text-slate-400 italic">
        Note: this is a ~4-chars-per-token approximation for illustration. Real tokenizers (BPE) split
        at sub-word boundaries and handle languages, emoji, and code smarter than this.
      </p>
    </div>
  )
}
