// =============================================================================
// academics/admin/components/AnnounceButton.tsx
//
// "Notify everyone" — one confirmed control, shared by every module's admin
// queue. The admin publishes first, then presses this; it calls the shared
// /admin/announce endpoint, which composes the message + deep link server-side
// and fans a push + an in-app row out to every user.
//
// Two-step confirm (not a modal): a push cannot be unsent, so it must never be
// one click away — but it also shouldn't be heavier than the action deserves.
// =============================================================================

import { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import { useAnnounce, type AnnounceModule } from '../hooks/useAdmin';

interface AnnounceButtonProps {
  module: AnnounceModule;
  /** The item's id (as a string; never-again ids are numeric but stringify fine). */
  id: string;
}

export function AnnounceButton({ module, id }: AnnounceButtonProps) {
  const announce = useAnnounce();
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
        <Check size={13} aria-hidden="true" /> Notified everyone
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        <Send size={13} aria-hidden="true" /> Notify everyone
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-ink-muted">
        Send a push + in-app alert to all users? Can’t be undone.
      </span>
      <button
        type="button"
        disabled={announce.isPending}
        onClick={() =>
          announce.mutate({ module, id }, { onSuccess: () => setSent(true) })
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
        style={{ backgroundColor: '#e53e3e' }}
      >
        {announce.isPending ? (
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        ) : (
          <Send size={12} aria-hidden="true" />
        )}
        Yes, notify
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={announce.isPending}
        className="px-2 py-1.5 text-xs text-ink-muted hover:text-ink"
      >
        Cancel
      </button>
      {announce.isError && (
        <span className="text-xs text-danger">{announce.error.message}</span>
      )}
    </div>
  );
}
