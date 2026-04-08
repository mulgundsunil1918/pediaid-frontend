// =============================================================================
// reader/ChapterReaderPage.tsx — /academics/c/:slug
// =============================================================================

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Breadcrumb } from '../browse/components/Breadcrumb';
import { AuthorCard } from './components/AuthorCard';
import { ChapterMeta } from './components/ChapterMeta';
import { ChapterRenderer } from './components/ChapterRenderer';
import { TableOfContents, MobileToc } from './components/TableOfContents';
import { ReferencesDisplay } from './components/ReferencesDisplay';
import { DiscussionSection } from './components/DiscussionSection';
import { ModeratorBanner } from './components/ModeratorBanner';
import { useChapterBySlug } from './hooks/useChapterReader';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ReaderSkeleton() {
  return (
    <div className="max-w-reading mx-auto px-4 sm:px-6 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        {[80, 100, 120].map((w) => (
          <div key={w} className="h-4 bg-gray-200 rounded-full" style={{ width: w }} />
        ))}
      </div>
      {/* Title */}
      <div className="h-9 bg-gray-200 rounded-lg w-4/5 mb-2" />
      <div className="h-9 bg-gray-200 rounded-lg w-3/5 mb-6" />
      {/* Author card */}
      <div className="border border-border rounded-card p-4 flex gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-40" />
        </div>
      </div>
      {/* Paragraphs */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2 mb-5">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-[95%]" />
          <div className="h-4 bg-gray-200 rounded w-[88%]" />
          {i % 2 === 0 && <div className="h-4 bg-gray-200 rounded w-[70%]" />}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ChapterReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, hasRole } = useAuthStore();

  const { data: chapter, isLoading } = useChapterBySlug(slug);

  // Set document title
  useEffect(() => {
    if (chapter?.title) {
      document.title = `${chapter.title} — PediAid Academics`;
    }
    return () => { document.title = 'PediAid Academics — PediAid'; };
  }, [chapter?.title]);

  const isElevated = hasRole('moderator', 'admin');
  const isAuthor = chapter && user?.id === chapter.authorId;
  const showBanner = (isAuthor || isElevated) && chapter?.status !== 'approved';

  return (
    <div className="min-h-screen bg-bg">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .reader-layout { display: block !important; }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <ReaderSkeleton />
        ) : chapter ? (
          <>
            {/* Breadcrumb */}
            <div className="mb-6 no-print">
              <Breadcrumb
                items={[
                  { label: 'Academics', href: '/academics' },
                  {
                    label: chapter.subject.name,
                    href: `/academics/subjects/${chapter.subject.id}`,
                  },
                  {
                    label: chapter.system.name,
                    href: `/academics/subjects/${chapter.subject.id}/systems/${chapter.system.id}`,
                  },
                  {
                    label: chapter.topic.name,
                    href: `/academics/subjects/${chapter.subject.id}/systems/${chapter.system.id}/topics/${chapter.topic.id}`,
                  },
                ]}
              />
            </div>

            {/* Moderator / author status banner */}
            {showBanner && chapter.status !== 'approved' && (
              <div className="no-print">
                <ModeratorBanner
                  chapterId={chapter.id}
                  status={chapter.status as 'draft' | 'pending' | 'rejected' | 'archived'}
                  moderatorNotes={chapter.moderatorNotes}
                  reviewedByName={chapter.moderator?.fullName ?? null}
                  reviewedAt={chapter.reviewedAt}
                />
              </div>
            )}

            {/* Two-column layout: content + TOC */}
            <div className="reader-layout flex gap-10 items-start">
              {/* Main content */}
              <article className="flex-1 min-w-0">
                {/* Chapter title */}
                <h1
                  className="font-sans font-bold text-primary leading-tight mb-5"
                  style={{ fontSize: '2.5rem' }}
                >
                  {chapter.title}
                </h1>

                {/* Author card */}
                <div className="mb-4">
                  <AuthorCard
                    author={chapter.author}
                    coAuthorProfiles={chapter.coAuthorProfiles}
                  />
                </div>

                {/* Meta row */}
                <div className="mb-6 no-print">
                  <ChapterMeta
                    readingTimeMinutes={chapter.readingTimeMinutes}
                    publishedAt={chapter.publishedAt}
                    version={chapter.version}
                    status={chapter.status}
                  />
                </div>

                <hr className="border-border mb-8" />

                {/* Chapter content */}
                <ChapterRenderer
                  blocks={chapter.content.blocks}
                  references={chapter.chapterReferences}
                />

                <hr className="border-border mt-10 mb-0" />

                {/* References */}
                <ReferencesDisplay references={chapter.chapterReferences} />

                <hr className="border-border mt-10 mb-0 no-print" />

                {/* Discussion */}
                <div className="no-print">
                  <DiscussionSection chapterId={chapter.id} />
                </div>
              </article>

              {/* Desktop TOC */}
              <div className="no-print">
                <TableOfContents blocks={chapter.content.blocks} />
              </div>
            </div>

            {/* Mobile TOC floating button */}
            <div className="no-print">
              <MobileToc blocks={chapter.content.blocks} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
