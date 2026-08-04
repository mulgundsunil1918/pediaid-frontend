// =============================================================================
// lib/safeNumber.ts
//
// Formatting helpers that cannot throw on missing data.
//
// Calling `.toFixed()` directly on a value from an API response is a crash
// waiting to happen: the moment a field is absent, null, or the endpoint's
// shape drifts, the whole page unmounts with
// "Cannot read properties of undefined (reading 'toFixed')" — which is
// exactly what took out the admin Overview.
//
// A missing number should render as a dash, not destroy the screen around it.
// =============================================================================

/**
 * Formats a number to a fixed number of decimals, tolerating undefined,
 * null and NaN.
 *
 * @param value    the possibly-missing number
 * @param digits   decimal places (default 1)
 * @param fallback rendered when there is no usable number (default '—')
 */
export function safeFixed(
  value: number | null | undefined,
  digits = 1,
  fallback = '—',
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value.toFixed(digits);
}

/**
 * Compact display for large counts (1.2k, 3.4M), tolerating missing values.
 */
export function safeCompact(
  value: number | null | undefined,
  fallback = '—',
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}
