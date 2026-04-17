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
          once, by the lab that built it. After that, every picture, clip, or song the model generates
          is <strong>inference</strong>: renting a slice of a GPU for a few seconds and asking the finished model to produce one output.
        </p>
        <p>
          Every Gen Media cost, across every modality, is governed by three levers:
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <Lever
          tag="Compute"
          title="How much math per output"
          body="Bigger models do more math per piece of output. Higher resolution means more pixels to think about. And the more the model has to cross-reference (frame to frame, word to word), the more work each step takes."
        />
        <Lever
          tag="Time"
          title="How many steps or frames"
          body="An image takes about 25 passes through the model. A video clip adds hundreds of frames on top. A playable world generates a new frame every time you press a key. The output decides how many passes you pay for."
        />
        <Lever
          tag="Quality"
          title="How polished the result"
          body="More steps, bigger models, higher resolution, stronger prompt-following — each dial you turn up makes the picture better and the bill bigger. Every knob below is really one of these three."
        />
      </div>

      <div className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-6">
        <div className="flex items-baseline justify-end gap-4 flex-wrap">
          <a
            href="https://cloud.google.com/vertex-ai/generative-ai/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline"
          >
            Google Vertex AI list prices, April 2026 ↗
          </a>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
          <PriceRow
            label="Images · Nano Banana"
            prices={['$0.039', '$0.067', '$0.134']}
            note="per image · Gemini 2.5 / 3.1 Flash Image / 3 Pro Image"
          />
          <PriceRow
            label="Video · Veo 3.1"
            prices={['$0.05', '$0.10', '$0.40']}
            note="per second · Lite / Fast / Standard"
          />
          <PriceRow
            label="Music · Lyria 2"
            prices={['$0.06']}
            note="per 30s clip"
          />
          <PriceRow
            label="Voice · Gemini 3.1 Flash Live"
            prices={['$0.005', '$0.018']}
            note="per minute · input / output"
          />
        </dl>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          These won't forecast your exact bill, but the <em>shape</em> should match real invoices.
        </p>
      </div>
    </section>
  )
}

function PriceRow({ label, prices, note }: { label: string; prices: string[]; note: string }) {
  return (
    <>
      <dt className="text-slate-700 font-medium">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-slate-900 tabular-nums">
          {prices.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="text-slate-300 mx-1">/</span>}
              {p}
            </span>
          ))}
        </span>
        <span className="text-xs text-slate-500">{note}</span>
      </dd>
    </>
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
