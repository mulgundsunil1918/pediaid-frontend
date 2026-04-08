// =============================================================================
// components/Breadcrumb.tsx
// =============================================================================

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Renders a chevron-separated breadcrumb trail.
 *
 * Mobile behaviour (≤3 items shown): when there are more than 3 levels,
 * middle items collapse to "…" on small screens. The first and last items
 * are always visible.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const shouldCollapse = items.length > 3;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isMiddle = idx > 0 && idx < items.length - 1;

          return (
            <li
              key={idx}
              className={[
                'flex items-center gap-1',
                // On mobile, hide middle items when there are >3 levels
                shouldCollapse && isMiddle ? 'hidden sm:flex' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {idx > 0 && (
                <ChevronRight
                  size={14}
                  className="text-ink-muted shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span className="text-ink-muted font-medium truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="text-accent hover:text-primary font-medium
                             hover:underline transition-colors truncate max-w-[160px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink font-medium truncate max-w-[160px]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}

        {/* Mobile collapse indicator */}
        {shouldCollapse && (
          <li className="flex items-center gap-1 sm:hidden" aria-hidden="true">
            <ChevronRight size={14} className="text-ink-muted" />
            <span className="text-ink-muted">…</span>
            <ChevronRight size={14} className="text-ink-muted" />
          </li>
        )}
      </ol>
    </nav>
  );
}
