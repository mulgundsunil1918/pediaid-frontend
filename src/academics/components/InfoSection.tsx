// =============================================================================
// academics/components/InfoSection.tsx
//
// Colour-coded content sections for the reading pages (trial reviews and
// guideline notes). One tone per kind of information, held constant across
// pages, so the colour itself carries meaning: blue asks, green reports,
// amber warns, violet advises, slate points elsewhere. A reader who has seen
// one review can skim the next one by colour alone.
//
// Tints are deliberately pale with dark headers — this is clinical reading
// material, not a dashboard. The colour lives in the frame, never the body
// text.
// =============================================================================

import type { LucideIcon } from 'lucide-react';

export interface Tone {
  bg: string;
  border: string;
  heading: string;
  dot: string;
}

export const TONES = {
  /** Questions, methods, what changed — framing. */
  blue:   { bg: '#EFF6FF', border: '#BFDBFE', heading: '#1D4ED8', dot: '#3B82F6' },
  /** Findings and key points — the substance. */
  green:  { bg: '#F0FDF4', border: '#BBF7D0', heading: '#15803D', dot: '#22C55E' },
  /** Weaknesses and caveats — read before acting. */
  amber:  { bg: '#FFFBEB', border: '#FDE68A', heading: '#B45309', dot: '#F59E0B' },
  /** Takeaways — what to do differently. */
  violet: { bg: '#F5F3FF', border: '#DDD6FE', heading: '#6D28D9', dot: '#8B5CF6' },
  /** Pointers out — further reading, sources. */
  slate:  { bg: '#F8FAFC', border: '#E2E8F0', heading: '#334155', dot: '#64748B' },
} satisfies Record<string, Tone>;

export function InfoSection({
  tone,
  icon: Icon,
  title,
  items,
}: {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <section
      className="mb-4 rounded-2xl border p-4 sm:p-5"
      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
    >
      <h2
        className="flex items-center gap-2 text-[13px] font-bold uppercase
                   tracking-wide mb-3"
        style={{ color: tone.heading }}
      >
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center
                     flex-shrink-0 bg-white/70"
        >
          <Icon size={14} />
        </span>
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-ink leading-relaxed">
            <span
              className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tone.dot }}
            />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
