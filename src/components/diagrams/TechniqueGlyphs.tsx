import type React from 'react'

// Compact inline SVG glyphs — one per technique id.
// Rendered above the "Gain" row inside each technique card in Misc.tsx.

const W = 180
const H = 48

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="max-w-[200px] block"
    >
      {children}
    </svg>
  )
}

function Distillation() {
  // 25 small dots → 4 larger dots
  const leftCount = 25
  const leftSpacing = 3.4
  const leftStart = 8
  const rightCount = 4
  const rightSpacing = 12
  const rightStart = 118
  return (
    <Frame>
      {Array.from({ length: leftCount }).map((_, i) => (
        <circle
          key={`l${i}`}
          cx={leftStart + (i % 13) * leftSpacing}
          cy={20 + Math.floor(i / 13) * 8}
          r={1.2}
          fill="#a5b4fc"
        />
      ))}
      <path d="M 60 24 L 100 24" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
      <path d="M 96 21 L 101 24 L 96 27 Z" fill="#64748b" />
      {Array.from({ length: rightCount }).map((_, i) => (
        <circle key={`r${i}`} cx={rightStart + i * rightSpacing} cy={24} r={3.2} fill="#6366f1" />
      ))}
      <text x={8} y={44} fontSize="7.5" fill="#94a3b8" fontFamily="ui-monospace, monospace">25</text>
      <text x={118} y={44} fontSize="7.5" fill="#94a3b8" fontFamily="ui-monospace, monospace">4</text>
    </Frame>
  )
}

