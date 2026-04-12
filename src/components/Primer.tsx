export function Primer() {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        First, the basics
      </div>
      <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight max-w-3xl">
        Training is where models are <em>made</em>. Inference is where they <em>work</em>.
      </h2>
      <div className="mt-6 max-w-2xl text-slate-700 leading-relaxed space-y-4">
        <p className="text-lg">
          Training a frontier image or video model costs tens to hundreds of millions of dollars — paid
          once, by the lab that makes it. After that, every picture, clip, or song the model generates
          is <strong>inference</strong>: renting a slice of a GPU for a few seconds and running the model forward.
        </p>
        <p>
          Every Gen Media cost, across every modality, is governed by three levers:
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <Lever
          tag="Compute"
          title="How much math per output"
          body="Bigger models do more math per token / frame / step. Higher resolution = more pixels to think about. More attention layers = more cross-talk to compute."
        />
        <Lever
          tag="Time"
          title="How many steps or frames"
          body="Diffusion models take ~25 steps per image. Video adds hundreds of frames. World models generate every frame at runtime. The output determines the count."
        />
        <Lever
          tag="Quality"
          title="How polished the result"
          body="Guidance, higher step counts, bigger models, and higher resolution all raise quality — and all multiply cost. Every knob below is one of these three in disguise."
        />
      </div>

      <div className="mt-8 text-xs text-slate-500 max-w-2xl leading-relaxed">
        Numbers are calibrated against April 2026 market rates — H100 on-demand at
        ~$1.99–$3.93/hr (we use ~$2.16/hr blended), Flux 2 at $0.015–$0.055/image,
        Kling 3.0 Pro at $0.10/sec, ElevenLabs Scale at $0.003/sec. They won't
        forecast your exact bill, but the <em>shape</em> should match real invoices.
      </div>
    </section>
  )
}

function Lever({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/70 border border-slate-200 p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{tag}</div>
      <div className="font-semibold text-slate-900 mt-1">{title}</div>
      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</div>
    </div>
  )
}
