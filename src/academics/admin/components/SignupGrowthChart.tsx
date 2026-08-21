// =============================================================================
// academics/admin/components/SignupGrowthChart.tsx
//
// Account signups over time — cumulative curve with a new-per-bucket bar row.
//
// Hand-rolled SVG rather than a charting library: this is one chart, and
// recharts would add ~50 KB gzipped to a bundle that every admin page loads.
// If a second chart ever appears, that trade flips.
//
// The data is derived from acad_users.created_at, which has existed since the
// first migration, so the "All time" view really is all time — it did not
// start collecting the day this was written.
//
// It measures ACQUISITION, not engagement. last_login is overwritten on every
// login and no login history is kept, so "how many people were active in
// March" cannot be reconstructed. Deliberately not implied anywhere here.
// =============================================================================

import { useMemo, useRef, useState } from 'react';
import type { SignupPoint } from '../hooks/useAdmin';

export type Range = '7d' | '30d' | '12m' | 'all';

const RANGES: Array<{ key: Range; label: string }> = [
  { key: '7d', label: 'Week' },
  { key: '30d', label: 'Month' },
  { key: '12m', label: 'Year' },
  { key: 'all', label: 'All time' },
];

export interface Bucket {
  label: string;
  count: number;
  cumulative: number;
}

/** Inclusive day difference between two YYYY-MM-DD strings. */
function daysAgo(date: string, today: Date): number {
  const d = new Date(`${date}T00:00:00Z`);
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((t - d.getTime()) / 86_400_000);
}

export function bucketise(points: SignupPoint[], range: Range): Bucket[] {
  if (!points.length) return [];
  const today = new Date();

  // Everything before the window still counts toward the running total, so the
  // cumulative line shows the real number of accounts rather than restarting
  // from zero at the left edge of a short range.
  const cutoff = range === '7d' ? 7 : range === '30d' ? 30 : range === '12m' ? 365 : Infinity;

  let carried = 0;
  const inWindow: SignupPoint[] = [];
  for (const p of points) {
    if (daysAgo(p.date, today) > cutoff) carried += p.count;
    else inWindow.push(p);
  }

  // Bucket width chosen so the bar row stays readable: days for short ranges,
  // months once a year or more is in view.
  const byMonth = range === '12m' || range === 'all';
  const merged = new Map<string, number>();
  for (const p of inWindow) {
    const key = byMonth ? p.date.slice(0, 7) : p.date;
    merged.set(key, (merged.get(key) ?? 0) + p.count);
  }

  let running = carried;
  return [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      running += count;
      const d = new Date(`${byMonth ? `${key}-01` : key}T00:00:00Z`);
      return {
        label: byMonth
          ? d.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' })
          : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        count,
        cumulative: running,
      };
    });
}

