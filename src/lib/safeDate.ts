// =============================================================================
// lib/safeDate.ts
//
// Dates that survive bad input.
//
// `new Date(undefined)` and `new Date(null)` produce an Invalid Date, which
// renders as the literal string "Invalid Date" and makes date arithmetic
// return NaN — the same failure mode that produced "NaNd ago" in the audit log
// and a crash on the Credentials page. API timestamps are nullable far more
// often than the TypeScript interfaces admit (a column that no migration ever
// created reads as undefined, not as a compile error), so parsing has to be
// defensive at the point of use.
//
// Same idea as safeNumber.ts: one helper, used everywhere, so a missing field
// degrades to a dash instead of taking down the screen.
// =============================================================================

/** Parses to a Date only if the result is actually valid. */
function parse(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formatted date, or `fallback` when the value is missing or unparseable. */
export function safeDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  fallback = '—',
): string {
  const d = parse(value);
  if (!d) return fallback;
  return d.toLocaleDateString('en-IN', options);
}

/** Whole days since `value`, or `null` when it can't be determined. */
export function safeDaysAgo(value: unknown): number | null {
  const d = parse(value);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** "today" / "3 days ago" / `fallback` — the phrasing used on admin cards. */
export function safeAgo(value: unknown, fallback = 'date unknown'): string {
  const days = safeDaysAgo(value);
  if (days === null || days < 0) return fallback;
  if (days === 0) return 'today';
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
