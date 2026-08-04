// =============================================================================
// academics/admin/components/ModerationActions.tsx
//
// The Approve / Request changes / Reject control, shared by every moderation
// queue. Both PendingNeverAgainPage and CmeTypeAdminPage previously carried
// their own near-identical copy of this — two reason modals, the same three
// buttons, the same pending/error handling — differing only in wording.
//
// So the modal is one component parameterised by copy, and the button row
// owns the modal state and the async plumbing. Callers supply three async
// handlers and the module-specific wording; nothing else.
// =============================================================================

import { useState, type ReactNode } from 'react';
import { Check, X, MessageSquareWarning, Loader2, Trash2 } from 'lucide-react';

const REASON_MAX = 1000;
const REASON_MIN = 5;

// ---------------------------------------------------------------------------
// Reason modal — used for both "reject" and "request changes"
// ---------------------------------------------------------------------------

type ReasonVariant = 'reject' | 'changes';

const VARIANT_META: Record<
  ReasonVariant,
  {
    accent: string;
    icon: ReactNode;
    label: string;
    confirmIdle: string;
    confirmBusy: string;
    focusClass: string;
  }
> = {
  reject: {
    accent: '#e53e3e',
    icon: <X size={20} />,
    label: 'Reason (required)',
    confirmIdle: 'Confirm reject',
    confirmBusy: 'Rejecting…',
    focusClass: 'focus:border-danger',
  },
  changes: {
    accent: '#d69e2e',
    icon: <MessageSquareWarning size={20} />,
    label: 'What needs to change? (required)',
    confirmIdle: 'Send back for changes',
    confirmBusy: 'Sending…',
    focusClass: 'focus:border-yellow-500',
  },
};

interface ReasonModalProps {
  variant: ReasonVariant;
  /** Modal heading, e.g. "Reject post" / "Reject event". */
  title: string;
  /** Explanatory paragraph — a node so callers can bold the item's title. */
  description: ReactNode;
  placeholder: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function ModerationReasonModal({
  variant,
  title,
  description,
  placeholder,
  isPending,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const meta = VARIANT_META[variant];
  const valid = reason.trim().length >= REASON_MIN;
  const titleId = `moderation-${variant}-modal-title`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4" style={{ backgroundColor: meta.accent }}>
          <h2 id={titleId} className="font-bold text-white text-lg flex items-center gap-2">
            {meta.icon} {title}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink leading-relaxed">{description}</p>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{meta.label}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
              rows={4}
              placeholder={placeholder}
              className={`w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none ${meta.focusClass} transition-colors resize-y`}
              autoFocus
            />
            <p className="text-xs text-ink-muted mt-1">
              {reason.length}/{REASON_MAX} — minimum {REASON_MIN} characters
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink border border-border rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: meta.accent }}
          >
            {isPending ? meta.confirmBusy : meta.confirmIdle}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action row
// ---------------------------------------------------------------------------

export interface ModerationCopy {
  /** Heading for the reject modal, e.g. "Reject post". */
  rejectTitle: string;
  rejectDescription: ReactNode;
  rejectPlaceholder: string;
  /** Heading for the request-changes modal. */
  changesTitle: string;
  changesDescription: ReactNode;
  changesPlaceholder: string;
}

interface ModerationActionsProps {
  copy: ModerationCopy;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onRequestChanges: (reason: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
  isRequestingChanges: boolean;
  /**
   * Permanent deletion, for spam and obvious fakes.
   *
   * Optional so a surface that shouldn't offer it simply omits it. Distinct
   * from reject: a rejected item still exists and still has to be dealt with
   * later, which is the wrong outcome for something that should never have
   * been submitted.
   */
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
}

export function ModerationActions({
  copy,
  onApprove,
  onReject,
  onRequestChanges,
  isApproving,
  isRejecting,
  isRequestingChanges,
  onDelete,
  isDeleting = false,
}: ModerationActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const isSubmitting = isApproving || isRejecting || isRequestingChanges || isDeleting;

  async function run(action: () => Promise<void>, fallback: string, close?: () => void) {
    setError('');
    try {
      await action();
      close?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => run(onApprove, 'Approve failed.')}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#38a169' }}
        >
          {isApproving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Approve
        </button>

        <button
          type="button"
          onClick={() => setChangesOpen(true)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
          style={{ color: '#b45309', borderColor: '#fbd38d', backgroundColor: '#fffaf0' }}
        >
          <MessageSquareWarning size={14} />
          Request changes
        </button>

        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-danger border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <X size={14} />
          Reject
        </button>

        {onDelete && (
          <div className="ml-auto">
            {confirmDelete ? (
              // Inline two-step rather than a modal. Deletion is permanent and
              // the row simply vanishes, so it must not be one click away —
              // but a full dialog for clearing spam is friction on the action
              // an admin performs most often.
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Delete permanently?</span>
                <button
                  type="button"
                  onClick={() =>
                    run(onDelete, 'Delete failed.', () => setConfirmDelete(false))
                  }
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-danger hover:opacity-90 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isSubmitting}
                title="Permanently delete — for spam and fakes"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-danger hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {rejectOpen && (
        <ModerationReasonModal
          variant="reject"
          title={copy.rejectTitle}
          description={copy.rejectDescription}
          placeholder={copy.rejectPlaceholder}
          isPending={isRejecting}
          onCancel={() => setRejectOpen(false)}
          onConfirm={(reason) =>
            run(() => onReject(reason), 'Reject failed.', () => setRejectOpen(false))
          }
        />
      )}

      {changesOpen && (
        <ModerationReasonModal
          variant="changes"
          title={copy.changesTitle}
          description={copy.changesDescription}
          placeholder={copy.changesPlaceholder}
          isPending={isRequestingChanges}
          onCancel={() => setChangesOpen(false)}
          onConfirm={(reason) =>
            run(
              () => onRequestChanges(reason),
              'Request changes failed.',
              () => setChangesOpen(false),
            )
          }
        />
      )}
    </>
  );
}
