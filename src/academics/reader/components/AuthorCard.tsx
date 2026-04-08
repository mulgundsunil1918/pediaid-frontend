// =============================================================================
// reader/components/AuthorCard.tsx
// =============================================================================

import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { VerifiedBadge } from '../../browse/components/VerifiedBadge';
import type { ReaderAuthor } from '../hooks/useChapterReader';

// ---------------------------------------------------------------------------
// Initials avatar fallback
// ---------------------------------------------------------------------------

function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className="rounded-full flex items-center justify-center
                 bg-primary text-white font-bold font-sans shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single author row
// ---------------------------------------------------------------------------

function AuthorRow({ author, isPrimary }: { author: ReaderAuthor; isPrimary: boolean }) {
  const nameLine = [author.fullName, author.qualification]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <Link
        to={`/academics/authors/${author.id}`}
        aria-label={`View ${author.fullName}'s profile`}
        tabIndex={isPrimary ? 0 : -1}
      >
        {author.profileImageUrl ? (
          <img
            src={author.profileImageUrl}
            alt={author.fullName}
            className="rounded-full object-cover shrink-0"
            style={{ width: isPrimary ? 56 : 36, height: isPrimary ? 56 : 36 }}
          />
        ) : (
          <InitialsAvatar name={author.fullName} size={isPrimary ? 56 : 36} />
        )}
      </Link>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/academics/authors/${author.id}`}
            className="font-semibold text-primary hover:underline
                       transition-colors text-sm leading-snug"
          >
            {nameLine}
          </Link>
          <VerifiedBadge credentialsVerified={author.credentialsVerified} />
        </div>

        {author.specialty && (
          <p className="text-xs text-ink-muted mt-0.5">{author.specialty}</p>
        )}
        {author.institution && (
          <p className="text-xs text-ink-muted">{author.institution}</p>
        )}

        {/* ORCID */}
        {author.orcidId && (
          <a
            href={`https://orcid.org/${author.orcidId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent
                       hover:underline mt-0.5"
          >
            <ExternalLink size={10} aria-hidden="true" />
            ORCID: {author.orcidId}
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AuthorCard
// ---------------------------------------------------------------------------

interface AuthorCardProps {
  author: ReaderAuthor;
  coAuthorProfiles?: ReaderAuthor[];
}

export function AuthorCard({ author, coAuthorProfiles = [] }: AuthorCardProps) {
  return (
    <div
      className="border border-border rounded-card p-4 bg-white space-y-3"
      aria-label="Author information"
    >
      <AuthorRow author={author} isPrimary />

      {coAuthorProfiles.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wide">
            Co-authored with
          </p>
          <div className="space-y-2">
            {coAuthorProfiles.map((co) => (
              <AuthorRow key={co.id} author={co} isPrimary={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
