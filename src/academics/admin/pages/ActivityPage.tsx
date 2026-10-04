// =============================================================================
// academics/admin/pages/ActivityPage.tsx
// Route: /academics/admin/activity   (super admins only)
//
// Two questions about the admin panel, answered after something goes wrong:
//
//   What was done, by whom, to what?   -> "Actions"  (the audit log)
//   Who got in, and who was turned away? -> "Sign-ins"
//
// Both are read-only. Nothing on this page, and no route behind it, can edit or
// delete a row - a log that its subjects can rewrite proves nothing.
// =============================================================================

import { useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import {
  useAdmins,
  useAuditActions,
  useAuditLog,
  useLoginHistory,
  type AuditEntry,
  type AuditFilters,
  type LoginEntry,
} from '../hooks/useAdminManagement';
import {
  actionTone,
  describeAction,
  describeFailure,
  describeTarget,
  formatWhen,
  relativeWhen,
} from '../lib/describe';

const PAGE_SIZE = 25;
const select =
  'px-3 py-2 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent max-w-full';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Pager({
  page,
  total,
  busy,
  onPage,
}: {
  page: number;
  total: number;
  busy: boolean;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const btn =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-ink hover:bg-gray-50 disabled:opacity-40';
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-xs text-ink-muted">
        {total === 0 ? 'Nothing to show' : `Showing ${from}–${to} of ${total}`}
        {busy && <Loader2 size={12} className="animate-spin inline ml-2" aria-label="Loading" />}
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} disabled={page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={13} aria-hidden="true" /> Newer
        </button>
        <button
          type="button"
          className={btn}
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          Older <ChevronRight size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-sm text-ink-muted">{children}</p>;
}

const prettyKey = (k: string) =>
  k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

function prettyValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.map(prettyValue).join(', ') : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ---------------------------------------------------------------------------
// Actions (audit log)
// ---------------------------------------------------------------------------

const DOT: Record<ReturnType<typeof actionTone>, string> = {
  privilege: 'bg-warning',
  destructive: 'bg-danger',
  normal: 'bg-gray-300',
};

function AuditRow({ e }: { e: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const meta = Object.entries(e.metadata ?? {});
  const tone = actionTone(e.action);
  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left grid gap-x-4 gap-y-1 md:grid-cols-[10.5rem_13rem_1fr_auto] items-start"
      >
        <span className="text-xs text-ink-muted" title={formatWhen(e.at)}>
          {relativeWhen(e.at)}
          <span className="block md:hidden">{formatWhen(e.at)}</span>
        </span>
        <span className="text-sm text-ink truncate">{e.actorEmail ?? 'Someone (account removed)'}</span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <span
              className={`h-2 w-2 rounded-full flex-shrink-0 ${DOT[tone]}`}
              aria-hidden="true"
            />
            {describeAction(e.action)}
          </span>
          <span className="block text-xs text-ink-muted truncate pl-4">{describeTarget(e)}</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-ink-muted transition-transform hidden md:block mt-0.5 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <dl className="mt-3 ml-0 md:ml-[10.5rem] rounded-xl bg-gray-50 border border-border px-4 py-3 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-ink-muted">When</dt>
          <dd className="text-ink">{formatWhen(e.at)}</dd>
          <dt className="text-ink-muted">Action</dt>
          <dd className="text-ink font-mono break-all">{e.action}</dd>
          {e.targetId && (
            <>
              <dt className="text-ink-muted">Record</dt>
              <dd className="text-ink font-mono break-all">{e.targetId}</dd>
            </>
          )}
          {e.ip && (
            <>
              <dt className="text-ink-muted">From</dt>
              <dd className="text-ink">{e.ip}</dd>
            </>
          )}
          {meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-muted">{prettyKey(k)}</dt>
              <dd className="text-ink break-words">{prettyValue(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

function ActionsTab() {
  const [filters, setFilters] = useState<AuditFilters>({ action: '', actor: '', from: '', to: '' });
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, isFetching } = useAuditLog(filters, page, PAGE_SIZE);
  const { data: actions } = useAuditActions();
  const { data: admins } = useAdmins();

  const set = (patch: Partial<AuditFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-xs text-ink-muted">
          What
          <select
            className={`${select} block mt-1`}
            value={filters.action}
            onChange={(e) => set({ action: e.target.value })}
          >
            <option value="">Anything</option>
            {(actions ?? []).map((a) => (
              <option key={a} value={a}>
                {describeAction(a)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-muted">
          Who
          <select
            className={`${select} block mt-1`}
            value={filters.actor}
            onChange={(e) => set({ actor: e.target.value })}
          >
            <option value="">Anyone</option>
            {(admins?.admins ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-muted">
          From
          <input
            type="date"
            className={`${select} block mt-1`}
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
          />
        </label>
        <label className="text-xs text-ink-muted">
          To
          <input
            type="date"
            className={`${select} block mt-1`}
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
          />
        </label>
        {filtered && (
          <button
            type="button"
            className="text-xs font-medium text-accent hover:underline pb-2.5"
            onClick={() => set({ action: '', actor: '', from: '', to: '' })}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-card shadow-card px-4 md:px-5">
        {isLoading ? (
          <Empty>
            <Loader2 size={16} className="animate-spin inline mr-2" />
            Loading…
          </Empty>
        ) : isError ? (
          <Empty>
            <span className="text-danger">{error?.message ?? "Couldn't load the log."}</span>
          </Empty>
        ) : !data || data.entries.length === 0 ? (
          <Empty>
            {filtered
              ? 'Nothing matches those filters.'
              : 'Nothing has been recorded yet. Actions are logged from now on.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-border/70">
            {data.entries.map((e) => (
              <AuditRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </div>
      <Pager page={page} total={data?.total ?? 0} busy={isFetching} onPage={setPage} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Sign-ins
// ---------------------------------------------------------------------------

function LoginRow({ e }: { e: LoginEntry }) {
  return (
    <li className="py-3 flex items-start gap-3">
      {e.succeeded ? (
        <CheckCircle2 size={17} className="text-success flex-shrink-0 mt-0.5" aria-label="Signed in" />
      ) : (
        <XCircle size={17} className="text-danger flex-shrink-0 mt-0.5" aria-label="Turned away" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink font-medium truncate">{e.email ?? 'Unknown account'}</p>
        <p className="text-xs text-ink-muted">
          {e.succeeded ? 'Signed in' : describeFailure(e.failureReason)} · {e.device}
          {e.ip ? ` · ${e.ip}` : ''}
        </p>
      </div>
      <p className="text-xs text-ink-muted text-right flex-shrink-0" title={formatWhen(e.at)}>
        {relativeWhen(e.at)}
      </p>
    </li>
  );
}

function SignInsTab() {
  const [failuresOnly, setFailuresOnly] = useState(false);
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, isFetching } = useLoginHistory({
    failuresOnly,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <label className="inline-flex items-center gap-2 text-sm text-ink mb-4 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-[#1e3a5f]"
          checked={failuresOnly}
          onChange={(e) => {
            setFailuresOnly(e.target.checked);
            setPage(0);
          }}
        />
        Only show people who were turned away
      </label>
      <div className="bg-white rounded-card shadow-card px-4 md:px-5">
        {isLoading ? (
          <Empty>
            <Loader2 size={16} className="animate-spin inline mr-2" />
            Loading…
          </Empty>
        ) : isError ? (
          <Empty>
            <span className="text-danger">{error?.message ?? "Couldn't load sign-ins."}</span>
          </Empty>
        ) : !data || data.entries.length === 0 ? (
          <Empty>
            {failuresOnly
              ? 'Nobody has been turned away.'
              : 'No administrator sign-ins recorded yet. They are recorded from now on.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-border/70">
            {data.entries.map((e) => (
              <LoginRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </div>
      <Pager page={page} total={data?.total ?? 0} busy={isFetching} onPage={setPage} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ActivityPage() {
  const [tab, setTab] = useState<'actions' | 'signins'>('actions');
  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        tab === id
          ? 'border-primary text-primary'
          : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-ink">Activity log</h1>
          <p className="text-sm text-ink-muted mt-0.5 max-w-xl">
            What administrators have done in this panel, and who has signed in. Read-only — nothing
            here can be edited or deleted.
          </p>
        </div>
        <div role="tablist" className="flex gap-1 border-b border-border mb-5">
          {tabBtn('actions', 'Actions')}
          {tabBtn('signins', 'Sign-ins')}
        </div>
        {tab === 'actions' ? <ActionsTab /> : <SignInsTab />}
      </div>
    </AdminLayout>
  );
}
