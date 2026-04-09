// =============================================================================
// browse/SubjectsPage.tsx — /academics
// =============================================================================

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Clock,
  Users,
  PencilLine,
  Scale,
  Flame,
  TreePine,
  User2,
} from 'lucide-react';
import {
  useRecentGuides,
  useTaxonomyTree,
  type RecentGuide,
  type TaxonomyTreeSubject,
} from './hooks/useBrowse';
import { useAuthStore } from '../../store/authStore';
import { API_BASE } from '../../lib/apiBase';
import { RoleRequestModal } from '../auth/RoleRequestModal';

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
// Tab 1: Recent Guides — horizontal swipable strip of recently approved chapters
// ---------------------------------------------------------------------------

function RecentGuideCard({ guide }: { guide: RecentGuide }) {
  return (
    <Link
      to={`/academics/c/${guide.slug}`}
      className="
        shrink-0 w-72 sm:w-80
        acad-card p-5
        flex flex-col gap-3
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
      "
      aria-label={`Open ${guide.title}`}
    >
      <span
        className="self-start acad-badge text-white text-[10px]"
        style={{ backgroundColor: '#3182ce' }}
      >
        {guide.subjectCode}
      </span>

      <h3 className="font-sans font-semibold text-base text-primary leading-snug line-clamp-2">
        {guide.title}
      </h3>

      <p className="text-xs text-ink-muted line-clamp-1">
        {guide.systemName} · {guide.topicName}
      </p>

      <div className="mt-auto pt-1 flex items-center justify-between text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1 min-w-0 truncate">
          <User2 size={11} aria-hidden="true" />
          <span className="truncate">{guide.authorName}</span>
        </span>
        <span className="inline-flex items-center gap-1 shrink-0">
          <Clock size={11} aria-hidden="true" />
          {guide.readingTimeMinutes || 1}m
        </span>
      </div>
    </Link>
  );
}

