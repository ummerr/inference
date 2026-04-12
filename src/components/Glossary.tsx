const TERMS: { term: string; def: string; emoji: string }[] = [
  { term: 'Inference',        emoji: '⚡', def: 'Running a trained model to produce an output. The part you pay for every time.' },
  { term: 'FLOPs',            emoji: '🧮', def: 'Floating-point operations — the basic unit of neural-network math. Bigger model = more FLOPs per output.' },
  { term: 'Diffusion',        emoji: '🌫️', def: 'A model family that generates data by iteratively removing noise from random static. Used for most image/video models.' },
  { term: 'Denoising step',   emoji: '🪄', def: 'One pass of the diffusion model that makes the noise slightly less noisy. Modern models need 1–50 of these per image.' },
  { term: 'CFG / guidance',   emoji: '🎯', def: 'Classifier-free guidance — a trick that doubles per-step cost to dramatically improve prompt-following.' },
  { term: 'Latent space',     emoji: '🗜️', def: 'A compressed representation (e.g. 128×128 instead of 1024×1024) that models work in to save compute.' },
  { term: 'Attention',        emoji: '👀', def: 'The mechanism that lets every token / patch / frame "look at" every other one. Its cost grows quadratically (O(n²)).' },
  { term: 'Autoregressive',   emoji: '➡️', def: 'Generating one piece at a time, each conditioned on the last. Audio and LLMs mostly work this way; it resists batching.' },
  { term: 'Vocoder',          emoji: '🔊', def: 'A neural network that turns abstract audio tokens into actual waveform samples.' },
  { term: 'Batching',         emoji: '📦', def: 'Running many requests through a GPU together to amortize fixed costs. The single biggest cost lever in production.' },
  { term: 'GPU-second',       emoji: '⏱️', def: 'One second of one GPU\'s time. ~$0.0006 on an H100 at 2026 market rates (~$2.16/hr blended across RunPod, TensorDock, Lambda, AWS).' },
  { term: 'World model',      emoji: '🌍', def: 'A model that predicts the next frame of an interactive environment given a user action — video you can play. Genie 3 and Oasis are the 2026 leaders.' },
  { term: 'Sparse attention', emoji: '🕸️', def: 'VideoNSA / DSA — using only ~3.6% of the attention budget on tokens that actually matter. ~10× faster long-context inference; the reason Kling and Runway Gen-4 beat Sora on wall time.' },
  { term: 'FBCache',          emoji: '♻️', def: 'First Block Cache — reuses computation across similar prompts in a batch. Part of the "juiced endpoint" stack that cuts Flux inference by 3–7×.' },
  { term: 'HBM',              emoji: '🧠', def: 'High-Bandwidth Memory — the fast VRAM on H100 (HBM3) and B200 (HBM3e) cards. Memory bandwidth is the bottleneck for diffusion and world models, not raw TFLOPs.' },
  { term: 'Subsidy trap',     emoji: '💸', def: 'When a product sells output below its true inference cost to buy growth (Sora\'s $20/mo plan, Suno\'s $10/mo). Sora\'s March 2026 shutdown made this the canonical example.' },
]

export function Glossary() {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        Glossary
      </div>
      <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-2">The vocabulary</h2>
      <p className="text-slate-600 mb-8 max-w-2xl">The vocabulary that keeps showing up. Skim once, refer back whenever.</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TERMS.map(({ term, def, emoji }) => (
          <div
            key={term}
            className="group rounded-2xl border border-slate-200 bg-white/70 p-5 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all"
          >
            <dt className="flex items-center gap-2.5 font-semibold text-slate-900">
              <span className="text-lg leading-none" aria-hidden>{emoji}</span>
              <span>{term}</span>
            </dt>
            <dd className="text-sm text-slate-600 mt-2 leading-relaxed">{def}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
