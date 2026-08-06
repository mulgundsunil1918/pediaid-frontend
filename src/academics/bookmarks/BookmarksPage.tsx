// =============================================================================
// academics/bookmarks/BookmarksPage.tsx — /academics/saved
//
// Everything saved, in one place, filterable two ways: by what kind of thing
// it is, and by the tag the user gave it. Type chips are computed from what is
// actually saved, so nobody is offered a filter that leads nowhere.
//
// Every row can be removed from here. A saved list you cannot prune stops
// being a list of things you care about and becomes a list of things you once
// tapped.
// =============================================================================

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Loader2, Tag, Trash2, X } from 'lucide-react';
import {
  ITEM_LABELS, useBookmarks, useRemoveBookmark, useRetagBookmark,
  type Bookmark as Mark, type ItemType,
} from './useBookmarks';
import { useAuthStore } from '../../store/authStore';
import { GUIDELINE_SETS } from '../guidelines/registry';

/**
 * Guideline sets live in a frontend registry, not the database, so the server
 * has no name to send and returns the slug. Resolve it here, where the
 * registry already is, and fall back to the slug if it was retired.
 */
function resolve(m: Mark): { title: string; linkPath: string | null } {
  if (m.itemType !== 'stg') return { title: m.title, linkPath: m.linkPath };
  const g = GUIDELINE_SETS.find((x) => x.slug === m.itemId);
  return {
    title: g?.name ?? m.itemId,
    linkPath: g ? `/academics/guidelines/${g.slug}` : null,
  };
}

function Row({ m }: { m: Mark }) {
  const navigate = useNavigate();
  const remove = useRemoveBookmark();
  const retag = useRetagBookmark();
  const [editing, setEditing] = useState(false);
  const [tag, setTag] = useState(m.tag ?? '');
  const { title, linkPath } = resolve(m);

  return (
    <div className="bg-white border border-border rounded-card p-4 flex items-start gap-3">
      <button
        onClick={() => linkPath && navigate(linkPath)}
        disabled={!linkPath}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary
                           text-[11px] font-bold">
            {ITEM_LABELS[m.itemType]}
          </span>
          {m.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                             bg-accent/10 text-accent text-[11px] font-semibold">
              <Tag size={10} /> {m.tag}
            </span>
          )}
        </div>
        <p className="font-semibold text-ink text-sm">{title}</p>
        {m.subtitle && (
          <p className="text-xs text-ink-muted mt-0.5 capitalize">{m.subtitle}</p>
        )}
      </button>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setEditing((v) => !v)} title="Tag"
          className="p-2 rounded-lg text-ink-muted hover:text-accent hover:bg-gray-50">
          <Tag size={15} />
        </button>
        <button
          onClick={() => remove.mutate({ itemType: m.itemType, itemId: m.itemId })}
          disabled={remove.isPending}
          title="Remove from saved"
          className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-gray-50
                     disabled:opacity-50">
          <Trash2 size={15} />
        </button>
      </div>

      {editing && (
        <div className="w-full basis-full flex gap-2 pt-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. NICU teaching"
            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm
                       text-ink bg-white focus:outline-none focus:border-accent"
          />
          <button
            onClick={() =>
              retag.mutate(
                { itemType: m.itemType, itemId: m.itemId, tag: tag.trim() || null },
                { onSuccess: () => setEditing(false) },
              )
            }
            disabled={retag.isPending}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary
                       text-white disabled:opacity-60">
            Save
          </button>
          <button onClick={() => { setEditing(false); setTag(m.tag ?? ''); }}
            className="p-2 rounded-lg text-ink-muted hover:text-ink">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export function BookmarksPage() {
  const signedIn = !!useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useBookmarks();
  const [type, setType] = useState<ItemType | 'all'>('all');
  const [tag, setTag] = useState<string | 'all'>('all');

  const marks = data?.bookmarks ?? [];
  const tags = data?.tags ?? [];

  // Only offer type chips for kinds actually saved — a filter row leading to
  // "nothing here" reads as a bug.
  const presentTypes = useMemo(
    () => [...new Set(marks.map((m) => m.itemType))],
    [marks],
  );

  const visible = marks.filter(
    (m) =>
      (type === 'all' || m.itemType === type) &&
      (tag === 'all' || m.tag === tag),
  );

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <Bookmark size={28} className="text-accent" />
        <p className="text-sm text-ink text-center max-w-sm">
          Saved items need an account, so they follow you from your phone to
          any other device.
        </p>
        <Link to={`/academics/login?next=${encodeURIComponent('/academics/saved')}`}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link to="/academics"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> All modules
          </Link>
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                 style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#1e3a5f 100%)' }}>
              <Bookmark size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white
                             leading-tight tracking-tight">
                Saved
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                Everything you bookmarked, on every device
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {presentTypes.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={() => setType('all')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border ${
                type === 'all' ? 'bg-primary text-white border-primary'
                               : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
              All
            </button>
            {presentTypes.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border ${
                  type === t ? 'bg-primary text-white border-primary'
                             : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
                {ITEM_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5 items-center">
            <Tag size={13} className="text-ink-muted" />
            <button onClick={() => setTag('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                tag === 'all' ? 'bg-accent text-white border-accent'
                              : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
              Any tag
            </button>
            {tags.map((t) => (
              <button key={t} onClick={() => setTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  tag === t ? 'bg-accent text-white border-accent'
                            : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {isError && (
          <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card
                          text-danger text-sm">
            {error?.message ?? 'Could not load your saved items.'}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            {marks.length === 0
              ? 'Nothing saved yet. Tap the bookmark icon on any trial, guide or event.'
              : 'Nothing matches this filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m) => (
              <Row key={`${m.itemType}:${m.itemId}`} m={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
