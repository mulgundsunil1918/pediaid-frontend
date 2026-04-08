// =============================================================================
// academics/search/components/SearchResultCard.tsx — Single search result card
// =============================================================================

import { Link } from 'react-router-dom';
import { BookOpen, Clock, Eye } from 'lucide-react';
import type { SearchResult } from '../hooks/useSearch';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips all HTML tags from a string EXCEPT <mark> and </mark>.
 * Used to safely render server-supplied highlighted snippets.
 */
function sanitizeSnippet(raw: string): string {
  // Temporarily replace allowed tags with placeholders
  const withPlaceholders = raw
    .replace(/<mark>/gi, '\x00MARK_OPEN\x00')
    .replace(/<\/mark>/gi, '\x00MARK_CLOSE\x00');

  // Strip all remaining HTML tags
  const stripped = withPlaceholders.replace(/<[^>]*>/g, '');

  // Restore allowed tags
  return stripped
    .replace(/\x00MARK_OPEN\x00/g, '<mark>')
    .replace(/\x00MARK_CLOSE\x00/g, '</mark>');
}

/** Returns two-letter initials from a full name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

/** Format ISO date string to readable form */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResultCard({ result }: SearchResultCardProps) {
  const sanitizedSnippet = result.snippet ? sanitizeSnippet(result.snippet) : null;

  return (
    <article className="group rounded-card border border-border bg-white shadow-card hover:shadow-card-hover transition-shadow duration-200 p-5">
      {/* Breadcrumb */}
      <p className="mb-2 text-xs text-ink-muted truncate">
        <span className="font-medium text-accent">{result.subjectCode}</span>
        <span className="mx-1.5 text-ink-muted">·</span>
        {result.systemName}
        <span className="mx-1.5 text-ink-muted">·</span>
        {result.topicName}
      </p>

      {/* Title */}
      <h3 className="mb-2 text-base font-semibold leading-snug">
        <Link
          to={`/academics/c/${result.slug}`}
          className="text-primary hover:text-accent transition-colors focus:outline-none focus-visible:underline"
        >
          {result.title}
        </Link>
      </h3>

      {/* Snippet — rendered with mark tags for highlights */}
      {sanitizedSnippet && (
        <p
          className="mb-3 text-sm text-ink-muted leading-relaxed line-clamp-3 [&_mark]:bg-yellow-100 [&_mark]:text-ink [&_mark]:rounded-sm [&_mark]:px-0.5"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sanitizedSnippet }}
        />
      )}

      {/* Author row */}
      <div className="mb-3 flex items-center gap-2">
        {/* Initials avatar */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold select-none"
          aria-hidden="true"
        >
          {getInitials(result.authorName)}
        </span>
        <span className="text-sm text-ink font-medium">{result.authorName}</span>
        {result.authorQualification && (
          <span className="text-xs text-ink-muted">
            — {result.authorQualification}
          </span>
        )}
      </div>

      {/* Footer metadata */}
      <footer className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        {/* Published date */}
        <span className="flex items-center gap-1">
          <BookOpen size={12} aria-hidden="true" />
          {formatDate(result.publishedAt)}
        </span>

        {/* Reading time */}
        <span className="flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          {result.readingTimeMinutes} min read
        </span>

        {/* View count */}
        <span className="flex items-center gap-1">
          <Eye size={12} aria-hidden="true" />
          {result.viewCount.toLocaleString()} views
        </span>
      </footer>
    </article>
  );
}
