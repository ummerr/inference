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
            <summary className="cursor-pointer list-none px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{block.title}</div>
                <div className="text-sm text-slate-500 mt-0.5 leading-snug">{block.hook}</div>
              </div>
              <span className={`text-sm ${modality.accent.text} group-open:rotate-90 transition-transform mt-1 shrink-0`}>▸</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed">
              {block.stat && (
                <div className={`float-right ml-4 mb-2 rounded-xl border ${modality.accent.border} ${modality.accent.bgSoft} px-4 py-3 text-center min-w-[7rem]`}>
                  <div className={`text-2xl font-semibold ${modality.accent.text} leading-none`}>{block.stat.value}</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-tight">{block.stat.label}</div>
                </div>
              )}
              {block.metaphor && (
                <div className={`inline-flex items-start gap-2 rounded-full ${modality.accent.bgSoft} ${modality.accent.text} px-3 py-1 text-xs italic mb-3`}>
                  <span aria-hidden>💡</span>
                  <span>{block.metaphor}</span>
                </div>
              )}
              {block.bullets && (
                <ul className="space-y-1.5 list-disc pl-5 marker:text-slate-400 mb-2">
                  {block.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              {block.body && <p className="mt-2">{block.body}</p>}
              {block.sources && block.sources.length > 0 && (
                <div className="clear-both pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Sources: </span>
                  {block.sources.map((s, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1">·</span>}
                      {s.href ? (
                        <a href={s.href} target="_blank" rel="noopener noreferrer" className={`${modality.accent.text} hover:underline`}>
                          {s.label}
                        </a>
                      ) : (
                        <span>{s.label}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
