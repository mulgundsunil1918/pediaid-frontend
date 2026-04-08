// =============================================================================
// academics/dashboard/MyChaptersPage.tsx — All author chapters with filter tabs
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMyChapters } from './hooks/useDashboard';
import type { MyChapter } from './hooks/useDashboard';
import { MyChaptersList } from './components/MyChaptersList';
import { RejectionFeedbackModal } from './components/RejectionFeedbackModal';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabFilter = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

const TABS: { value: TabFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function MyChaptersPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [feedbackChapter, setFeedbackChapter] = useState<MyChapter | null>(null);

  const statusParam = activeTab === 'all' ? undefined : activeTab;
  const { data: chapters = [], isLoading } = useMyChapters(statusParam);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/academics/dashboard"
            className="
              flex items-center gap-1 text-sm text-ink-muted
              hover:text-accent transition-colors
            "
          >
            <ChevronLeft size={16} />
            Dashboard
          </Link>
          <span className="text-ink-muted">/</span>
          <h1 className="text-xl font-bold text-ink">My Chapters</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-border pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'px-4 py-2.5 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors',
                activeTab === tab.value
                  ? 'border-accent text-accent bg-blue-50/50'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-border',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <MyChaptersList
          chapters={chapters}
          isLoading={isLoading}
          onViewRejectionFeedback={(chapter) => setFeedbackChapter(chapter)}
        />
      </div>

      {/* Rejection feedback modal */}
      {feedbackChapter && (
        <RejectionFeedbackModal
          chapter={feedbackChapter}
          onClose={() => setFeedbackChapter(null)}
          onEdit={() => setFeedbackChapter(null)}
        />
      )}
    </div>
  );
}
