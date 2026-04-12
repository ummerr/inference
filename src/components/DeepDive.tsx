import type { Modality } from '../modalities'

export function DeepDive({ modality }: { modality: Modality }) {
  return (
    <div className="mt-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Deep dive — the real story
      </div>
      <div className="space-y-2">
        {modality.deepDive.map(block => (
          <details
            key={block.title}
            className={`group rounded-2xl border ${modality.accent.border} bg-white/70 open:bg-white transition-colors`}
          >
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-900">{block.title}</span>
              <span className={`text-sm ${modality.accent.text} group-open:rotate-90 transition-transform`}>▸</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed">{block.body}</div>
          </details>
        ))}
      </div>
    </div>
  )
}
