// =============================================================================
// academics/admin/components/PermissionMatrix.tsx
//
// The "what may this administrator do" grid: one row per area of the panel,
// "can view" and "can change" boxes. The rows come from the server
// (GET /admins -> modules), so the grid cannot drift from the permissions the
// server actually enforces.
//
// Changing something needs viewing it, so ticking "change" ticks "view" and
// clearing "view" clears "change" - the server refuses the other combinations.
// =============================================================================

import { useMemo } from 'react';
import type { AdminModule } from '../hooks/useAdminManagement';

interface Props {
  modules: AdminModule[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({ modules, value, onChange, disabled = false }: Props) {
  const have = useMemo(() => new Set(value), [value]);
  // One fixed order, so the saved list is the same however it was ticked.
  const order = useMemo(
    () => modules.flatMap((m) => [`${m.key}.read`, `${m.key}.write`]),
    [modules],
  );
  const emit = (next: Set<string>) => onChange(order.filter((p) => next.has(p)));

  function toggle(module: string, action: 'read' | 'write', on: boolean) {
    const next = new Set(have);
    const read = `${module}.read`;
    const write = `${module}.write`;
    if (action === 'write') {
      if (on) {
        next.add(write);
        next.add(read);
      } else {
        next.delete(write);
      }
    } else if (on) {
      next.add(read);
    } else {
      next.delete(read);
      next.delete(write);
    }
    emit(next);
  }

  const preset = (kind: 'all' | 'view' | 'none') =>
    emit(
      new Set(
        kind === 'none'
          ? []
          : kind === 'view'
            ? order.filter((p) => p.endsWith('.read'))
            : order,
      ),
    );

  const areas = modules.filter((m) => have.has(`${m.key}.read`)).length;
  const box = 'h-4 w-4 rounded border-border accent-[#1e3a5f] disabled:opacity-50';
  const chip =
    'px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-ink hover:bg-gray-50 disabled:opacity-50';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs text-ink-muted">Quick set</span>
        <button type="button" className={chip} disabled={disabled} onClick={() => preset('all')}>
          Everything
        </button>
        <button type="button" className={chip} disabled={disabled} onClick={() => preset('view')}>
          View only
        </button>
        <button type="button" className={chip} disabled={disabled} onClick={() => preset('none')}>
          Clear
        </button>
        <span className="ml-auto text-xs text-ink-muted">
          {areas} of {modules.length} areas
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-ink-muted">
              <th className="text-left font-semibold px-3 py-2">Area</th>
              <th className="font-semibold px-3 py-2 w-20 text-center">Can view</th>
              <th className="font-semibold px-3 py-2 w-20 text-center">Can change</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.key} className="border-t border-border/70">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{m.label}</p>
                  <p className="text-xs text-ink-muted leading-snug">{m.description}</p>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    className={box}
                    disabled={disabled}
                    checked={have.has(`${m.key}.read`)}
                    onChange={(e) => toggle(m.key, 'read', e.target.checked)}
                    aria-label={`${m.label}: can view`}
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    className={box}
                    disabled={disabled}
                    checked={have.has(`${m.key}.write`)}
                    onChange={(e) => toggle(m.key, 'write', e.target.checked)}
                    aria-label={`${m.label}: can change`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
