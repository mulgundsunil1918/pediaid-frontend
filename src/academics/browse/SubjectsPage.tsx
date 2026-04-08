// =============================================================================
// browse/SubjectsPage.tsx — /academics
// =============================================================================

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, ChevronRight, Clock, Users } from 'lucide-react';
import { useSubjects } from './hooks/useBrowse';
import { SkeletonGrid } from './SkeletonCard';
import type { Subject } from '../types';
import { useAuthStore } from '../../store/authStore';
import { API_BASE } from '../../lib/apiBase';
import { RoleRequestModal } from '../auth/RoleRequestModal';

// ---------------------------------------------------------------------------
// SubjectCard
// ---------------------------------------------------------------------------

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      to={`/academics/subjects/${subject.id}`}
      className="acad-card p-6 flex flex-col gap-3 group cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label={`Browse ${subject.name}`}
    >
      {/* Code badge */}
      <span
        className="self-start acad-badge text-white"
        style={{ backgroundColor: '#3182ce' }}
      >
        {subject.code}
      </span>

      {/* Name */}
      <h2 className="font-sans font-semibold text-lg text-primary leading-snug">
        {subject.name}
      </h2>

      {/* Description — 2 lines max */}
      {subject.description && (
        <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
          {subject.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-ink-muted font-medium">
          {subject.systemCount ?? 0}{' '}
          {subject.systemCount === 1 ? 'system' : 'systems'}
        </span>
        <ChevronRight
          size={16}
          className="text-ink-muted group-hover:text-accent
                     group-hover:translate-x-0.5 transition-all"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
                    py-20 text-center">
      <BookOpen size={48} className="text-border mb-4" aria-hidden="true" />
      <p className="text-ink font-medium text-lg mb-1">No subjects yet</p>
      <p className="text-ink-muted text-sm max-w-sm">
        Content is being set up. Check back soon.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-card border border-red-200
                    bg-red-50 p-6 text-center">
      <p className="text-danger font-medium">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending role-request shape (subset of what the API returns)
// ---------------------------------------------------------------------------

interface RoleRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ---------------------------------------------------------------------------
// Hook: check whether the authenticated user has any pending role requests
// ---------------------------------------------------------------------------

function useHasPendingRoleRequest(authenticated: boolean): {
  hasPending: boolean;
  isLoading: boolean;
} {
  const [hasPending, setHasPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    setIsLoading(true);

    const token = useAuthStore.getState().accessToken;

    fetch(`${API_BASE}/api/academics/dashboard/my-role-requests`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : Promise.resolve([])))
      .then((data: RoleRequest[]) => {
        if (!cancelled) {
          setHasPending(Array.isArray(data) && data.some((r) => r.status === 'pending'));
        }
      })
      .catch(() => {
        if (!cancelled) setHasPending(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  return { hasPending, isLoading };
}

// ---------------------------------------------------------------------------
// JoinBanner — shown for authenticated readers (or non-privileged users)
// ---------------------------------------------------------------------------

interface JoinBannerProps {
  hasPending: boolean;
  isPendingLoading: boolean;
  onOpenModal: () => void;
}

function JoinBanner({ hasPending, isPendingLoading, onOpenModal }: JoinBannerProps) {
  if (isPendingLoading) return null;

  if (hasPending) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl border
                   border-amber-200 bg-amber-50 mb-6"
        role="status"
      >
        <Clock size={18} className="text-amber-600 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium text-amber-800">
          Role request pending review — we'll notify you by email.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                 px-5 py-4 rounded-xl border mb-6"
      style={{ borderColor: '#93c5fd', backgroundColor: '#eff6ff' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Users size={18} className="text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">
            Contribute to PediAid Academics
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            Apply to become an Author, Moderator, or Admin.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenModal}
        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                   text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: '#1e3a5f' }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#162d4a')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e3a5f')
        }
      >
        Join as Author / Moderator / Admin
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SubjectsPage() {
  const { data: subjects, isLoading, isError, error } = useSubjects();
  const [query, setQuery] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);

  // Show the join banner only for authenticated users who are readers
  // (i.e. not already author/moderator/admin)
  const authenticated = isAuthenticated();
  const isReader = authenticated && (userRole === 'reader' || userRole === undefined);

  const { hasPending, isLoading: isPendingLoading } = useHasPendingRoleRequest(isReader);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/academics/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="border-b border-border"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Sign in / Register button — top-right, only when not authenticated */}
          {!isAuthenticated() && (
            <div className="flex justify-end mb-4">
              <Link
                to="/academics/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                           text-sm font-semibold border border-white/30 text-white
                           hover:bg-white/10 transition-colors"
              >
                Sign in / Register
              </Link>
            </div>
          )}

          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-white mb-2">
            PediAid Academics
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-2xl mb-8">
            Structured medical knowledge, peer-reviewed and organized by
            specialty
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex max-w-xl"
          >
            <label htmlFor="acad-search" className="sr-only">
              Search chapters
            </label>
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="acad-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chapters, topics, or authors…"
                className="w-full pl-10 pr-4 py-3 rounded-l-xl border-0
                           text-ink placeholder-ink-muted text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent
                           shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-r-xl font-semibold text-sm text-white
                         transition-colors"
              style={{ backgroundColor: '#3182ce' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#2c5282')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#3182ce')
              }
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subject grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Join banner — authenticated readers only */}
        {isReader && (
          <JoinBanner
            hasPending={hasPending}
            isPendingLoading={isPendingLoading}
            onOpenModal={() => setRoleModalOpen(true)}
          />
        )}

        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-5">
          Specialties
        </h2>

        <div
          className="grid gap-4
                     grid-cols-1
                     sm:grid-cols-2
                     lg:grid-cols-3
                     xl:grid-cols-4"
        >
          {isLoading && <SkeletonGrid variant="subject" count={6} />}

          {isError && (
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : 'Failed to load subjects'
              }
            />
          )}

          {!isLoading && !isError && subjects?.length === 0 && (
            <EmptyState />
          )}

          {subjects?.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Role request modal                                                   */}
      {/* ------------------------------------------------------------------ */}
      <RoleRequestModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  );
}
