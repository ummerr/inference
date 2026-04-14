import { useMemo, useState } from 'react'
import { useQueryState } from '../router'

const H100_FP16_TFLOPS = 989

type Inputs = {
  params: number
  tokens: number
  rate: number
  util: number
}

function format(n: number, unit: string): string {
  if (!isFinite(n)) return '—'
  if (n >= 1) return `${n.toFixed(2)} ${unit}`
  if (n >= 0.001) return `${(n * 1000).toFixed(2)} m${unit}`
  return `${(n * 1_000_000).toFixed(2)} µ${unit}`
}

export function NapkinMath() {
  const [params, setParams] = useQueryState('params', '12')
  const [tokens, setTokens] = useQueryState('tokens', '1000')
  const [rate, setRate] = useQueryState('rate', '0.0006')
  const [util, setUtil] = useQueryState('util', '0.35')

  const inputs: Inputs = {
    params: Number(params) || 0,
    tokens: Number(tokens) || 0,
    rate: Number(rate) || 0,
    util: Math.max(0.01, Math.min(1, Number(util) || 0.01)),
  }

  const derived = useMemo(() => {
    const flops = inputs.params * 1e9 * inputs.tokens * 2
    const flopsPerSec = H100_FP16_TFLOPS * 1e12 * inputs.util
    const seconds = flopsPerSec > 0 ? flops / flopsPerSec : 0
    const cost = seconds * inputs.rate
    return { flops, flopsPerSec, seconds, cost }
  }, [inputs])

  const [copied, setCopied] = useState(false)
  const copyLines = () => {
    const text = [
      `# back-of-envelope inference cost`,
      `params = ${inputs.params}B   tokens = ${inputs.tokens}   $/GPU-s = ${inputs.rate}   util = ${inputs.util}`,
      `work    = params × tokens × 2           = ${(derived.flops / 1e12).toFixed(2)} TFLOPs`,
      `time    = work / (H100 FLOPs/s × util)  = ${derived.seconds.toFixed(3)} s`,
      `cost    = time × $/GPU-s                = $${derived.cost.toFixed(6)}`,
    ].join('\n')
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 overflow-hidden">
      <div className="p-5 sm:p-7 grid sm:grid-cols-4 gap-4">
        <Input label="Params (B)" value={params} onChange={setParams} step="0.1" />
        <Input label="Tokens" value={tokens} onChange={setTokens} step="100" />
        <Input label="$/GPU-second" value={rate} onChange={setRate} step="0.0001" />
        <Input label="Utilization (0–1)" value={util} onChange={setUtil} step="0.05" />
      </div>

      <div className="border-t border-slate-200/70 bg-slate-50/60 px-5 sm:px-7 py-5 font-mono text-[11px] sm:text-xs leading-relaxed">
        <Line lhs="work" rhs={`params × tokens × 2`} note={`= ${format(derived.flops / 1e12, 'TFLOPs')}`} />
        <Line lhs="time" rhs={`work / (H100 FLOPs/s × util)`} note={`= ${format(derived.seconds, 's')}`} />
        <Line lhs="cost" rhs={`time × $/GPU-s`} note={`= $${derived.cost.toExponential(3)}`} />
      </div>

      <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-t border-slate-200/70 bg-white/60">
        <div className="text-[11px] text-slate-500">
          H100 FP16 peak ≈ 989 TFLOPs/s. Utilization is the lever nobody talks about.
        </div>
        <button
          type="button"
          onClick={copyLines}
          className="text-xs px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          {copied ? 'copied ✓' : 'copy derivation'}
        </button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, step }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  )
}

function Line({ lhs, rhs, note }: { lhs: string; rhs: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-slate-700">
      <span className="flex-1 min-w-0">
        <span className="text-slate-900 font-semibold">{lhs}</span>
        <span className="text-slate-400 mx-1.5">=</span>
        <span>{rhs}</span>
      </span>
      <span className="text-slate-500 italic text-[10px] sm:text-[11px]">{note}</span>
    </div>
  )
}
