// =============================================================================
// academics/never-again/NeverAgainFeedPage.tsx — /academics/never-again
//
// Never Again's first web presence. Public, anonymous, no login required —
// mirrors flutter/lib/screens/never_again/never_again_screen.dart's feed.
// =============================================================================

import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Heart, Plus, ClipboardList } from 'lucide-react';
import { useNeverAgainFeed, type NeverAgainPost } from './hooks/useNeverAgain';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function PostCard({ post }: { post: NeverAgainPost }) {
  return (
    <div className="bg-card rounded-card shadow-card px-5 py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          {post.category}
        </span>
        {post.role && (
          <span className="text-xs text-ink-muted shrink-0">{post.role}</span>
        )}
      </div>

      <div className="space-y-3 text-sm text-ink leading-relaxed">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-1">What happened</p>
          <p>{post.whatHappened}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-1">What went wrong</p>
          <p>{post.whatWentWrong}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-1">The lesson</p>
          <p className="font-medium">{post.theLesson}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Heart size={13} aria-hidden="true" />
          {post.resonatedCount} resonated
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={13} aria-hidden="true" />
          {timeAgo(post.createdAt)}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-card shadow-card px-5 py-5 animate-pulse space-y-3">
      <div className="h-5 w-24 bg-gray-100 rounded-full" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-5/6 bg-gray-100 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  );
}

export function NeverAgainFeedPage() {
  const { posts, isLoading, isLoadingMore, hasMore, error, loadMore } = useNeverAgainFeed(null);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-primary">Never Again</h1>
            <p className="text-sm text-ink-muted mt-1">
              Anonymous clinical mistakes, shared so others don't repeat them.
            </p>
          </div>
          <Link
            to="/academics/never-again/submit"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: '#e53e3e' }}
          >
            <Plus size={16} aria-hidden="true" />
            Share
          </Link>
        </div>

        <Link
          to="/academics/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline mb-6"
        >
          <ClipboardList size={13} aria-hidden="true" />
          Track your submissions
        </Link>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger flex items-center gap-2">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-card rounded-card shadow-card flex flex-col items-center justify-center py-14 px-6 text-center">
            <AlertTriangle size={36} className="text-ink-muted mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-ink mb-1">No posts yet</p>
            <p className="text-sm text-ink-muted">Be the first to share a lesson learned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-accent border border-border hover:bg-gray-50 disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
