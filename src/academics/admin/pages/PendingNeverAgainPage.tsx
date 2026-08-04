// =============================================================================
// academics/admin/pages/PendingNeverAgainPage.tsx
//
// Admin-only moderation queue for anonymous "Never Again" posts. Posts have
// no account attached (device_id only) and stay anonymous to every other
// user forever — but a submitter can optionally leave a contact email that
// only the admin ever sees, so there's a real way to reach them if a post
// needs a revision rather than an outright reject. The submitting device
// also always checks its own status via GET /never-again/mine regardless
// of whether an email was left. Moderation controls come from the shared
// ModerationActions component, which the CME queue also uses.
// =============================================================================

import {
  Clock,
  Inbox,
  Loader2,
  ShieldAlert,
  Mail,
} from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminPendingNeverAgainPosts,
  useApproveNeverAgainPost,
  useRejectNeverAgainPost,
  useRequestNeverAgainChanges,
  type PendingNeverAgainPost,
} from '../hooks/useAdmin';
import { ModerationActions, type ModerationCopy } from '../components/ModerationActions';

function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}


// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------

function PendingPostCard({ post }: { post: PendingNeverAgainPost }) {
  const approveMutation = useApproveNeverAgainPost();
  const rejectMutation = useRejectNeverAgainPost();
  const changesMutation = useRequestNeverAgainChanges();

  // Never Again posts are anonymous, so whether the submitter left a contact
  // email decides whether they'll ever see this feedback by email at all.
  const hasEmail = Boolean(post.submitter_email);

  const moderationCopy: ModerationCopy = {
    rejectTitle: 'Reject post',
    rejectDescription: (
      <>
        This post stays hidden from the public feed.{' '}
        {hasEmail
          ? "We'll email the submitter this reason."
          : "The reason is stored for your own records only — this submitter didn't leave a contact email."}
      </>
    ),
    rejectPlaceholder:
      'e.g. Identifies a specific hospital/patient — too identifiable to publish.',
    changesTitle: 'Request changes',
    changesDescription: (
      <>
        The post goes back to a "needs changes" state instead of being rejected
        outright.{' '}
        {hasEmail
          ? "We'll email the submitter exactly what to fix — they can share a revised version any time."
          : 'This submitter didn\'t leave a contact email, so the only way they\'ll see this is by checking "My Submissions" in the app.'}
      </>
    ),
    changesPlaceholder:
      'e.g. Remove the ward name in paragraph 2, otherwise this is good to publish.',
  };

  return (
    <article className="bg-white rounded-2xl shadow-card border border-border overflow-hidden p-6">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800">
          {post.category}
        </span>
        {post.role && (
          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase text-ink-muted">
            {post.role}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock size={10} /> Submitted {daysAgo(post.created_at)}
        </span>
        {hasEmail && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-accent"
            title={`${post.submitter_email} — private, only visible to admins, never shown publicly`}
          >
            <Mail size={10} /> {post.submitter_email}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            What happened
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.what_happened}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            What went wrong
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.what_went_wrong}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            The lesson
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.the_lesson}
          </p>
        </div>
      </div>

      <ModerationActions
        copy={moderationCopy}
        onApprove={() => approveMutation.mutateAsync(post.id).then(() => undefined)}
        onReject={(reason) =>
          rejectMutation.mutateAsync({ id: post.id, reason }).then(() => undefined)
        }
        onRequestChanges={(reason) =>
          changesMutation.mutateAsync({ id: post.id, reason }).then(() => undefined)
        }
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isRequestingChanges={changesMutation.isPending}
      />
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PendingNeverAgainPage() {
  // Access is enforced by AdminGuard in AdminLayout, which asks the server
  // (GET /admin/me). The old check here read the role from localStorage —
  // untrustworthy, and it matched 'admin' exactly, so a super_admin was
  // redirected to login, which then bounced back here: an infinite loop
  // that rendered a blank page.

  const { data, isLoading, isError, error } = useAdminPendingNeverAgainPosts();
  const posts = data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <ShieldAlert size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Pending Never Again posts
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Anonymous clinical-mistake posts awaiting review before they
                go live in the public feed.
              </p>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading submissions…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending posts.'}
          </div>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-border py-16 px-6 text-center">
            <Inbox
              size={48}
              className="mx-auto text-ink-muted mb-4"
              aria-hidden="true"
            />
            <p className="text-ink font-semibold text-lg mb-1">
              No posts waiting
            </p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              When someone shares a Never Again post from the Flutter app,
              it'll appear here for your review.
            </p>
          </div>
        )}

        {!isLoading && !isError && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PendingPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
