type Term = {
  term: string
  emoji: string
  short: string
  metaphor?: string
  example?: string
  seeAlso?: string[]
}

type Group = { heading: string; blurb: string; terms: Term[] }

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const GROUPS: Group[] = [
  {
    heading: 'Core math',
    blurb: 'The raw ingredients — what a GPU is actually doing when you hit "generate".',
    terms: [
      {
        term: 'FLOPs',
        emoji: '🧮',
        short: 'Floating-point operations — the basic unit of neural-network math.',
        metaphor: 'Like counting single keystrokes on a calculator. A modern image model does trillions of them per picture.',
        example: 'An H100 does ~1,000 TFLOP/s (FP8). A 30-step Flux image ≈ 15 TFLOPs → ~15 ms of pure math, if nothing else got in the way.',
        seeAlso: ['HBM', 'Quantization'],
      },
      {
        term: 'Attention',
        emoji: '👀',
        short: 'The mechanism that lets every token or patch "look at" every other one. Its cost grows quadratically — O(n²).',
        metaphor: 'Every word in a sentence shakes hands with every other word. Double the sentence → quadruple the handshakes.',
        example: 'A 1M-token context with dense attention would take ~1,000× longer than 32k. This is why long-context models cheat with sparse attention.',
        seeAlso: ['Sparse attention', 'KV cache', 'Context window'],
      },
      {
        term: 'Quantization',
        emoji: '🔢',
        short: 'Storing weights in fewer bits (FP16 → FP8 → INT4) to fit bigger models in less memory and run faster.',
        metaphor: 'Like JPEG for model weights. You lose a tiny bit of fidelity; you gain 2–4× throughput.',
        example: 'Llama-3 70B at FP16 needs 140 GB; at INT4 it fits in ~35 GB — runs on one consumer GPU instead of four.',
        seeAlso: ['HBM', 'FLOPs'],
      },
      {
        term: 'MoE',
        emoji: '🧩',
        short: 'Mixture of Experts — the model has many "expert" sub-networks and routes each token to only a few of them.',
        metaphor: 'A hospital with 64 specialists. Each patient sees 2, not all 64. Total staff is huge, cost-per-visit stays sane.',
        example: 'DeepSeek-V3: 671B total parameters, only ~37B active per token. You get the knowledge of a huge model at the cost of a small one.',
        seeAlso: ['FLOPs', 'Inference'],
      },
    ],
  },
  {
    heading: 'How models generate',
    blurb: 'The shape of the generation loop determines almost everything about cost.',
    terms: [
      {
        term: 'Inference',
        emoji: '⚡',
        short: 'Running a trained model to produce an output. The part you pay for every time.',
        metaphor: 'Training is writing the cookbook (once, expensively). Inference is cooking a meal — every single plate.',
        example: 'GPT-4 cost ~$100M to train; it costs pennies per response at inference. The pennies are what add up.',
        seeAlso: ['GPU-second', 'Batching'],
      },
      {
        term: 'Token',
        emoji: '🔤',
        short: 'The unit an LLM reads and writes — roughly ¾ of an English word, or one BPE subword.',
        metaphor: 'Like syllables for the model. "unbelievable" might be 3 tokens: "un", "believ", "able".',
        example: 'This paragraph is ~35 tokens. GPT-4o charges per 1M of them — roughly 750k words of English.',
        seeAlso: ['Context window', 'Autoregressive'],
      },
      {
        term: 'Autoregressive',
        emoji: '➡️',
        short: 'Generating one piece at a time, each conditioned on the last. LLMs and most audio models work this way.',
        metaphor: 'Writing a sentence by picking one word, then the next based on what you just wrote — you can\'t skip ahead.',
        example: 'A 500-token reply = 500 sequential forward passes. Hard to parallelise within one request; the reason TTFT and throughput are different metrics.',
        seeAlso: ['Token', 'KV cache', 'Batching'],
      },
      {
        term: 'Context window',
        emoji: '📜',
        short: 'The maximum number of tokens a model can attend to at once — everything it "remembers" for this request.',
        metaphor: 'The model\'s desk. Anything off the desk doesn\'t exist. A bigger desk costs more to keep tidy (see attention).',
        example: 'Gemini 2.5 Pro: 2M-token window. A full novel fits; a full codebase often does not.',
        seeAlso: ['Attention', 'KV cache'],
      },
      {
        term: 'KV cache',
        emoji: '🗃️',
        short: 'The per-token key/value tensors the model keeps around so it doesn\'t recompute attention over the whole prompt each step.',
        metaphor: 'Your working notes. Without them, every new word forces you to reread the whole essay from the start.',
        example: 'For a 70B model at 32k context, the KV cache is ~20 GB per request. It\'s why long contexts eat VRAM even when the prompt is cheap to compute.',
        seeAlso: ['Attention', 'HBM', 'Autoregressive'],
      },
      {
        term: 'Diffusion',
        emoji: '🌫️',
        short: 'A model family that generates data by iteratively removing noise from random static. Powers most image and video models.',
        metaphor: 'Sculpting. You start with a block of noise and chip away until a picture emerges.',
        example: 'Flux.1: start with 128×128 of noise, denoise 30 times, decode to 1024×1024. Each denoise step is a full forward pass.',
        seeAlso: ['Denoising step', 'Latent space', 'CFG / guidance'],
      },
      {
        term: 'Denoising step',
        emoji: '🪄',
        short: 'One pass of the diffusion model that makes the noise slightly less noisy.',
        metaphor: 'One chisel strike. Modern models take 1–50 strikes per image; distilled "turbo" variants can do 1–4.',
        example: 'SDXL-Turbo hits usable quality in 1 step (~40 ms). SDXL-base wants 30+ steps (~1.2 s). Same model family, 30× the wall time.',
        seeAlso: ['Diffusion', 'CFG / guidance'],
      },
      {
        term: 'CFG / guidance',
        emoji: '🎯',
        short: 'Classifier-free guidance — run the model twice per step (once with your prompt, once without) and extrapolate toward the prompt.',
        metaphor: 'Steering by contrast. "Show me what this becomes with the prompt minus without" pulls the image harder toward your words.',
        example: 'Roughly doubles per-step cost. Every image model silently charges you for this unless it\'s been CFG-distilled.',
        seeAlso: ['Denoising step', 'Diffusion'],
      },
      {
        term: 'Latent space',
        emoji: '🗜️',
        short: 'A compressed representation (e.g. 128×128 instead of 1024×1024) that the model operates in to save compute.',
        metaphor: 'Editing a RAW file as a thumbnail, then upscaling at the end. You get 64× less pixels to push around.',
        example: 'Stable Diffusion\'s VAE: 1024×1024×3 image ↔ 128×128×4 latent. The diffusion model never sees a single real pixel.',
        seeAlso: ['Diffusion'],
      },
      {
        term: 'Vocoder',
        emoji: '🔊',
        short: 'A neural network that turns abstract audio tokens (or mel-spectrograms) into actual waveform samples.',
        metaphor: 'The last-mile printer. The main model writes the score; the vocoder actually makes the sound waves.',
        example: 'In a TTS pipeline, the LLM spends ~10% of compute; the vocoder spends the other 90%. Optimising it matters most.',
        seeAlso: ['Autoregressive'],
      },
      {
        term: 'World model',
        emoji: '🌍',
        short: 'A model that predicts the next frame of an interactive environment given a user action — video you can play.',
        metaphor: 'A dream engine. You press "left" and the model hallucinates what "left" should look like, 30 times per second.',
        example: 'Genie 3 and Oasis (2026 leaders) run at 30 fps on a single H100 for a 720p stream. Each frame is conditioned on your last input.',
        seeAlso: ['Autoregressive', 'HBM'],
      },
    ],
  },
  {
    heading: 'Making it cheap',
    blurb: 'The tricks that turn "this would bankrupt us" into "ship it".',
    terms: [
      {
        term: 'Batching',
        emoji: '📦',
        short: 'Running many requests through a GPU together so fixed overhead is shared. The single biggest cost lever in production.',
        metaphor: 'A pizza oven. One pizza or twelve, the oven still has to heat up. Twelve is twelve times cheaper per slice.',
        example: 'Batch size 1 on an H100 might hit 50 tok/s. Batch 32 can hit 1,500 tok/s — 30× the throughput for ~1.5× the latency.',
        seeAlso: ['Inference', 'GPU-second'],
      },
      {
        term: 'Sparse attention',
        emoji: '🕸️',
        short: 'Only computing attention over tokens that actually matter (e.g. VideoNSA / DSA use ~3.6% of the budget).',
        metaphor: 'Instead of every word shaking every other word\'s hand, only shake hands that matter. Quadratic becomes near-linear.',
        example: '~10× faster long-context inference. The reason Kling and Runway Gen-4 beat Sora on wall time for the same clip length.',
        seeAlso: ['Attention', 'Context window'],
      },
      {
        term: 'FBCache',
        emoji: '♻️',
        short: 'First Block Cache — reuses early-layer activations across similar prompts in a batch.',
        metaphor: 'If ten customers all order the same base dough, make it once. Only customise the toppings per order.',
        example: 'Part of the "juiced endpoint" stack (fp8 + torch.compile + FBCache) that cuts Flux inference cost by 3–7×.',
        seeAlso: ['Batching', 'Diffusion'],
      },
      {
        term: 'HBM',
        emoji: '🧠',
        short: 'High-Bandwidth Memory — the fast VRAM on H100 (HBM3) and B200 (HBM3e). Usually the real bottleneck.',
        metaphor: 'The GPU\'s compute is a race car; HBM bandwidth is the fuel line. You can\'t burn gas faster than it flows.',
        example: 'H100: 3.35 TB/s HBM. A diffusion step moves ~15 GB; that\'s ~4.5 ms minimum, regardless of how fast the math is.',
        seeAlso: ['FLOPs', 'KV cache'],
      },
      {
        term: 'GPU-second',
        emoji: '⏱️',
        short: 'One second of one GPU\'s time — the universal unit of inference cost.',
        metaphor: 'Like cloud kWh. Everything you do eventually converts into this, whether the API bills you that way or not.',
        example: '~$0.0006 on an H100 at 2026 market rates (~$2.16/hr blended across RunPod, TensorDock, Lambda, AWS).',
        seeAlso: ['Inference', 'Batching'],
      },
    ],
  },
  {
    heading: 'Economics',
    blurb: 'Vocabulary for reading between the lines of a pricing page.',
    terms: [
      {
        term: 'Subsidy trap',
        emoji: '💸',
        short: 'Selling output below its true inference cost to buy growth, then being unable to raise prices without losing users.',
        metaphor: 'The MoviePass problem. Great deal until the math catches up, and by then you\'ve trained users to expect it.',
        example: 'Sora\'s $20/mo plan, Suno\'s $10/mo. Sora\'s March 2026 shutdown made this the canonical cautionary tale.',
        seeAlso: ['Inference', 'GPU-second'],
      },
    ],
  },
]

