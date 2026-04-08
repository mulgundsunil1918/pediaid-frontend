// =============================================================================
// reader/components/DiscussionSection.tsx — threaded comments
// =============================================================================

import { useState, useRef } from 'react';
import { Flag, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { VerifiedBadge } from '../../browse/components/VerifiedBadge';
import { useAuthStore } from '../../../store/authStore';
import {
  useComments,
  usePostComment,
  useEditComment,
  useFlagComment,
  type Comment,
} from '../hooks/useChapterReader';

const COMPOSE_MAX = 2000;
const EDIT_WINDOW_MS = 15 * 60 * 1_000; // 15 min

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return `${Math.floor(diff / 86_400_000)} days ago`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center bg-primary/10
                 text-primary font-semibold font-sans shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compose box
// ---------------------------------------------------------------------------

function ComposeBox({
  chapterId,
  parentId,
  placeholder,
  onCancel,
  authorName,
}: {
  chapterId: string;
  parentId?: string;
  placeholder: string;
  onCancel?: () => void;
  authorName: string;
}) {
  const [text, setText] = useState('');
  const postMutation = usePostComment(chapterId);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    await postMutation.mutateAsync({ content: trimmed, parentId });
    setText('');
    onCancel?.();
  }

  return (
    <div className="flex gap-3">
      <Avatar name={authorName} />
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, COMPOSE_MAX))}
          placeholder={placeholder}
          rows={3}
          className="w-full text-sm border border-border rounded-xl px-4 py-3
                     outline-none focus:border-accent resize-none transition-colors
                     text-ink placeholder-gray-300 leading-relaxed"
          style={{ fontFamily: 'Georgia, serif' }}
          aria-label="Comment text"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-ink-muted">{text.length} / {COMPOSE_MAX}</span>
          <div className="flex gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel}
                className="px-3 py-1.5 text-xs text-ink-muted rounded-lg
                           hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || postMutation.isPending}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {postMutation.isPending ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
        {postMutation.isError && (
          <p className="text-xs text-danger mt-1">
            {postMutation.error instanceof Error ? postMutation.error.message : 'Post failed'}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommentItem
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  chapterId,
  depth = 0,
}: {
  comment: Comment;
  chapterId: string;
  depth?: number;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const editMutation = useEditComment(chapterId);
  const flagMutation = useFlagComment(chapterId);

  const isOwn = user?.id === comment.authorId;
  const withinEditWindow =
    Date.now() - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS;
  const editMinsLeft = Math.ceil(
    (EDIT_WINDOW_MS - (Date.now() - new Date(comment.createdAt).getTime())) / 60_000,
  );
  const canEdit = isOwn && withinEditWindow && !comment.isFlagged;
  const isMod = user?.role === 'moderator' || user?.role === 'admin';

  if (comment.isDeleted && !isMod) {
    return (
      <div className={depth > 0 ? 'pl-6 border-l-2 border-border' : ''}>
        <p className="text-sm text-ink-muted italic py-2">[Comment removed]</p>
      </div>
    );
  }

  const authorName = comment.author.fullName;
  const authorLabel = [authorName, comment.author.qualification].filter(Boolean).join(', ');

  return (
    <div className={depth > 0 ? 'pl-5 border-l-2 border-border' : ''}>
      <div className="group flex gap-3 py-3">
        <Avatar name={authorName} size={30} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{authorLabel}</span>
            <VerifiedBadge credentialsVerified={comment.author.credentialsVerified} />
            <time
              dateTime={comment.createdAt}
              title={fullDate(comment.createdAt)}
              className="text-xs text-ink-muted"
            >
              {relativeTime(comment.createdAt)}
            </time>
            {comment.isEdited && (
              <span className="text-xs text-ink-muted italic">(edited)</span>
            )}
          </div>

          {/* Content or edit form */}
          {isEditing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, COMPOSE_MAX))}
                rows={3}
                className="w-full text-sm border border-border rounded-xl px-3 py-2
                           outline-none focus:border-accent resize-none transition-colors"
                style={{ fontFamily: 'Georgia, serif' }}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await editMutation.mutateAsync({ id: comment.id, content: editText.trim() });
                    setIsEditing(false);
                  }}
                  disabled={!editText.trim() || editMutation.isPending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs
                             font-semibold text-white rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: '#38a169' }}
                >
                  <Check size={12} /> Save
                </button>
                <button type="button" onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs
                             text-ink-muted rounded-lg hover:bg-gray-100">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-ink leading-relaxed"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1.5">
              {isAuthenticated() && depth < 3 && (
                <button type="button" onClick={() => setShowReply((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted
                             hover:text-accent transition-colors">
                  <MessageSquare size={11} /> Reply
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted
                             hover:text-accent transition-colors">
                  <Edit2 size={11} />
                  Edit ({editMinsLeft} min left)
                </button>
              )}
              {isAuthenticated() && !isOwn && (
                <button
                  type="button"
                  onClick={() => flagMutation.mutate({ id: comment.id, reason: 'inappropriate' })}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted/50
                             hover:text-danger opacity-0 group-hover:opacity-100
                             transition-all"
                  aria-label="Flag comment"
                >
                  <Flag size={11} /> Flag
                </button>
              )}
            </div>
          )}

          {/* Reply compose */}
          {showReply && user && (
            <div className="mt-3">
              <ComposeBox
                chapterId={chapterId}
                parentId={comment.id}
                placeholder="Write a reply…"
                onCancel={() => setShowReply(false)}
                authorName={user.profile?.fullName ?? user.email}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-0">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  chapterId={chapterId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiscussionSection
// ---------------------------------------------------------------------------

export function DiscussionSection({ chapterId }: { chapterId: string }) {
  const [page, setPage] = useState(1);
  const { user, isAuthenticated } = useAuthStore();
  const { data, isLoading } = useComments(chapterId, page);

  const total = data?.total ?? 0;
  const comments = data?.data ?? [];

  return (
    <section
      className="mt-10 pt-8 border-t border-border"
      aria-labelledby="discussion-heading"
    >
      <h2
        id="discussion-heading"
        className="font-sans font-bold text-xl text-ink mb-5"
      >
        Discussion{total > 0 && ` (${total})`}
      </h2>

      {/* Compose (authenticated) */}
      {isAuthenticated() && user ? (
        <div className="mb-6">
          <ComposeBox
            chapterId={chapterId}
            placeholder="Share a clinical insight or question…"
            authorName={user.profile?.fullName ?? user.email}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-border bg-gray-50 px-5 py-4 text-center">
          <p className="text-sm text-ink-muted">
            <a href="/login" className="text-accent hover:underline font-medium">
              Sign in
            </a>{' '}
            to join the discussion.
          </p>
        </div>
      )}

      {/* Comment list */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-4/5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-ink-muted italic py-4 text-center">
          No comments yet. Start the discussion.
        </p>
      )}

      <div className="space-y-0 divide-y divide-border">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} chapterId={chapterId} />
        ))}
      </div>

      {/* Load more */}
      {data && page * 20 < data.total && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="mt-4 text-sm text-accent hover:underline transition-colors"
        >
          Load more comments
        </button>
      )}
    </section>
  );
}