export function SignupGrowthChart({ points }: { points: SignupPoint[] }) {
  const [range, setRange] = useState<Range>('all');
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const buckets = useMemo(() => bucketise(points, range), [points, range]);

  const total = points.reduce((n, p) => n + p.count, 0);
  const added = buckets.reduce((n, b) => n + b.count, 0);

  // viewBox coordinates; the SVG scales to its container via width="100%".
  const W = 720;
  const H = 200;
  const PAD = { top: 12, right: 8, bottom: 22, left: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxCum = Math.max(1, ...buckets.map((b) => b.cumulative));
  const maxNew = Math.max(1, ...buckets.map((b) => b.count));

  const x = (i: number) =>
    PAD.left + (buckets.length <= 1 ? plotW / 2 : (i / (buckets.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / maxCum) * plotH;

  // Nearest bucket to a viewport x, mapped through the SVG's own box so it
  // stays correct at any rendered width.
  const indexAt = (clientX: number): number | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || buckets.length === 0) return null;
    if (buckets.length === 1) return 0;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((svgX - PAD.left) / plotW) * (buckets.length - 1));
    return Math.min(buckets.length - 1, Math.max(0, i));
  };

  const active = hover !== null && hover >= 0 && hover < buckets.length ? hover : null;

  const line = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(b.cumulative).toFixed(1)}`).join(' ');
  const area = buckets.length
    ? `${line} L ${x(buckets.length - 1).toFixed(1)} ${PAD.top + plotH} L ${x(0).toFixed(1)} ${PAD.top + plotH} Z`
    : '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Account signups</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            People who created an Academics account. App installs are counted separately,
            in Play Console and App Store Connect.
          </p>
        </div>
        <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                range === r.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-6">
        <div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{total.toLocaleString()}</div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums text-emerald-600">
            {added > 0 ? '+' : ''}{added.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {range === 'all' ? 'All time' : `This ${RANGES.find((r) => r.key === range)!.label.toLowerCase()}`}
          </div>
        </div>
      </div>

      {buckets.length === 0 ? (
        <p className="mt-6 pb-4 text-center text-sm text-slate-400">No signups in this period.</p>
      ) : (
        <>
          {/* Hover readout.
              The first attempt used SVG <title> elements as siblings of the
              shapes, which does nothing useful: only the FIRST <title> child
              of an element is its tooltip, so all of them collapsed into one
              label for the entire chart. This tracks the pointer against the
              nearest bucket instead, and works on touch too. */}
          <div className="relative mt-3">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              role="img"
              aria-label={`Cumulative signups, ${total} total`}
              className="touch-none overflow-visible"
              onMouseLeave={() => setHover(null)}
              onMouseMove={(e) => setHover(indexAt(e.clientX))}
              onTouchStart={(e) => setHover(indexAt(e.touches[0]!.clientX))}
              onTouchMove={(e) => setHover(indexAt(e.touches[0]!.clientX))}
              onTouchEnd={() => setHover(null)}
            >
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3182ce" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#3182ce" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={PAD.left} x2={W - PAD.right}
                      y1={PAD.top + plotH - f * plotH} y2={PAD.top + plotH - f * plotH}
                      stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              ))}

              {area && <path d={area} fill="url(#signupFill)" />}
              <path d={line} fill="none" stroke="#3182ce" strokeWidth="2.25"
                    strokeLinejoin="round" strokeLinecap="round" />

              {active !== null && (
                <>
                  <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH}
                        stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x(active)} cy={y(buckets[active]!.cumulative)} r="4.5"
                          fill="#fff" stroke="#3182ce" strokeWidth="2.5" />
                </>
              )}

              {/* Endpoint marker hides while hovering so two dots never overlap. */}
              {active === null && buckets.length > 0 && (
                <circle cx={x(buckets.length - 1)} cy={y(buckets[buckets.length - 1]!.cumulative)}
                        r="3.5" fill="#fff" stroke="#3182ce" strokeWidth="2.25" />
              )}

              {/* Full-height catcher: a 2px line is far too thin to aim at. */}
              <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="transparent" />
            </svg>

            {active !== null && (
              <div
                className="pointer-events-none absolute top-0 z-10 rounded-lg bg-slate-900 px-2.5 py-1.5 text-center shadow-lg"
                style={{
                  left: `${(x(active) / W) * 100}%`,
                  // Nudge in at the edges so the card never spills outside.
                  transform: `translateX(${
                    x(active) / W < 0.12 ? '-8%' : x(active) / W > 0.88 ? '-92%' : '-50%'
                  })`,
                }}
              >
                <div className="text-[11px] font-medium text-slate-300">{buckets[active]!.label}</div>
                <div className="text-sm font-bold tabular-nums text-white">
                  {buckets[active]!.cumulative.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold tabular-nums text-emerald-400">
                  +{buckets[active]!.count.toLocaleString()} new
                </div>
              </div>
            )}
          </div>

          <div className="mt-1 flex items-end gap-[2px]" style={{ height: 34 }}>
            {buckets.map((b, i) => (
              <div
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className={`min-w-[2px] flex-1 rounded-t-sm transition ${
                  active === i ? 'bg-blue-500' : 'bg-slate-300 hover:bg-blue-400'
                }`}
                style={{ height: `${Math.max(2, (b.count / maxNew) * 34)}px` }}
              />
            ))}
          </div>

          <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400">
            <span>{buckets[0]!.label}</span>
            <span>{buckets[buckets.length - 1]!.label}</span>
          </div>
        </>
      )}
    </div>
  );
}