function RecentGuidesTab() {
  const { data, isLoading, isError } = useRecentGuides(12);
  const guides = data ?? [];

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-0 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="shrink-0 w-72 sm:w-80 h-44 rounded-card bg-gray-100 animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center text-sm text-danger">
        Failed to load recent guides.
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-10 text-center">
        <BookOpen size={36} className="mx-auto text-border mb-3" aria-hidden="true" />
        <p className="text-ink font-semibold mb-1">No published chapters yet</p>
        <p className="text-sm text-ink-muted">
          Be the first — apply as an Author and submit a chapter.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        flex gap-4 overflow-x-auto pb-4
        snap-x snap-mandatory
        -mx-4 px-4 sm:-mx-0 sm:px-0
        scrollbar-thin scrollbar-thumb-border
      "
      role="region"
      aria-label="Recently published guides"
    >
      {guides.map((g) => (
        <div key={g.id} className="snap-start">
          <RecentGuideCard guide={g} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Browse by System — search + expandable taxonomy
// ---------------------------------------------------------------------------

interface FilteredTaxonomy {
  subjects: TaxonomyTreeSubject[];
  autoExpandSubjects: Set<string>;
  autoExpandSystems: Set<string>;
  matchCount: number;
}

function filterTaxonomy(
  tree: TaxonomyTreeSubject[],
  rawQuery: string,
): FilteredTaxonomy {
  const query = rawQuery.trim().toLowerCase();
  const autoExpandSubjects = new Set<string>();
  const autoExpandSystems = new Set<string>();

  if (!query) {
    return {
      subjects: tree,
      autoExpandSubjects,
      autoExpandSystems,
      matchCount: tree.reduce(
        (acc, s) =>
          acc +
          s.systems.reduce((a, sys) => a + sys.topics.length, 0),
        0,
      ),
    };
  }

  const subjects: TaxonomyTreeSubject[] = [];
  let matchCount = 0;

  for (const subject of tree) {
    const subjectMatches =
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query);

    const keptSystems: typeof subject.systems = [];
    for (const system of subject.systems) {
      const systemMatches = system.name.toLowerCase().includes(query);
      const keptTopics = system.topics.filter((t) =>
        t.name.toLowerCase().includes(query),
      );

      if (systemMatches || keptTopics.length > 0 || subjectMatches) {
        keptSystems.push({
          ...system,
          topics: systemMatches || subjectMatches ? system.topics : keptTopics,
        });
        autoExpandSubjects.add(subject.id);
        autoExpandSystems.add(system.id);
        matchCount += (systemMatches || subjectMatches
          ? system.topics.length
          : keptTopics.length);
      }
    }

    if (subjectMatches && keptSystems.length === 0) {
      subjects.push(subject);
      autoExpandSubjects.add(subject.id);
      matchCount += subject.systems.reduce(
        (a, sys) => a + sys.topics.length,
        0,
      );
    } else if (keptSystems.length > 0) {
      subjects.push({ ...subject, systems: keptSystems });
    }
  }

  return { subjects, autoExpandSubjects, autoExpandSystems, matchCount };
}

function BrowseBySystemTab() {
  const { data: tree, isLoading, isError } = useTaxonomyTree();
  const [query, setQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const filtered = useMemo(
    () => filterTaxonomy(tree ?? [], query),
    [tree, query],
  );

  // Effective expansion = manual toggles ∪ auto-expansion from search
  const isSubjectExpanded = (id: string) =>
    expandedSubjects.has(id) || filtered.autoExpandSubjects.has(id);
  const isSystemExpanded = (id: string) =>
    expandedSystems.has(id) || filtered.autoExpandSystems.has(id);

  function toggleSubject(id: string) {
    setExpandedSubjects((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSystem(id: string) {
    setExpandedSystems((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-5">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, systems, or topics…"
          className="
            w-full pl-10 pr-4 py-3 rounded-xl
            text-sm text-ink placeholder-ink-muted
            bg-card border border-border
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
            transition-colors
          "
          aria-label="Search taxonomy"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
          Failed to load taxonomy.
        </div>
      )}

      {!isLoading && !isError && filtered.subjects.length === 0 && (
        <div className="rounded-card border border-border bg-card p-10 text-center">
          <Search size={32} className="mx-auto text-border mb-3" aria-hidden="true" />
          <p className="text-ink font-semibold mb-1">No matches</p>
          <p className="text-sm text-ink-muted">
            Nothing in the taxonomy matches "{query}".
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.subjects.length > 0 && (
        <ul className="list-none p-0 m-0 space-y-2">
          {filtered.subjects.map((subject) => {
            const subjectOpen = isSubjectExpanded(subject.id);
            return (
              <li
                key={subject.id}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    hover:bg-gray-50 transition-colors
                  "
                  aria-expanded={subjectOpen}
                >
                  <span
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: '#1e3a5f' }}
                    aria-hidden="true"
                  >
                    {subject.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">
                      {subject.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {subject.systems.length} system
                      {subject.systems.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {subjectOpen ? (
                    <ChevronDown size={16} className="text-ink-muted shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-ink-muted shrink-0" />
                  )}
                </button>

                {subjectOpen && subject.systems.length > 0 && (
                  <ul className="list-none p-0 m-0 border-t border-border bg-gray-50/50">
                    {subject.systems.map((system) => {
                      const systemOpen = isSystemExpanded(system.id);
                      return (
                        <li
                          key={system.id}
                          className="border-b last:border-b-0 border-border"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSystem(system.id)}
                            className="
                              w-full flex items-center gap-3 pl-14 pr-4 py-2.5 text-left
                              hover:bg-white transition-colors
                            "
                            aria-expanded={systemOpen}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink truncate">
                                {system.name}
                              </p>
                              <p className="text-[11px] text-ink-muted">
                                {system.topics.length} topic
                                {system.topics.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            {systemOpen ? (
                              <ChevronDown size={14} className="text-ink-muted shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-ink-muted shrink-0" />
                            )}
                          </button>

                          {systemOpen && system.topics.length > 0 && (
                            <ul className="list-none p-0 m-0 bg-white">
                              {system.topics.map((topic) => (
                                <li key={topic.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/academics/subjects/${subject.id}/systems/${system.id}/topics/${topic.id}`,
                                      )
                                    }
                                    className="
                                      w-full flex items-center justify-between gap-3
                                      pl-20 pr-4 py-2
                                      text-left hover:bg-blue-50 transition-colors
                                    "
                                  >
                                    <span className="text-sm text-ink">
                                      {topic.name}
                                    </span>
                                    <span className="flex items-center gap-2 text-xs text-ink-muted shrink-0">
                                      {topic.chapterCount > 0 && (
                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                                          {topic.chapterCount}
                                        </span>
                                      )}
                                      <ChevronRight size={13} aria-hidden="true" />
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomeTabs — two swipable tabs with slide transition
// ---------------------------------------------------------------------------

type HomeTab = 'recent' | 'browse';

function HomeTabs() {
  const [active, setActive] = useState<HomeTab>('recent');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum horizontal distance for a swipe to register (px)
  const SWIPE_THRESHOLD = 60;

  function onTouchStart(e: React.TouchEvent) {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  }
  function onTouchMove(e: React.TouchEvent) {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  }
  function onTouchEnd() {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > SWIPE_THRESHOLD && active === 'recent') setActive('browse');
    if (distance < -SWIPE_THRESHOLD && active === 'browse') setActive('recent');
  }

  return (
    <section aria-labelledby="home-tabs-heading">
      {/* Tab pills */}
      <div
        role="tablist"
        aria-label="Home sections"
        className="
          inline-flex items-center gap-1 p-1 rounded-full
          bg-card border border-border shadow-sm mb-6
        "
      >
        <button
          role="tab"
          type="button"
          aria-selected={active === 'recent'}
          onClick={() => setActive('recent')}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
            active === 'recent'
              ? 'text-white shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
          style={
            active === 'recent' ? { backgroundColor: '#1e3a5f' } : undefined
          }
        >
          <Flame size={14} aria-hidden="true" />
          Recent Guides
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={active === 'browse'}
          onClick={() => setActive('browse')}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
            active === 'browse'
              ? 'text-white shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
          style={
            active === 'browse' ? { backgroundColor: '#1e3a5f' } : undefined
          }
        >
          <TreePine size={14} aria-hidden="true" />
          Browse by System
        </button>
      </div>

      <h2 id="home-tabs-heading" className="sr-only">
        Home
      </h2>

      {/* Sliding tab content */}
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex w-[200%] transition-transform duration-300 ease-out"
          style={{
            transform: active === 'recent' ? 'translateX(0%)' : 'translateX(-50%)',
          }}
        >
          <div
            className="w-1/2 shrink-0 px-0.5"
            role="tabpanel"
            aria-hidden={active !== 'recent'}
          >
            {active === 'recent' && <RecentGuidesTab />}
          </div>
          <div
            className="w-1/2 shrink-0 px-0.5"
            role="tabpanel"
            aria-hidden={active !== 'browse'}
          >
            {active === 'browse' && <BrowseBySystemTab />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// LandingCards — two application cards shown to visitors who are NOT signed in
// ---------------------------------------------------------------------------
//
// Each card names a role, lists clear eligibility, and routes to the register
// form pre-filled with ?role=author or ?role=moderator. After submitting, the
// backend creates a pending_* account and emails the admin for approval.

function LandingCards() {
  return (
    <section className="mb-12" aria-labelledby="landing-cards-heading">
      <h2
        id="landing-cards-heading"
        className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-5"
      >
        Join the community
      </h2>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {/* ── Author card ─────────────────────────────────────────── */}
        <div
          className="acad-card p-6 flex flex-col gap-4 border-2"
          style={{ borderColor: '#bfdbfe' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#dbeafe' }}
            >
              <PencilLine size={22} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xl text-primary leading-tight">
                ✍️ Join as Author
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Write and submit peer-reviewed chapters
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/60 px-4 py-3 border border-blue-100">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">
              Eligibility
            </p>
            <p className="text-sm text-ink leading-relaxed">
              MBBS / MD or equivalent medical degree.
            </p>
          </div>

          <ul className="text-sm text-ink-muted space-y-1.5 leading-relaxed">
            <li>• Create draft chapters and submit for peer review</li>
            <li>• See reviewer feedback and revise when asked</li>
            <li>• Get credited as the named author on approved work</li>
          </ul>

          <Link
            to="/academics/register?role=author"
            className="
              mt-auto inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              text-sm font-semibold text-white
              transition-colors
            "
            style={{ backgroundColor: '#1e3a5f' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#162d4a')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e3a5f')
            }
          >
            Apply as Author
            <ChevronRight size={16} aria-hidden="true" />
          </Link>

          <p className="text-[11px] text-ink-muted italic">
            An admin will review your application before your account gains author privileges.
          </p>
        </div>

        {/* ── Moderator card ──────────────────────────────────────── */}
        <div
          className="acad-card p-6 flex flex-col gap-4 border-2"
          style={{ borderColor: '#fde68a' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fef3c7' }}
            >
              <Scale size={22} className="text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xl text-amber-800 leading-tight">
                ⚖️ Join as Moderator
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Peer-review submitted chapters
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50/80 px-4 py-3 border border-amber-100">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
              Eligibility
            </p>
            <p className="text-sm text-ink leading-relaxed">
              MD / DNB with 3+ years clinical experience.
            </p>
          </div>

          <ul className="text-sm text-ink-muted space-y-1.5 leading-relaxed">
            <li>• Review chapters in the moderation queue</li>
            <li>• Approve, reject, or request revisions with notes</li>
            <li>• Shape the editorial quality of every published chapter</li>
          </ul>

          <Link
            to="/academics/register?role=moderator"
            className="
              mt-auto inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              text-sm font-semibold text-white
              transition-colors
            "
            style={{ backgroundColor: '#b45309' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#92400e')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#b45309')
            }
          >
            Apply as Moderator
            <ChevronRight size={16} aria-hidden="true" />
          </Link>

          <p className="text-[11px] text-ink-muted italic">
            An admin will review your credentials before your account gains moderator privileges.
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-ink-muted text-center">
        Already have an account?{' '}
        <Link
          to="/academics/login"
          className="font-semibold text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SubjectsPage() {
  const [query, setQuery] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);

  // Ephemeral toast surfaced when another page redirected here with a message
  // (e.g. the dashboard guard bouncing readers/pending users).
  const initialToast = (location.state as { toast?: string } | null)?.toast ?? null;
  const [toast, setToast] = useState<string | null>(initialToast);
  useEffect(() => {
    if (initialToast) {
      // Clear router state so the toast doesn't reappear on back/forward
      window.history.replaceState({}, '');
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [initialToast]);

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
          {/* Top-right action buttons — only when NOT signed in */}
          {!isAuthenticated() && (
            <div className="flex justify-end gap-2 mb-4">
              <button
                type="button"
                onClick={() => setJoinSheetOpen(true)}
                className="
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                  text-sm font-semibold bg-white text-primary
                  hover:bg-blue-50 transition-colors shadow-sm
                "
                aria-label="Join as author or moderator"
              >
                Join Now
              </button>
              <Link
                to="/academics/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                           text-sm font-semibold border border-white/30 text-white
                           hover:bg-white/10 transition-colors"
              >
                Sign in
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

        {/* Ephemeral toast (e.g. after a dashboard redirect) */}
        {toast && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5"
            role="status"
          >
            <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm font-medium text-amber-800 flex-1">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-amber-600 hover:text-amber-800 text-sm font-semibold"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Landing cards — only when nobody is signed in */}
        {!authenticated && <LandingCards />}

        {/* Join banner — authenticated readers only */}
        {isReader && (
          <JoinBanner
            hasPending={hasPending}
            isPendingLoading={isPendingLoading}
            onOpenModal={() => setRoleModalOpen(true)}
          />
        )}

        <HomeTabs />
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Role request modal (for authenticated readers)                       */}
      {/* ------------------------------------------------------------------ */}
      <RoleRequestModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Join Now bottom sheet (for unauthenticated visitors)                 */}
      {/* ------------------------------------------------------------------ */}
      {joinSheetOpen && <JoinNowSheet onClose={() => setJoinSheetOpen(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JoinNowSheet — bottom-sheet modal offered from the Join Now header button
//
// Shows the same two options as the LandingCards grid, but in a compact
// stacked format. Each option links directly to /academics/register with
// the requestedRole query param so the register page pre-selects the flow.
// ---------------------------------------------------------------------------

function JoinNowSheet({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          bg-card w-full sm:max-w-md
          rounded-t-3xl sm:rounded-2xl
          shadow-card-hover
          overflow-hidden
          animate-fadeSlideIn
        "
      >
        {/* Mobile grab handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="block w-10 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 sm:pt-6 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h2
              id="join-sheet-title"
              className="font-sans font-bold text-lg text-primary"
            >
              Join PediAid Academics
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              Choose how you'd like to contribute.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <Link
            to="/academics/register?role=author"
            onClick={onClose}
            className="
              block rounded-xl border-2 p-4
              hover:border-accent hover:bg-blue-50/40
              transition-colors
            "
            style={{ borderColor: '#bfdbfe' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#dbeafe' }}
              >
                <PencilLine size={18} className="text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-base text-primary leading-tight">
                  ✍️ Join as Author
                </p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-ink">Eligibility:</span>{' '}
                  MBBS / MD or equivalent medical degree.
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-ink-muted shrink-0 mt-1"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            to="/academics/register?role=moderator"
            onClick={onClose}
            className="
              block rounded-xl border-2 p-4
              hover:border-amber-400 hover:bg-amber-50/40
              transition-colors
            "
            style={{ borderColor: '#fde68a' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#fef3c7' }}
              >
                <Scale size={18} className="text-amber-700" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-base text-amber-800 leading-tight">
                  ⚖️ Join as Moderator
                </p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-ink">Eligibility:</span>{' '}
                  MD / DNB with 3+ years clinical experience.
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-ink-muted shrink-0 mt-1"
                aria-hidden="true"
              />
            </div>
          </Link>

          <p className="text-[11px] text-ink-muted text-center pt-2">
            Already have an account?{' '}
            <Link
              to="/academics/login"
              onClick={onClose}
              className="font-semibold text-accent hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
