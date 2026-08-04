// =============================================================================
// lib/initials.ts
//
// One total implementation of "turn a name into initials".
//
// This existed as four near-identical copies across the admin pages, three of
// which typed the argument as a non-nullable `string` and called .split() on
// it directly. acad_profiles.full_name is nullable, so any user without a
// profile name crashed the whole page with
// "Cannot read properties of undefined (reading 'split')".
//
// TypeScript couldn't catch it because the API types claimed the field was
// always present. It isn't — so this accepts anything and always returns
// something renderable.
// =============================================================================

/**
 * Initials from a name, e.g. "Sunil Mulgund" -> "SM".
 * Returns `fallback` for null, undefined, empty or whitespace-only input.
 */
export function getInitials(
  name: string | null | undefined,
  fallback = '?',
): string {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;

  const initials = trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  return initials || fallback;
}
