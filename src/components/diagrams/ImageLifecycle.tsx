import type { CSSProperties } from 'react'
import { useInView } from '../../hooks/useInView'

type Stage = { id: string; title: string; sub: string; emphasis?: boolean }

const STAGES: Stage[] = [
  { id: 'prompt',   title: 'Prompt',       sub: '"a red fox"' },
  { id: 'tokenize', title: 'Tokenize',     sub: 'BPE · ~8 tokens' },
  { id: 'encode',   title: 'Text encoder', sub: 'T5-XXL / CLIP' },
  { id: 'denoise',  title: 'Denoiser',     sub: 'U-Net / DiT · N passes', emphasis: true },
  { id: 'vae',      title: 'VAE decode',   sub: 'latent → pixels' },
  { id: 'out',      title: 'Image',        sub: '1024² RGB' },
]

const COST = [
  { id: 'text',    label: 'Text encode', pct: 2,  color: '#c7d2fe' },
  { id: 'denoise', label: 'Denoising',   pct: 90, color: '#6366f1' },
  { id: 'vae',     label: 'VAE decode',  pct: 8,  color: '#a5b4fc' },
]

export function ImageLifecycle() {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      data-reveal={inView ? 'in' : 'out'}
      className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
          Image · Flash Image 2.5 · $0.039 / 1024²
        </div>
        <div className="font-mono text-[10px] text-slate-500">~65 GPU-s on H100</div>
      </div>
      <h3 className="font-display text-2xl sm:text-3xl text-slate-900">Lifecycle of a gen image query</h3>

      {/* Stage flow — horizontal scroll on mobile */}
      <div className="mt-6 -mx-1 px-1 overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-[660px]">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-stretch">
              <div
                className="rv-stage flex flex-col justify-center px-3 py-3 rounded-xl bg-white border flex-1 min-w-[92px]"
                style={{
                  '--i': i,
                  borderColor: s.emphasis ? '#6366f1' : '#e0e7ff',
                  boxShadow: s.emphasis ? '0 0 0 3px rgba(99, 102, 241, 0.10)' : undefined,
                } as CSSProperties}
              >
                <div className={`text-[11px] font-semibold ${s.emphasis ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {s.title}
                </div>
                <div className="font-mono text-[10px] text-slate-500 mt-0.5 leading-tight">{s.sub}</div>
              </div>
              {i < STAGES.length - 1 && <StageArrow i={i} accent="#818cf8" />}
            </div>
          ))}
        </div>
      </div>

      {/* Cost strip */}
      <div className="mt-6">
        <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-white border border-indigo-100">
          {COST.map((c, i) => (
            <div
              key={c.id}
              className="rv-bar h-full"
              style={{
                width: `${c.pct}%`,
                background: c.color,
                '--base-delay': `${700 + i * 90}ms`,
              } as CSSProperties}
              title={`${c.label} ${c.pct}%`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500">
          {COST.map(c => (
            <span key={c.id}>
              <span className="text-slate-700 font-semibold">{c.pct}%</span> {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Denoising detail — the headline 25 → 4 visual */}
      <div className="mt-6 rounded-2xl bg-white/70 border border-indigo-100 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Inside the denoiser</div>
            <div className="text-sm text-slate-700 mt-0.5">The 90% bar above, at a magnified resolution.</div>
          </div>
          <div className="font-mono text-[10px] text-indigo-700 font-semibold shrink-0">25 → 4 steps</div>
        </div>

        <DotRow count={25} label="Teacher · 25 passes" variant="faded" baseDelay={900} />
        <DistillArrow baseDelay={1600} />
        <DotRow count={4}  label="Student · 4 passes · same quality envelope" variant="solid" baseDelay={1800} large />

        <div className="mt-3 pt-3 border-t border-indigo-100/70 font-mono text-[10px] text-slate-500">
          Δ ~6× cheaper per image at equal quality · the single largest cost lever of 2024–2026
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600 leading-relaxed">
        Every cent you spend on an image is almost entirely the denoiser running N forward passes.
        Cut N and you cut the bill. That's the trajectory.
      </p>
    </div>
  )
}

function StageArrow({ i, accent }: { i: number; accent: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 w-5 sm:w-6" aria-hidden="true">
      <svg viewBox="0 0 24 8" width="22" height="8" className="block">
        <line
          x1="0" y1="4" x2="18" y2="4"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          className="rv-line"
          style={{
            strokeDasharray: 20,
            '--dash': 20,
            '--base-delay': `${160 + i * 90}ms`,
          } as CSSProperties}
        />
        <path
          d="M 18 1 L 23 4 L 18 7 Z"
          fill={accent}
          className="rv-stage"
          style={{ '--i': i + 0.5 } as CSSProperties}
        />
      </svg>
    </div>
  )
}

function DotRow({
  count,
  label,
  variant,
  baseDelay,
  large,
}: {
  count: number
  label: string
  variant: 'faded' | 'solid'
  baseDelay: number
  large?: boolean
}) {
  const r = large ? 6 : 3
  const spacing = large ? 26 : 10
  const width = count * spacing + spacing
  const height = large ? 20 : 12
  const fill = variant === 'faded' ? '#a5b4fc' : '#6366f1'
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMinYMid meet"
        className="max-w-[360px]"
      >
        {Array.from({ length: count }).map((_, i) => (
          <circle
            key={i}
            cx={spacing / 2 + i * spacing}
            cy={height / 2}
            r={r}
            fill={fill}
            opacity={variant === 'faded' ? 0.55 : 1}
            className="rv-step"
            style={{
              '--i': i,
              '--base-delay': `${baseDelay}ms`,
            } as CSSProperties}
          />
        ))}
        <title>{label}</title>
      </svg>
      <span className="font-mono text-[10px] text-slate-500 shrink-0">{label}</span>
    </div>
  )
}

function DistillArrow({ baseDelay }: { baseDelay: number }) {
  return (
    <div className="pl-[2px] my-1.5 flex items-center gap-2">
      <svg viewBox="0 0 12 24" width="12" height="20" aria-hidden="true">
        <line
          x1="6" y1="2" x2="6" y2="18"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="rv-line"
          style={{
            strokeDasharray: 20,
            '--dash': 20,
            '--base-delay': `${baseDelay}ms`,
          } as CSSProperties}
        />
        <path d="M 3 15 L 6 20 L 9 15 Z" fill="#818cf8" className="rv-stage" style={{ '--i': 10 } as CSSProperties} />
      </svg>
      <span className="font-mono text-[10px] italic text-slate-500">distill</span>
    </div>
  )
}
