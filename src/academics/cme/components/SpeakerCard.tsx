// =============================================================================
// academics/cme/components/SpeakerCard.tsx — speaker profile card
// =============================================================================

import { useState } from 'react';
import type { Speaker } from '../hooks/useCME';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SpeakerCardProps {
  speaker: Speaker;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showAvatar = speaker.avatarUrl && !imgError;

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-card shadow-card">
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden">
          {showAvatar ? (
            <img
              src={speaker.avatarUrl!}
              alt={speaker.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-white text-sm font-semibold select-none">
              {getInitials(speaker.name)}
            </div>
          )}
        </div>

        {/* Name / title / institution */}
        <div className="min-w-0">
          <p className="font-semibold text-ink leading-tight truncate">{speaker.name}</p>
          {speaker.title && (
            <p className="text-xs text-ink-muted truncate">{speaker.title}</p>
          )}
          {speaker.institution && (
            <p className="text-xs text-accent truncate">{speaker.institution}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {speaker.bio && (
        <div>
          <p
            className={`text-sm text-ink-muted leading-relaxed ${bioExpanded ? '' : 'line-clamp-2'}`}
          >
            {speaker.bio}
          </p>
          <button
            onClick={() => setBioExpanded((v) => !v)}
            className="mt-1 text-xs text-accent hover:underline focus:outline-none"
          >
            {bioExpanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}
    </div>
  );
}
