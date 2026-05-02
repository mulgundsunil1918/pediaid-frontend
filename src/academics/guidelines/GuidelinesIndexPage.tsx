// =============================================================================
// academics/guidelines/GuidelinesIndexPage.tsx — /academics/guidelines
// Hub listing every guideline set in the registry.
// =============================================================================

import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Lock } from 'lucide-react';
import { GUIDELINE_SETS } from './registry';

export function GuidelinesIndexPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                       bg-primary/10 border border-primary/20 text-primary
                       text-[11px] font-bold tracking-wider uppercase mb-4"
          >
            <BookOpen size={12} /> PediAid Academics
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary
                         leading-tight tracking-tight">
            Standard Treatment Guidelines
          </h1>
          <p className="text-ink-muted text-sm md:text-base mt-2 max-w-2xl">
            Published consensus and clinical practice guidelines from leading
            paediatric bodies, indexed and searchable. Open any chapter to read
            the original PDF inline.
          </p>
        </div>

        {/* Guideline-set tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GUIDELINE_SETS.map((g) => {
            const isLive = g.status === 'live';
            const inner = (
              <div
                className={[
                  'group relative rounded-2xl bg-card border border-border',
                  'p-6 shadow-card transition-all duration-200',
                  isLive
                    ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer'
                    : 'opacity-65 cursor-not-allowed',
                ].join(' ')}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center
                               justify-center text-white"
                    style={{ backgroundColor: g.color }}
                  >
                    <BookOpen size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-lg font-bold text-primary leading-snug">
                        {g.name}
                      </h2>
                      {g.year && (
                        <span
                          className="text-[10px] font-bold tracking-wider
                                     uppercase px-2 py-0.5 rounded-full
                                     text-white"
                          style={{ backgroundColor: g.color }}
                        >
                          {g.year}
                        </span>
                      )}
                      {!isLive && (
                        <span className="text-[10px] font-bold tracking-wider
                                         uppercase px-2 py-0.5 rounded-full
                                         bg-gray-200 text-gray-600">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted font-medium mb-3">
                      {g.fullName} · {g.publisher}
                    </p>
                    <p className="text-sm text-ink leading-relaxed">
                      {g.description}
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    {isLive ? (
                      <ChevronRight
                        size={20}
                        className="text-ink-muted group-hover:text-primary
                                   transition-colors"
                      />
                    ) : (
                      <Lock size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            );

            return isLive ? (
              <Link key={g.slug} to={`/academics/guidelines/${g.slug}`}>
                {inner}
              </Link>
            ) : (
              <div key={g.slug}>{inner}</div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 px-5 py-4 rounded-xl bg-warning/10 border
                        border-warning/30 text-[12px] text-ink leading-relaxed
                        italic">
          <strong className="not-italic font-semibold">For qualified
          clinicians.</strong> These guidelines are clinical aids only.
          Recommendations must be verified against the patient's clinical
          context, the source publication and your local protocols before any
          treatment decision is made.
        </div>
      </div>
    </div>
  );
}