function Speculative() {
  // Two lanes: draft proposes, target verifies (parallel).
  // Draft: thin line with 6 small dots; Target: thicker line with ✓ marks.
  return (
    <Frame>
      {/* draft lane */}
      <text x={4} y={12} fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">draft</text>
      <line x1={30} y1={12} x2={170} y2={12} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <circle key={i} cx={40 + i * 22} cy={12} r={2.2} fill="#94a3b8" />
      ))}
      {/* target lane */}
      <text x={4} y={36} fontSize="7" fill="#10b981" fontFamily="ui-monospace, monospace">target</text>
      <line x1={30} y1={36} x2={170} y2={36} stroke="#10b981" strokeWidth="1.5" />
      {/* check marks on accepted tokens */}
      {[0, 1, 3, 4].map(i => (
        <g key={`ok${i}`}>
          <circle cx={40 + i * 22} cy={36} r={4} fill="white" stroke="#10b981" strokeWidth="1.2" />
          <path d={`M ${37 + i * 22} 36 L ${39 + i * 22} 38 L ${43 + i * 22} 34`} stroke="#10b981" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* rejections (x) */}
      {[2, 5].map(i => (
        <g key={`x${i}`}>
          <circle cx={40 + i * 22} cy={36} r={4} fill="white" stroke="#f43f5e" strokeWidth="1.2" />
          <path d={`M ${37 + i * 22} 33 L ${43 + i * 22} 39 M ${43 + i * 22} 33 L ${37 + i * 22} 39`} stroke="#f43f5e" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </Frame>
  )
}

function MoE() {
  // Gate in middle, 8 experts fanned out, 2 highlighted with a routing line
  return (
    <Frame>
      {/* token stream on left */}
      <rect x={4} y={20} width={28} height={10} rx={2} fill="#e2e8f0" />
      <text x={6} y={28} fontSize="7" fill="#475569" fontFamily="ui-monospace, monospace">token</text>
      {/* gate diamond */}
      <path d="M 50 24 L 58 16 L 66 24 L 58 32 Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <text x={54} y={26} fontSize="6.5" fill="#b45309" fontFamily="ui-monospace, monospace">gate</text>
      {/* 8 experts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const active = i === 2 || i === 5
        const cx = 90 + (i % 4) * 22
        const cy = 12 + Math.floor(i / 4) * 24
        return (
          <g key={i}>
            {active && (
              <line x1={66} y1={24} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
            )}
            <circle cx={cx} cy={cy} r={6} fill={active ? '#f59e0b' : 'white'} stroke={active ? '#b45309' : '#cbd5e1'} strokeWidth="1" />
            <text x={cx} y={cy + 2} fontSize="6" fill={active ? 'white' : '#94a3b8'} fontFamily="ui-monospace, monospace" textAnchor="middle">E{i + 1}</text>
          </g>
        )
      })}
    </Frame>
  )
}

function Quantization() {
  // Four bars of halving width: FP32, FP16, FP8, INT4
  const bars = [
    { label: 'FP32', width: 120, color: '#334155' },
    { label: 'FP16', width: 60,  color: '#475569' },
    { label: 'FP8',  width: 30,  color: '#6366f1' },
    { label: 'INT4', width: 15,  color: '#a5b4fc' },
  ]
  return (
    <Frame>
      {bars.map((b, i) => (
        <g key={b.label}>
          <rect x={34} y={4 + i * 10} width={b.width} height={7} rx={1.5} fill={b.color} />
          <text x={30} y={11 + i * 10} fontSize="7" fill="#475569" fontFamily="ui-monospace, monospace" textAnchor="end">{b.label}</text>
        </g>
      ))}
    </Frame>
  )
}

function KVCache() {
  // 4×8 grid, right half faded with × marks (evicted)
  const rows = 4
  const cols = 8
  const cellW = 10
  const cellH = 7
  const ox = 18
  const oy = 8
  return (
    <Frame>
      {Array.from({ length: rows * cols }).map((_, k) => {
        const r = Math.floor(k / cols)
        const c = k % cols
        const evicted = c >= 4 && (r + c) % 2 === 0
        const compressed = c >= 4 && !evicted
        return (
          <g key={k}>
            <rect
              x={ox + c * cellW}
              y={oy + r * (cellH + 2)}
              width={cellW - 2}
              height={cellH}
              rx={1}
              fill={evicted ? 'transparent' : compressed ? '#a5b4fc' : '#6366f1'}
              stroke={evicted ? '#cbd5e1' : 'none'}
              strokeWidth="0.6"
              strokeDasharray={evicted ? '1.5 1.5' : undefined}
            />
            {evicted && (
              <path
                d={`M ${ox + c * cellW + 1} ${oy + r * (cellH + 2) + 1} L ${ox + c * cellW + cellW - 3} ${oy + r * (cellH + 2) + cellH - 1} M ${ox + c * cellW + cellW - 3} ${oy + r * (cellH + 2) + 1} L ${ox + c * cellW + 1} ${oy + r * (cellH + 2) + cellH - 1}`}
                stroke="#cbd5e1"
                strokeWidth="0.7"
              />
            )}
          </g>
        )
      })}
      <text x={ox} y={44} fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">keep</text>
      <text x={ox + 4 * cellW + 2} y={44} fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">evict / compress</text>
    </Frame>
  )
}

function PrefixCache() {
  // Two stacked query lines sharing a highlighted prefix segment
  return (
    <Frame>
      {/* Query 1 */}
      <text x={4} y={13} fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">q1</text>
      <rect x={22} y={7} width={90} height={8} rx={2} fill="#6366f1" />
      <rect x={112} y={7} width={28} height={8} rx={2} fill="#cbd5e1" />
      {/* Query 2 */}
      <text x={4} y={29} fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">q2</text>
      <rect x={22} y={23} width={90} height={8} rx={2} fill="#6366f1" />
      <rect x={112} y={23} width={38} height={8} rx={2} fill="#cbd5e1" />
      {/* shared prefix label */}
      <line x1={22} y1={38} x2={112} y2={38} stroke="#6366f1" strokeWidth="0.8" />
      <text x={67} y={45} fontSize="7" fill="#6366f1" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="600">shared prefix</text>
    </Frame>
  )
}

const GLYPHS: Record<string, () => React.ReactElement> = {
  distillation: Distillation,
  speculative:  Speculative,
  moe:          MoE,
  quant:        Quantization,
  kvcache:      KVCache,
  prefix:       PrefixCache,
}

export function TechniqueGlyph({ id }: { id: string }) {
  const G = GLYPHS[id]
  if (!G) return null
  return (
    <div className="mb-3 mt-1">
      <G />
    </div>
  )
}
