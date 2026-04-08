// =============================================================================
// reader/components/TableOfContents.tsx
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { List, X } from 'lucide-react';
import type { ApiBlock } from '../../editor/types/editor.types';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

function buildToc(blocks: ApiBlock[]): TocEntry[] {
  return blocks
    .filter((b): b is Extract<ApiBlock, { type: 'heading' }> =>
      b.type === 'heading' && (b.level === 2 || b.level === 3),
    )
    .map((b) => ({ id: slugify(b.text), text: b.text, level: b.level as 2 | 3 }));
}

// ---------------------------------------------------------------------------
// Active section tracking via IntersectionObserver
// ---------------------------------------------------------------------------

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    observerRef.current?.disconnect();

    const visible = new Set<string>();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        // Pick the first visible heading (topmost in DOM order)
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: '-10% 0px -80% 0px' },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [ids]);

  return active;
}

// ---------------------------------------------------------------------------
// TOC list (shared between desktop panel and mobile drawer)
// ---------------------------------------------------------------------------

function TocList({ entries, active, onClose }: { entries: TocEntry[]; active: string; onClose?: () => void }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onClose?.();
  }

  if (entries.length === 0) {
    return <p className="text-xs text-ink-muted italic">No headings found.</p>;
  }

  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => scrollTo(entry.id)}
              className={[
                'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                entry.level === 3 ? 'pl-5' : '',
                active === entry.id
                  ? 'bg-blue-50 text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-gray-50',
              ].join(' ')}
            >
              {entry.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Desktop sticky panel
// ---------------------------------------------------------------------------

export function TableOfContents({ blocks }: { blocks: ApiBlock[] }) {
  const entries = buildToc(blocks);
  const active = useActiveSection(entries.map((e) => e.id));

  return (
    <aside
      className="hidden lg:block w-60 shrink-0"
      aria-label="Chapter contents"
    >
      <div
        className="sticky top-6 rounded-xl bg-bg p-4"
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <p className="text-[0.75rem] font-semibold text-ink-muted uppercase
                      tracking-widest mb-3">
          Contents
        </p>
        <TocList entries={entries} active={active} />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile floating button + drawer
// ---------------------------------------------------------------------------

export function MobileToc({ blocks }: { blocks: ApiBlock[] }) {
  const [open, setOpen] = useState(false);
  const entries = buildToc(blocks);
  const active = useActiveSection(entries.map((e) => e.id));

  if (entries.length === 0) return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 flex items-center
                   gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm
                   font-semibold transition-colors"
        style={{ backgroundColor: '#1e3a5f' }}
        aria-label="Open table of contents"
      >
        <List size={15} aria-hidden="true" />
        Contents
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl
                       shadow-2xl px-5 py-5 max-h-[60vh] overflow-y-auto"
            role="dialog"
            aria-label="Table of contents"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-ink">Contents</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <TocList entries={entries} active={active} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
