import type React from 'react'

// Compact inline SVG glyphs — one per friction modality id.
// Rendered under the modality label inside each friction card in Misc.tsx.

const W = 200
const H = 52

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="max-w-[220px] block"
    >
      {children}
    </svg>
  )
}

function Images() {
  // 25 → 4 step ladder, indigo accent
  return (
    <Frame>
      {Array.from({ length: 25 }).map((_, i) => (
        <circle
          key={`l${i}`}
          cx={8 + (i % 13) * 4}
          cy={20 + Math.floor(i / 13) * 8}
          r={1.4}
          fill="#a5b4fc"
        />
      ))}
      <path d="M 70 24 L 110 24" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
      <path d="M 106 21 L 111 24 L 106 27 Z" fill="#64748b" />
      {[0, 1, 2, 3].map(i => (
        <circle key={`r${i}`} cx={126 + i * 14} cy={24} r={3.6} fill="#6366f1" />
      ))}
      <text x={8}   y={48} fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">25 steps</text>
      <text x={126} y={48} fontSize="8" fill="#4f46e5" fontFamily="ui-monospace, monospace" fontWeight="600">4 steps</text>
    </Frame>
  )
}

function Video() {
  // Super-linear cache growth curve — rose accent
  return (
    <Frame>
      <line x1="0.5" y1="44" x2="196" y2="44" stroke="#fecaca" strokeWidth="1" />
      <line x1="0.5" y1="4"  x2="0.5"  y2="44" stroke="#fecaca" strokeWidth="1" />
      <path
        d="M 2 44 Q 100 42 140 24 T 196 4"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M 2 44 Q 100 42 140 24 T 196 4 L 196 44 Z"
        fill="#fecaca"
        opacity="0.4"
      />
      <circle cx="196" cy="4" r="2.5" fill="#e11d48" />
      <text x="4"   y="14" fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">KV-cache</text>
      <text x="196" y="50" fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace" textAnchor="end">clip length</text>
    </Frame>
  )
}

function Audio() {
  // Token stream with a vertical "latency deadline" bar, emerald accent
  const tokens = 16
  return (
    <Frame>
      <line x1="0.5" y1="28" x2="200" y2="28" stroke="#a7f3d0" strokeWidth="1" />
      {Array.from({ length: tokens }).map((_, i) => {
        const x = 8 + i * 11
        const h = 6 + ((i * 7) % 11) // pseudo-random heights
        return (
          <rect
            key={i}
            x={x}
            y={28 - h}
            width={4}
            height={h}
            rx={1}
            fill={i < 12 ? '#10b981' : '#fca5a5'}
          />
        )
      })}
      {/* deadline */}
      <line x1="140" y1="6" x2="140" y2="36" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="2 2" />
      <text x="144" y="12" fontSize="7" fill="#f43f5e" fontFamily="ui-monospace, monospace">deadline</text>
      <text x="8"   y="48" fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">tokens / ms</text>
    </Frame>
  )
}

function World() {
  // Memory growing then hitting a hard cliff/ceiling — amber accent
  return (
    <Frame>
      <line x1="0.5" y1="44" x2="196" y2="44" stroke="#fde68a" strokeWidth="1" />
      <line x1="0.5" y1="4"  x2="0.5"  y2="44" stroke="#fde68a" strokeWidth="1" />
      {/* ceiling */}
      <line x1="2" y1="10" x2="196" y2="10" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
      <text x="196" y="8" fontSize="7" fill="#b45309" fontFamily="ui-monospace, monospace" textAnchor="end">memory ceiling</text>
      {/* growth then flat */}
      <path
        d="M 2 44 L 30 38 L 60 28 L 90 18 L 120 11 L 125 10 L 196 10"
        fill="none"
        stroke="#d97706"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 2 44 L 30 38 L 60 28 L 90 18 L 120 11 L 125 10 L 196 10 L 196 44 Z"
        fill="#fde68a"
        opacity="0.4"
      />
      <circle cx="125" cy="10" r="3" fill="white" stroke="#d97706" strokeWidth="1.5" />
      <text x="4"   y="50" fontSize="7" fill="#94a3b8" fontFamily="ui-monospace, monospace">session time →</text>
    </Frame>
  )
}

const GLYPHS: Record<string, () => React.ReactElement> = {
  images: Images,
  video:  Video,
  audio:  Audio,
  world:  World,
}

export function FrictionGlyph({ id }: { id: string }) {
  const G = GLYPHS[id]
  if (!G) return null
  return (
    <div className="mt-1 mb-3">
      <G />
    </div>
  )
}
