const TERMS: { term: string; def: string }[] = [
  { term: 'Inference',         def: 'Running a trained model to produce an output. The part you pay for every time.' },
  { term: 'FLOPs',             def: 'Floating-point operations — the basic unit of neural-network math. Bigger model = more FLOPs per output.' },
  { term: 'Diffusion',         def: 'A model family that generates data by iteratively removing noise from random static. Used for most image/video models.' },
  { term: 'Denoising step',    def: 'One pass of the diffusion model that makes the noise slightly less noisy. Modern models need 1–50 of these per image.' },
  { term: 'CFG / guidance',    def: 'Classifier-free guidance — a trick that doubles per-step cost to dramatically improve prompt-following.' },
  { term: 'Latent space',      def: 'A compressed representation (e.g. 128×128 instead of 1024×1024) that models work in to save compute.' },
  { term: 'Attention',         def: 'The mechanism that lets every token / patch / frame "look at" every other one. Its cost grows quadratically (O(n²)).' },
  { term: 'Autoregressive',    def: 'Generating one piece at a time, each conditioned on the last. Audio and LLMs mostly work this way; it resists batching.' },
  { term: 'Vocoder',           def: 'A neural network that turns abstract audio tokens into actual waveform samples.' },
  { term: 'Batching',          def: 'Running many requests through a GPU together to amortize fixed costs. The single biggest cost lever in production.' },
  { term: 'GPU-second',        def: 'One second of one GPU\'s time. ~$0.0008 at modern cloud rates for an H100-class chip.' },
  { term: 'World model',       def: 'A model that predicts the next frame of an interactive environment given a user action — video you can play.' },
]

export function Glossary() {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        Glossary
      </div>
      <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-8">The vocabulary</h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
        {TERMS.map(({ term, def }) => (
          <div key={term}>
            <dt className="font-semibold text-slate-900">{term}</dt>
            <dd className="text-sm text-slate-600 mt-1 leading-relaxed">{def}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
