// =============================================================================
// editor/components/TopBar.tsx
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../../browse/components/StatusBadge';
import type { ChapterStatus } from '../../types';

interface TopBarProps {
  status: ChapterStatus;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  backHref: string;
  breadcrumb?: string; // e.g. "NEO › Respiratory › RDS"
}

// ---------------------------------------------------------------------------
// Save status indicator
// ---------------------------------------------------------------------------

function SaveStatus({
  isDirty,
  isSaving,
  lastSavedAt,
}: {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}) {
  if (isSaving) {
    return (
      <span className="text-xs text-ink-muted animate-pulse">Saving…</span>
    );
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-warning">
        <AlertTriangle size={11} aria-hidden="true" />
        Unsaved changes
      </span>
    );
  }
  if (lastSavedAt) {
    const diff = Math.round((Date.now() - lastSavedAt.getTime()) / 60_000);
    const label =
      diff < 1 ? 'Saved just now' : `Saved ${diff} min ago`;
    return <span className="text-xs text-success">{label}</span>;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Unsaved changes warning modal
// ---------------------------------------------------------------------------

function UnsavedModal({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-0.5 shrink-0 p-2 rounded-full bg-yellow-50">
            <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
          </div>
          <div>
            <h2 id="unsaved-modal-title" className="font-semibold text-ink mb-1">
              Leave without saving?
            </h2>
            <p className="text-sm text-ink-muted">
              You have unsaved changes. If you leave now, your work will be
              lost.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onStay}
            className="px-4 py-2 text-sm font-medium text-ink border border-border
                       rounded-xl hover:bg-gray-50 transition-colors"
          >
            Keep editing
          </button>
          <button
            onClick={onLeave}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl
                       transition-colors"
            style={{ backgroundColor: '#e53e3e' }}
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

export function TopBar({
  status,
  isDirty,
  isSaving,
  lastSavedAt,
  backHref,
  breadcrumb,
}: TopBarProps) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  function handleBack() {
    if (isDirty) {
      setShowModal(true);
    } else {
      navigate(backHref);
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between
                   px-4 sm:px-6 h-14 bg-white border-b border-border shadow-sm"
      >
        {/* Left: back + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-ink-muted
                       hover:text-primary transition-colors shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {breadcrumb && (
            <span className="hidden sm:block text-xs text-ink-muted truncate max-w-xs">
              {breadcrumb}
            </span>
          )}
        </div>

        {/* Right: save status + status badge */}
        <div className="flex items-center gap-4 shrink-0">
          <SaveStatus
            isDirty={isDirty}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
          />
          <StatusBadge status={status} />
        </div>
      </header>

      {showModal && (
        <UnsavedModal
          onStay={() => setShowModal(false)}
          onLeave={() => {
            setShowModal(false);
            navigate(backHref);
          }}
        />
      )}
    </>
  );
}
