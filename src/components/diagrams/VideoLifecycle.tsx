import type { CSSProperties } from 'react'
import { useInView } from '../../hooks/useInView'

type Stage = { id: string; title: string; sub: string; emphasis?: boolean }

const STAGES: Stage[] = [
  { id: 'prompt',   title: 'Prompt',        sub: '"a fox running, 8s"' },
  { id: 'tokenize', title: 'Tokenize',      sub: 'BPE · ~12 tokens' },
  { id: 'encode',   title: 'Text encoder',  sub: 'T5-XXL' },
  { id: 'latent',   title: 'Temporal latent', sub: 'T × H × W × C' },
  { id: 'denoise',  title: 'Space-time denoiser', sub: 'KV-cache grows ↗', emphasis: true },
  { id: 'vae',      title: 'Temporal VAE',  sub: 'latent → frames' },
  { id: 'out',      title: '8s clip',       sub: '30 fps · 240 frames' },
]

const COST = [
  { id: 'text',    label: 'Text encode',  pct: 1,  color: '#fecdd3' },
  { id: 'latent',  label: 'Latent init',  pct: 2,  color: '#fda4af' },
  { id: 'denoise', label: 'Space-time denoiser', pct: 93, color: '#e11d48' },
  { id: 'vae',     label: 'VAE decode',   pct: 4,  color: '#fda4af' },
]

export function VideoLifecycle() {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      data-reveal={inView ? 'in' : 'out'}
      className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
          Video · Veo 3.1 Standard · $0.40 / sec
        </div>
        <div className="font-mono text-[10px] text-slate-500">8s clip ≈ $3.20</div>
      </div>
      <h3 className="font-display text-2xl sm:text-3xl text-slate-900">Lifecycle of a gen video query</h3>

      {/* Stage flow */}
      <div className="mt-6 -mx-1 px-1 overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-[780px]">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-stretch">
              <div
                className="rv-stage flex flex-col justify-center px-3 py-3 rounded-xl bg-white border flex-1 min-w-[96px]"
                style={{
                  '--i': i,
                  borderColor: s.emphasis ? '#e11d48' : '#fecdd3',
                  boxShadow: s.emphasis ? '0 0 0 3px rgba(225, 29, 72, 0.10)' : undefined,
                } as CSSProperties}
              >
                <div className={`text-[11px] font-semibold ${s.emphasis ? 'text-rose-700' : 'text-slate-700'}`}>
                  {s.title}
                </div>
                <div className="font-mono text-[10px] text-slate-500 mt-0.5 leading-tight">{s.sub}</div>
              </div>
              {i < STAGES.length - 1 && <StageArrow i={i} accent="#fb7185" />}
            </div>
          ))}
        </div>
      </div>

      {/* Cost strip */}
      <div className="mt-6">
        <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-white border border-rose-100">
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
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500 gap-2 flex-wrap">
          {COST.map(c => (
            <span key={c.id}>
              <span className="text-slate-700 font-semibold">{c.pct}%</span> {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* KV-cache growth panel — the bottleneck visualized */}
      <div className="mt-6 rounded-2xl bg-white/70 border border-rose-100 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Inside the denoiser</div>
            <div className="text-sm text-slate-700 mt-0.5">Why video can't just copy image's step-count trick.</div>
          </div>
          <div className="font-mono text-[10px] text-rose-700 font-semibold shrink-0">bandwidth-bound</div>
        </div>

        <KVGrowthCurve />

        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">H100 HBM bandwidth</span>
            <span className="font-mono text-[10px] text-rose-700 font-semibold">~95% saturated</span>
          </div>
          <div className="h-2 rounded-full bg-white border border-rose-100 overflow-hidden">
            <div
              className="rv-bar h-full bg-rose-500 rounded-full"
              style={{ width: '95%', '--base-delay': '2000ms' } as CSSProperties}
            />
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            3.35 TB/s · the wall the model hits before FLOPs run out
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-rose-100/70 font-mono text-[10px] text-slate-500">
          KV-cache memory grows with length × resolution × layers · a 2× longer clip is not 2× cost
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-600 leading-relaxed">
        Every second of video is the denoiser attending across every previous frame. The KV-cache —
        not the FLOPs — is what decides whether the job fits on one chip or needs a rack.
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

function KVGrowthCurve() {
  // Quadratic-ish curve: cache(t) ∝ t × resolution × layers.
  // Drawn in SVG viewBox 0 0 360 110 so it's responsive.
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">KV-cache memory · vs · clip length</span>
        <span className="font-mono text-[10px] text-slate-500">super-linear</span>
      </div>
      <svg viewBox="0 0 360 110" width="100%" height="100" preserveAspectRatio="none" className="block">
        {/* gridlines */}
        <line x1="0"   y1="100" x2="360" y2="100" stroke="#fecdd3" strokeWidth="1" />
        <line x1="0.5" y1="0"   x2="0.5" y2="100" stroke="#fecdd3" strokeWidth="1" />
        <line x1="0"   y1="70"  x2="360" y2="70"  stroke="#fecdd3" strokeWidth="0.5" strokeDasharray="2 3" />
        <line x1="0"   y1="40"  x2="360" y2="40"  stroke="#fecdd3" strokeWidth="0.5" strokeDasharray="2 3" />

        {/* filled area under the curve */}
        <path
          d="M 0 100 Q 180 95 240 55 T 360 5 L 360 100 Z"
          fill="url(#kv-fill)"
          className="rv-stage"
          style={{ '--i': 4, opacity: 0.0 } as CSSProperties}
        />
        <defs>
          <linearGradient id="kv-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fecaca" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* the curve itself — drawn via dashoffset */}
        <path
          d="M 0 100 Q 180 95 240 55 T 360 5"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2"
          strokeLinecap="round"
          className="rv-curve"
          style={{
            strokeDasharray: 500,
            '--dash': 500,
            '--base-delay': '1400ms',
          } as CSSProperties}
        />

        {/* end marker */}
        <circle cx="360" cy="5" r="3.5" fill="#e11d48"
          className="rv-step"
          style={{ '--i': 40, '--base-delay': '1800ms' } as CSSProperties}
        />

        {/* tick labels */}
        <text x="6" y="12" fontSize="9" fill="#94a3b8" fontFamily="ui-monospace, monospace">memory</text>
        <text x="340" y="98" fontSize="9" fill="#94a3b8" fontFamily="ui-monospace, monospace" textAnchor="end">clip length →</text>
      </svg>
    </div>
  )
}
