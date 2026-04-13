export function Hardware() {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-200/60">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">
        The meter underneath
      </div>
      <h2 className="font-display text-4xl sm:text-5xl text-slate-900 leading-tight max-w-3xl">
        Every price on this page is really <em>GPU-seconds</em> in a costume.
      </h2>
      <div className="mt-6 max-w-2xl text-slate-700 leading-relaxed space-y-4">
        <p>
          Vertex quotes you a flat price per image or per second of video. Underneath, Google is
          renting you a sliver of an accelerator for the time it takes to run the model forward,
          then marking it up. Knowing what that sliver costs on the open market is the fastest way
          to tell which list prices are cheap, fair, or a margin play.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
        <Chip
          tag="Workhorse"
          name="NVIDIA H100"
          price="$2.16/hr"
          body="The blended on-demand rate across RunPod ($1.99), TensorDock ($2.25), Lambda ($2.99), and AWS ($3.93). 80 GB HBM3, ~1,000 TFLOP/s FP8. This is the anchor every number on this page ties back to."
        />
        <Chip
          tag="Successor"
          name="NVIDIA B200"
          price="$5.49–6.69/hr"
          body="Blackwell. ~2.5× the throughput of an H100 for ~3× the price — so cost-per-token is similar, but you rent it in larger chunks. Still rare on spot markets in April 2026; most workloads here still price on H100."
        />
        <Chip
          tag="Google's path"
          name="TPU v5p / Trillium"
          price="not rented retail"
          body="Veo, Imagen, Lyria, and Gemini all run on TPUs inside Google's own datacenters. You never see a per-hour TPU price — it's folded into the per-image or per-second list price. That vertical integration is part of why Vertex prices track (or undercut) H100 math."
        />
      </div>

      <p className="mt-8 max-w-3xl text-sm text-slate-600 leading-relaxed">
        Rule of thumb: if a Vertex list price divided by output time comes out to roughly{' '}
        <span className="font-mono text-slate-900">$2–4 / GPU-hour</span>, Google is selling you
        H100-class compute at close to market. Anything much higher is margin on a proprietary
        model; anything much lower means TPUs and scale are doing work for you.
      </p>
    </section>
  )
}

function Chip({ tag, name, price, body }: { tag: string; name: string; price: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/70 border border-slate-200 p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{tag}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3 flex-wrap">
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="font-mono text-sm text-slate-900 tabular-nums">{price}</div>
      </div>
      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</div>
    </div>
  )
}
