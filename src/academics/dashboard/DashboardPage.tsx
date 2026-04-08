// =============================================================================
// academics/dashboard/DashboardPage.tsx — Main Author Dashboard
// Route: /academics/dashboard
// =============================================================================

import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FilePlus2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStats, useMyChapters } from './hooks/useDashboard';
import type { MyChapter } from './hooks/useDashboard';
import type { AuthUser } from '../../academics/types';
import { StatsRow } from './components/StatsRow';
import { PendingAlert } from './components/PendingAlert';
import { QuickActions } from './components/QuickActions';
import { UpgradePrompt } from './components/UpgradePrompt';
import { MyChaptersList } from './components/MyChaptersList';
import { RejectionFeedbackModal } from './components/RejectionFeedbackModal';
import { NewChapterTopicSelector } from './components/NewChapterTopicSelector';

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

const ROLE_BADGE_STYLES: Record<string, string> = {
  reader: 'bg-gray-100 text-gray-600',
  author: 'bg-blue-50 text-accent',
  moderator: 'bg-purple-50 text-purple-700',
  admin: 'bg-red-50 text-danger',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={[
        'acad-badge capitalize',
        ROLE_BADGE_STYLES[role] ?? 'bg-gray-100 text-gray-600',
      ].join(' ')}
    >
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { user, isAuthenticated, canAuthor } = useAuthStore();

  const [feedbackChapter, setFeedbackChapter] = useState<MyChapter | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [pendingFilterActive, setPendingFilterActive] = useState(false);

  // Auth guard — redirect unauthenticated users
  if (!isAuthenticated()) {
    return <Navigate to="/academics/login" replace />;
  }

  const isReader = user?.role === 'reader';
  const displayName = user?.profile?.fullName ?? user?.email ?? 'there';

  return (
    <DashboardContent
      user={user}
      isReader={isReader}
      displayName={displayName}
      canAuthorFn={canAuthor}
      feedbackChapter={feedbackChapter}
      setFeedbackChapter={setFeedbackChapter}
      showTopicSelector={showTopicSelector}
      setShowTopicSelector={setShowTopicSelector}
      pendingFilterActive={pendingFilterActive}
      setPendingFilterActive={setPendingFilterActive}
    />
  );
}

// ---------------------------------------------------------------------------
// Inner content (separated so hooks can be called after auth guard)
// ---------------------------------------------------------------------------

interface ContentProps {
  user: AuthUser | null;
  isReader: boolean;
  displayName: string;
  canAuthorFn: () => boolean;
  feedbackChapter: MyChapter | null;
  setFeedbackChapter: (c: MyChapter | null) => void;
  showTopicSelector: boolean;
  setShowTopicSelector: (v: boolean) => void;
  pendingFilterActive: boolean;
  setPendingFilterActive: (v: boolean) => void;
}

function DashboardContent({
  user,
  isReader,
  displayName,
  canAuthorFn,
  feedbackChapter,
  setFeedbackChapter,
  showTopicSelector,
  setShowTopicSelector,
  pendingFilterActive,
  setPendingFilterActive,
}: ContentProps) {
  // Stats (only fetch for authors/mods/admins)
  const {
    data: stats,
    isLoading: statsLoading,
  } = useDashboardStats();

  // Last 5 chapters for dashboard preview (no status filter)
  const pendingStatus = pendingFilterActive ? 'pending' : undefined;
  const { data: allChapters = [], isLoading: chaptersLoading } =
    useMyChapters(pendingStatus);

  const pendingCount = stats?.pendingChapters ?? 0;

  // Show only last 5 on the dashboard unless pending filter is active
  const previewChapters = pendingFilterActive
    ? allChapters
    : allChapters.slice(0, 5);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-ink">
              Welcome back,{' '}
              <span className="text-primary">{displayName}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <RoleBadge role={user?.role ?? 'reader'} />
              {user?.profile?.institution && (
                <span className="text-xs text-ink-muted">
                  {user.profile.institution}
                </span>
              )}
            </div>
          </div>

          {/* Profile link */}
          <Link
            to="/academics/dashboard/profile"
            className="
              text-sm font-medium text-accent
              hover:underline underline-offset-2
              transition-colors
            "
          >
            Edit Profile
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Quick actions                                                        */}
        {/* ------------------------------------------------------------------ */}
        <QuickActions />

        {/* ------------------------------------------------------------------ */}
        {/* Reader: show upgrade prompt only                                     */}
        {/* ------------------------------------------------------------------ */}
        {isReader && <UpgradePrompt />}

        {/* ------------------------------------------------------------------ */}
        {/* Author / moderator / admin content                                   */}
        {/* ------------------------------------------------------------------ */}
        {canAuthorFn() && (
          <>
            {/* Pending alert */}
            {pendingCount > 0 && (
              <PendingAlert
                pendingCount={pendingCount}
                onViewPending={() => {
                  setPendingFilterActive(true);
                  // Scroll to chapters section
                  document
                    .getElementById('my-chapters-section')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* Stats row */}
            <StatsRow stats={stats} isLoading={statsLoading} />

            {/* My Chapters section */}
            <section id="my-chapters-section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-ink">
                  {pendingFilterActive ? 'Pending Chapters' : 'My Chapters'}
                </h2>
                <div className="flex items-center gap-3">
                  {pendingFilterActive && (
                    <button
                      onClick={() => setPendingFilterActive(false)}
                      className="text-xs text-ink-muted hover:text-ink underline underline-offset-2"
                    >
                      Show all
                    </button>
                  )}
                  <Link
                    to="/academics/dashboard/chapters"
                    className="text-sm font-medium text-accent hover:underline underline-offset-2"
                  >
                    View all
                  </Link>
                </div>
              </div>

              <MyChaptersList
                chapters={previewChapters}
                isLoading={chaptersLoading}
                onViewFeedback={(chapter) =>
                  setFeedbackChapter(chapter)
                }
              />
            </section>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile FAB — "New Chapter" (canAuthor only)                          */}
      {/* ------------------------------------------------------------------ */}
      {canAuthorFn() && (
        <button
          onClick={() => setShowTopicSelector(true)}
          className="
            md:hidden
            fixed bottom-6 right-6 z-40
            flex items-center gap-2
            px-4 py-3 rounded-2xl
            bg-primary text-white text-sm font-semibold
            shadow-card-hover
            hover:bg-primary-light
            active:scale-95
            transition-all duration-150
          "
          aria-label="Create new chapter"
        >
          <FilePlus2 size={18} aria-hidden="true" />
          New Chapter
        </button>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modals                                                               */}
      {/* ------------------------------------------------------------------ */}
      {feedbackChapter && (
        <RejectionFeedbackModal
          chapter={feedbackChapter}
          onClose={() => setFeedbackChapter(null)}
          onEdit={() => setFeedbackChapter(null)}
        />
      )}

      {showTopicSelector && (
        <NewChapterTopicSelector
          onClose={() => setShowTopicSelector(false)}
        />
      )}
    </div>
  );
}
