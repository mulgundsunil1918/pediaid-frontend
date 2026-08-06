// =============================================================================
// academics/bookmarks/SaveButton.tsx
//
// One component every module drops in. Signed out it is not disabled — it
// routes to sign-in and comes back here, because a dead icon teaches people
// the feature is broken rather than that it needs an account.
// =============================================================================

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

  const saved = ids?.has(`${itemType}:${itemId}`) ?? false;

  function onClick(e: React.MouseEvent) {
    // These often sit inside a card that is itself a link.
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      navigate(`/academics/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggle.mutate({ itemType, itemId });
  }

  if (!withLabel) {
    return (
      <button
        onClick={onClick}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        title={signedIn ? (saved ? 'Saved' : 'Save') : 'Sign in to save'}
        className="p-2 rounded-lg text-ink-muted hover:text-accent hover:bg-gray-50
                   transition-colors flex-shrink-0"
      >
        <Bookmark size={16} className={saved ? 'fill-accent text-accent' : ''} />
      </button>
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
