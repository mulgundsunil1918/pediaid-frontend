// =============================================================================
// academics/cme/lib/phase.ts
//
// Where an event is in time, and the order the CME list shows events in.
//
// The pages used to key off `event.status === 'upcoming' | 'ongoing' |
// 'completed'`. The API never sends those - `status` is the moderation state
// ('published') - so no card ever showed a state, the Upcoming / Ongoing /
// Completed tabs filtered nothing, and a conference that ended in April still
// offered "Register Now" in October. Whether an event is over is a matter of
// its dates, so that is what this reads. (The app's CME screen follows the same
// rules: lib/screens/cme/cme_schedule.dart.)
//
//   * FINISHED once the end time has passed; ONGOING between start and end;
//     UPCOMING before it starts.
//   * Events still to come always sit above finished ones, in either direction.
//   * Within each group: by start time, soonest first by default ("current to
//     future") or latest first.
// =============================================================================

import type { CMEEvent } from '../hooks/useCME';

export type EventPhase = 'upcoming' | 'ongoing' | 'finished';

type Timed = Pick<CMEEvent, 'startsAt' | 'endsAt'>;

const ms = (iso: string): number => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** An end before the start (a bad hand-typed form) means "ends when it starts". */
const endOf = (e: Timed): number => Math.max(ms(e.startsAt), ms(e.endsAt));

export function eventPhase(e: Timed, now: number = Date.now()): EventPhase {
  if (now < ms(e.startsAt)) return 'upcoming';
  if (now > endOf(e)) return 'finished';
  return 'ongoing';
}

export const isFinished = (e: Timed, now: number = Date.now()): boolean =>
  eventPhase(e, now) === 'finished';

/**
 * A new array in display order. `ascending` true = soonest first.
 * Ends in tie-breaks that cannot tie (the id), so the order never shuffles.
 */
export function sortEvents<T extends Timed & Pick<CMEEvent, 'id' | 'title'>>(
  events: readonly T[],
  ascending: boolean,
  now: number = Date.now(),
): T[] {
  const dir = ascending ? 1 : -1;
  return [...events].sort((a, b) => {
    const aDone = isFinished(a, now);
    const bDone = isFinished(b, now);
    if (aDone !== bDone) return aDone ? 1 : -1; // finished always below

    const byStart = (ms(a.startsAt) - ms(b.startsAt)) * dir;
    if (byStart !== 0) return byStart;
    const byEnd = (ms(a.endsAt) - ms(b.endsAt)) * dir;
    if (byEnd !== 0) return byEnd;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || a.id.localeCompare(b.id);
  });
}

/** "Ended 5 Apr 2026" - the day it finished, on the viewer's clock. */
export function endedLabel(e: Timed): string {
  return `Ended ${new Date(endOf(e)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
