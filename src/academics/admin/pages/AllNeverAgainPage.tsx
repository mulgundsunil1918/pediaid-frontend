// =============================================================================
// academics/admin/pages/AllNeverAgainPage.tsx
//
// Every Never Again post, whatever its status.
//
// The admin panel only ever had the pending queue, so a post disappeared from
// the dashboard the moment it was approved. There was no way to find one
// again — which meant a fake that slipped through review could not be removed,
// even though the delete route existed and worked.
//
// A queue and a library want different things: the queue is worked through
// oldest-first with approve/reject on every row, while this is browsed
// newest-first to find one specific post. So this is a compact list with a
// status filter and a single destructive action, not a second moderation
// surface.
// =============================================================================

import { useState } from 'react';
import { AlertTriangle, Loader2, Search, Trash2 } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import {
  useAllNeverAgainPosts,
  useDeleteNeverAgainPost,
  type NeverAgainPost,
} from '../hooks/useAdmin';
import { safeDate } from '../../../lib/safeDate';
import { AnnounceButton } from '../components/AnnounceButton';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'changes_requested', label: 'Changes requested' },
] as const;

function statusClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'rejected':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function PostRow({ post }: { post: NeverAgainPost }) {
  const [confirm, setConfirm] = useState(false);
  const del = useDeleteNeverAgainPost();

  return (
    <article className="bg-white border border-border rounded-card p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(post.status)}`}
            >
              {post.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-ink-muted">{post.category}</span>
            {post.reference_code && (
              <span className="text-xs font-mono text-ink-muted select-all">
                {post.reference_code}
              </span>
            )}
            {post.is_flagged && (
              <span className="inline-flex items-center gap-1 text-xs text-danger">
                <AlertTriangle size={12} /> flagged
              </span>
            )}
          </div>
          <p className="text-sm text-ink leading-snug line-clamp-2">
            {post.what_happened}
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {safeDate(post.created_at)}
            {post.role ? ` · ${post.role}` : ''}
            {post.resonated_count > 0 ? ` · ${post.resonated_count} resonated` : ''}
          </p>
        </div>

        <div className="flex-shrink-0">
          {confirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted whitespace-nowrap">Delete?</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await del.mutateAsync(post.id);
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Delete failed.');
                  } finally {
                    setConfirm(false);
                  }
                }}
                disabled={del.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-danger hover:opacity-90 disabled:opacity-50"
              >
                {del.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="px-2 py-1.5 text-sm text-ink-muted hover:text-ink"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              title="Permanently delete this post"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-ink-muted hover:text-danger hover:bg-red-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      </div>
      {/* Anonymous by design — "A new lesson was shared", no author, opens the
          feed. Only for published posts (nothing to announce before approval). */}
      {post.status === 'published' && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 flex-wrap">
          <AnnounceButton module="never-again" id={String(post.id)} />
          <span className="text-[11px] text-ink-muted">
            Anonymous — “A new lesson was shared”. Cannot be undone.
          </span>
        </div>
      )}
    </article>
  );
}

export function AllNeverAgainPage() {
  const [status, setStatus] = useState<string>('all');
  const [query, setQuery] = useState('');
  const { data: posts = [], isLoading, isError, error } = useAllNeverAgainPosts(status);

  // Filtered in the browser, not the API: this endpoint is capped at 200 rows,
  // so there is nothing here a client-side filter cannot handle, and it stays
  // instant while typing.
  const q = query.trim().toLowerCase();
  const visible = q
    ? posts.filter(
        (p) =>
          p.what_happened.toLowerCase().includes(q) ||
          p.the_lesson.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.reference_code ?? '').toLowerCase().includes(q),
      )
    : posts;

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">All Never Again posts</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Everything ever submitted, newest first — for finding and removing a
          specific post. Use "Never Again" in the sidebar to moderate submissions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              status === t.value
                ? 'bg-white text-ink border-accent'
                : 'bg-transparent text-ink-muted border-border hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text, category or PA-NA reference…"
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent"
        />
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
          {error?.message ?? 'Failed to load posts.'}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          <Loader2 size={18} className="animate-spin inline mr-2" />
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          {q || status !== 'all'
            ? 'No posts match this filter.'
            : 'No posts yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            {visible.length} {visible.length === 1 ? 'post' : 'posts'}
          </p>
          {visible.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
