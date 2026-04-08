// =============================================================================
// editor/components/SubmitModal.tsx
// =============================================================================

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useSubmitChapter } from '../hooks/useChapterEditor';
import { useNavigate } from 'react-router-dom';

interface SubmitModalProps {
  chapterId: string;
  onClose: () => void;
}

interface Check {
  label: string;
  pass: boolean;
}

export function SubmitModal({ chapterId, onClose }: SubmitModalProps) {
  const { draft } = useEditorStore();
  const submitMutation = useSubmitChapter();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Pre-submission checklist
  // ---------------------------------------------------------------------------

  const checks: Check[] = [
    {
      label: 'Title is at least 5 characters',
      pass: draft.title.trim().length >= 5,
    },
    {
      label: 'At least 2 content blocks',
      pass: draft.blocks.length >= 2,
    },
    {
      label: 'At least 1 reference added',
      pass: draft.references.length >= 1,
    },
    {
      label: 'All image blocks have alt text',
      pass: draft.blocks
        .filter((b) => b.type === 'image')
        .every((b) => b.type === 'image' && b.alt.trim().length > 0),
    },
    {
      label: 'No empty heading or paragraph blocks',
      pass: draft.blocks
        .filter((b) => b.type === 'paragraph' || b.type === 'heading')
        .every((b) =>
          b.type === 'paragraph'
            ? b.text.trim().length > 0
            : b.type === 'heading'
              ? b.text.trim().length > 0
              : true,
        ),
    },
  ];

  const allPass = checks.every((c) => c.pass);

  async function handleConfirm() {
    try {
      await submitMutation.mutateAsync(chapterId);
      navigate('/academics/me/dashboard', {
        state: { toast: 'Chapter submitted for review!' },
      });
    } catch {
      // Error shown inline
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <h2
            id="submit-modal-title"
            className="font-bold text-lg text-ink font-sans"
          >
            Submit for Review
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Check all items before submitting.
          </p>
        </div>

        {/* Checklist */}
        <div className="px-6 py-5 space-y-3">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-3">
              {check.pass ? (
                <CheckCircle2
                  size={18}
                  className="text-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  size={18}
                  className="text-danger shrink-0"
                  aria-hidden="true"
                />
              )}
              <span
                className={[
                  'text-sm',
                  check.pass ? 'text-ink' : 'text-danger',
                ].join(' ')}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="mx-6 mb-5 rounded-xl bg-yellow-50 border border-yellow-200
                        px-4 py-3 flex gap-2">
          <AlertTriangle
            size={15}
            className="text-warning shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-ink-muted">
            Once submitted, you cannot edit this chapter until a moderator
            completes their review.
          </p>
        </div>

        {/* Mutation error */}
        {submitMutation.isError && (
          <p className="mx-6 mb-4 text-sm text-danger">
            {submitMutation.error instanceof Error
              ? submitMutation.error.message
              : 'Submit failed. Please try again.'}
          </p>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitMutation.isPending}
            className="px-4 py-2.5 text-sm font-medium text-ink border border-border
                       rounded-xl hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allPass || submitMutation.isPending}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl
                       transition-colors disabled:opacity-40
                       disabled:cursor-not-allowed"
            style={{ backgroundColor: allPass ? '#1e3a5f' : '#718096' }}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Confirm & Submit →'}
          </button>
        </div>
      </div>
    </div>
  );
}