const ALL_TERMS = GROUPS.flatMap((g) => g.terms)

function Card({ t }: { t: Term }) {
  return (
    <div
      id={slug(t.term)}
      className="group scroll-mt-24 self-start rounded-2xl border border-slate-200 bg-white/70 p-5 target:border-amber-400 target:ring-2 target:ring-amber-300/50 target:shadow-lg hover:bg-white hover:border-slate-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2.5 font-semibold text-slate-900">
        <span className="text-lg leading-none" aria-hidden>{t.emoji}</span>
        <span>{t.term}</span>
      </div>
      <p className="text-sm text-slate-700 mt-2 leading-relaxed">{t.short}</p>
      {(t.metaphor || t.example) && (
        <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
          {t.metaphor && (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="mr-1.5" aria-hidden>💡</span>
              <span className="font-medium text-slate-700">Like:</span> {t.metaphor}
            </p>
          )}
          {t.example && (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="mr-1.5" aria-hidden>📐</span>
              <span className="font-medium text-slate-700">In practice:</span> {t.example}
            </p>
          )}
        </div>
      )}
      {t.seeAlso && t.seeAlso.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {t.seeAlso.map((s) => (
            <a
              key={s}
              href={`#${slug(s)}`}
              className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              {s}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function Glossary() {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        Glossary
      </div>
      <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-3">The vocabulary, with pictures</h2>
      <p className="text-slate-600 mb-10 max-w-2xl leading-relaxed">
        Most inference economics reduces to three questions: how much math per output, how well you
        can batch it, and who’s subsidising the bill. Here’s the vocabulary — and the mental
        pictures that make it stick. {ALL_TERMS.length} terms, grouped so you can skim.
      </p>

      <div className="space-y-12">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <div className="mb-5">
              <h3 className="font-display text-xl text-slate-900">{g.heading}</h3>
              <p className="text-sm text-slate-500 mt-1">{g.blurb}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {g.terms.map((t) => (
                <Card key={t.term} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
