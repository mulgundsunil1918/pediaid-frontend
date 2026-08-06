// =============================================================================
// academics/bookmarks/SaveButton.tsx
//
// One component every module drops in. Signed out it is not disabled — it
// routes to sign-in and comes back here, because a dead icon teaches people
// the feature is broken rather than that it needs an account.
// =============================================================================

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBookmarkIds, useToggleBookmark, type ItemType } from './useBookmarks';

export function SaveButton({
  itemType,
  itemId,
  withLabel = false,
}: {
  itemType: ItemType;
  itemId: string;
  withLabel?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = !!useAuthStore((s) => s.accessToken);
  const { data: ids } = useBookmarkIds();
  const toggle = useToggleBookmark();
  const [err, setErr] = useState<string | null>(null);

  const saved = ids?.has(`${itemType}:${itemId}`) ?? false;

  function onClick(e: React.MouseEvent) {
    // These often sit inside a card that is itself a link.
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      navigate(`/academics/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    // Surface failures. Rolling back in silence is indistinguishable from a
    // button that does nothing, which is exactly how this read.
    setErr(null);
    toggle.mutate(
      { itemType, itemId },
      {
        onError: (e) => {
          setErr(e.message || 'Could not save.');
          setTimeout(() => setErr(null), 6000);
        },
      },
    );
  }

  if (!withLabel) {
    return (
      <button
        onClick={onClick}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        title={err ?? (signedIn ? (saved ? 'Saved' : 'Save') : 'Sign in to save')}
        className="p-2 rounded-lg text-ink-muted hover:text-accent hover:bg-gray-50
                   transition-colors flex-shrink-0"
      >
        <Bookmark size={16}
          className={err ? 'text-danger' : saved ? 'fill-accent text-accent' : ''} />
      </button>
    );
  }

  if (err) {
    return (
      <div className="inline-flex flex-col gap-1">
        <button onClick={onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                     font-semibold border bg-white text-danger border-danger/40">
          <Bookmark size={15} /> Save
        </button>
        <span className="text-[11px] text-danger max-w-[220px]">{err}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                  font-semibold border transition-colors ${
        saved
          ? 'bg-accent/10 text-accent border-accent/40'
          : 'bg-white text-ink-muted border-border hover:text-ink'}`}
    >
      <Bookmark size={15} className={saved ? 'fill-accent' : ''} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
