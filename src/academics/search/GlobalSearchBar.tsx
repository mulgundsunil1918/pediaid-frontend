// =============================================================================
// academics/search/GlobalSearchBar.tsx — Ctrl+K global search trigger + modal
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { SearchBar } from './components/SearchBar';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Ctrl+K listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when focus is inside a text input or textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && !isTyping) {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------------------
  // Body scroll lock while modal is open
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleSearch = useCallback(
    (q: string) => {
      setIsOpen(false);
      navigate(`/academics/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Compact trigger pill — sits in the NavSidebar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open search (Ctrl+K)"
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink-muted shadow-sm hover:border-accent hover:text-accent transition-colors"
      >
        <Search size={15} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 text-left truncate">Search…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-mono text-ink-muted">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        >
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-white shadow-card-hover overflow-hidden">
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close search"
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-ink-muted hover:text-ink hover:bg-bg transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>

            {/* Search bar */}
            <div className="p-4">
              <SearchBar
                variant="large"
                autoFocus
                onSearch={handleSearch}
              />
            </div>

            {/* Keyboard hint footer */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-ink-muted">
              <span>
                <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono">↵</kbd>
                {' '}to search
              </span>
              <span>
                <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono">↑↓</kbd>
                {' '}to navigate
              </span>
              <span>
                <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono">Esc</kbd>
                {' '}to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
