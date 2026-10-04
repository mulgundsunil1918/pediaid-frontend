// =============================================================================
// academics/admin/components/Dialog.tsx
//
// A small accessible modal for the Admin Management screens: Esc closes it,
// clicking the backdrop closes it, focus moves in and returns on close, and
// neither can happen while a request is in flight (a half-finished "remove
// admin" must not be dismissable into an unknown state).
// =============================================================================

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  title: string;
  onClose: () => void;
  /** True while a request is running: blocks every way of closing. */
  busy?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** md = 28rem, lg = 42rem. */
  size?: 'md' | 'lg';
}

export function Dialog({ title, onClose, busy = false, children, footer, size = 'md' }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  // Read through refs so the effect runs once: a parent that passes a new
  // onClose every render must not re-focus the panel on each keystroke.
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busyRef.current) closeRef.current();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl w-full ${
          size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        } max-h-[90vh] flex flex-col outline-none`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <h2 className="font-bold text-ink text-base">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
