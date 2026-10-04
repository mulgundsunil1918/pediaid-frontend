// =============================================================================
// academics/admin/pages/AdminsPage.tsx
// Route: /academics/admin/admins   (super admins only)
//
// Who may sign in to this panel, and what each person may do in it.
//
// Every change here takes effect on the person's very next click: the server
// checks the database on each request, not a token issued days ago. So
// "Disable" and "Remove" mean what they say, and the confirmations below say so
// in plain words rather than describing the mechanism.
//
// The lockout rules (you cannot demote, disable or remove yourself; the last
// active super admin cannot be removed) are enforced by the server. This page
// hides the buttons where it can and shows the server's explanation where it
// cannot, so the rules never depend on the screen being right.
// =============================================================================

import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  History,
  Info,
  Loader2,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { Dialog } from '../components/Dialog';
import { PermissionMatrix } from '../components/PermissionMatrix';
import {
  useAdminLoginHistory,
  useAdmins,
  useGrantAdmin,
  useRemoveAdmin,
  useSetAdminActive,
  useUpdateAdmin,
  type AdminAccount,
  type AdminModule,
  type AdminTier,
} from '../hooks/useAdminManagement';
import {
  accessSummary,
  describeFailure,
  displayName,
  formatWhen,
  initials,
  relativeWhen,
} from '../lib/describe';

const NAVY = '#1e3a5f';
const field =
  'w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60';
const quietBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-ink border border-border hover:bg-gray-50 disabled:opacity-60';

const allKeys = (modules: AdminModule[]) =>
  modules.flatMap((m) => [`${m.key}.read`, `${m.key}.write`]);

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / edit
// ---------------------------------------------------------------------------

function RoleChoice({
  value,
  onChange,
  disabled,
}: {
  value: AdminTier;
  onChange: (r: AdminTier) => void;
  disabled?: boolean;
}) {
  const options: { id: AdminTier; title: string; body: string }[] = [
    {
      id: 'admin',
      title: 'Administrator',
      body: 'Can use only the areas you tick below.',
    },
    {
      id: 'super_admin',
      title: 'Super admin',
      body: 'Can use everything, and add, change and remove other administrators.',
    },
  ];
  return (
    <fieldset disabled={disabled} className="grid sm:grid-cols-2 gap-3">
      <legend className="sr-only">Type of access</legend>
      {options.map((o) => (
        <label
          key={o.id}
          className={`cursor-pointer rounded-xl border p-3.5 text-left transition-colors ${
            value === o.id ? 'border-accent bg-blue-50/60' : 'border-border hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="admin-tier"
            className="sr-only"
            checked={value === o.id}
            onChange={() => onChange(o.id)}
          />
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span
              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                value === o.id ? 'border-accent' : 'border-border'
              }`}
              aria-hidden="true"
            >
              {value === o.id && <span className="h-2 w-2 rounded-full bg-accent" />}
            </span>
            {o.title}
          </span>
          <span className="block text-xs text-ink-muted mt-1 leading-snug">{o.body}</span>
        </label>
      ))}
    </fieldset>
  );
}

type FormMode = { mode: 'add' } | { mode: 'edit'; admin: AdminAccount };

function AdminFormDialog({
  form,
  modules,
  onClose,
}: {
  form: FormMode;
  modules: AdminModule[];
  onClose: () => void;
}) {
  const grant = useGrantAdmin();
  const update = useUpdateAdmin();
  const editing = form.mode === 'edit' ? form.admin : null;

  // A legacy administrator has no limits recorded and so can do everything:
  // show that truthfully (everything ticked) instead of an empty grid that would
  // look like "can do nothing".
  const initialPerms = useMemo(() => {
    if (!editing || editing.role === 'super_admin') return [];
    const p = editing.permissions;
    if (p === null || p.length === 0) return allKeys(modules);
    return p.filter((x) => x !== 'unreadable.grants');
  }, [editing, modules]);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminTier>(editing?.role ?? 'admin');
  const [perms, setPerms] = useState<string[]>(initialPerms);
  const [error, setError] = useState('');

  const busy = grant.isPending || update.isPending;
  const demoting = editing?.role === 'super_admin' && role === 'admin';
  const legacy =
    editing?.role === 'admin' && (editing.permissions === null || editing.permissions.length === 0);
  const unreadable = editing?.permissions?.includes('unreadable.grants') ?? false;

  async function submit() {
    setError('');
    if (!editing && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter the email address the person signs in with.');
      return;
    }
    if (role === 'admin' && perms.length === 0) {
      setError('Tick at least one thing they can do — or choose Super admin.');
      return;
    }
    try {
      if (editing) {
        const roleChanged = role !== editing.role;
        const permsChanged = role === 'admin' && (legacy || unreadable || !sameSet(perms, initialPerms));
        if (!roleChanged && !permsChanged) {
          onClose();
          return;
        }
        await update.mutateAsync({
          id: editing.id,
          role: roleChanged ? role : undefined,
          permissions: role === 'admin' ? perms : undefined,
        });
      } else {
        await grant.mutateAsync({
          email: email.trim(),
          role,
          permissions: role === 'admin' ? perms : undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <Dialog
      title={editing ? `Edit access — ${displayName(editing)}` : 'Add an administrator'}
      onClose={onClose}
      busy={busy}
      size="lg"
      footer={
        <>
          <button type="button" className={quietBtn} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            style={{ backgroundColor: NAVY }}
            onClick={submit}
            disabled={busy}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {editing ? 'Save changes' : 'Give access'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {!editing && (
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold text-ink mb-1.5">
              Their email
            </label>
            <input
              id="admin-email"
              type="email"
              autoFocus
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
            />
            <p className="text-xs text-ink-muted mt-1.5 flex gap-1.5">
              <Info size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                They need to have signed in to PediAid once, with Google or Apple. If they
                haven't, ask them to — there's no password to create here.
              </span>
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-ink mb-1.5">Type of access</p>
          <RoleChoice value={role} onChange={setRole} disabled={busy} />
          {demoting && (
            <p className="text-xs text-warning mt-2 flex gap-1.5">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                They will lose the ability to manage administrators. Tick what they should
                still be able to do.
              </span>
            </p>
          )}
        </div>

        {role === 'admin' ? (
          <div>
            <p className="text-sm font-semibold text-ink mb-1.5">What they can do</p>
            {legacy && (
              <p className="text-xs text-ink-muted mb-2 flex gap-1.5">
                <Info size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  No limits were ever set for this account, so it can use everything. Saving
                  records exactly what is ticked below.
                </span>
              </p>
            )}
            {unreadable && (
              <p className="text-xs text-warning mb-2 flex gap-1.5">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  This account's saved access couldn't be read, so right now it can do nothing.
                  Tick what it should have and save.
                </span>
              </p>
            )}
            <PermissionMatrix modules={modules} value={perms} onChange={setPerms} disabled={busy} />
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 border border-border px-4 py-3 text-sm text-ink-muted">
            Super admins can do everything, so there's nothing to tick.
          </p>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Confirm: disable / enable / remove
// ---------------------------------------------------------------------------

type ConfirmKind = 'disable' | 'enable' | 'remove';

function ConfirmDialog({
  kind,
  admin,
  onClose,
}: {
  kind: ConfirmKind;
  admin: AdminAccount;
  onClose: () => void;
}) {
  const setActive = useSetAdminActive();
  const remove = useRemoveAdmin();
  const [error, setError] = useState('');
  const busy = setActive.isPending || remove.isPending;
  const name = displayName(admin);

  const copy: Record<ConfirmKind, { title: string; body: ReactNode; cta: string; danger: boolean }> = {
    disable: {
      title: `Disable ${name}?`,
      body: (
        <>
          <strong>{name}</strong> won't be able to sign in or use the admin panel —
          immediately, even if they're signed in right now. Their account and everything they
          wrote stay as they are. You can turn access back on at any time.
        </>
      ),
      cta: 'Disable',
      danger: true,
    },
    enable: {
      title: `Turn access back on for ${name}?`,
      body: (
        <>
          <strong>{name}</strong> will be able to sign in and use the admin panel again, with
          the same access they had before.
        </>
      ),
      cta: 'Turn on',
      danger: false,
    },
    remove: {
      title: `Remove ${name} as an administrator?`,
      body: (
        <>
          <strong>{name}</strong> becomes an ordinary reader and loses all admin access
          immediately. Their account and anything they wrote stay. To give access back later
          you'd add them again from this page.
        </>
      ),
      cta: 'Remove access',
      danger: true,
    },
  };
  const c = copy[kind];

  async function go() {
    setError('');
    try {
      if (kind === 'remove') await remove.mutateAsync({ id: admin.id });
      else await setActive.mutateAsync({ id: admin.id, isActive: kind === 'enable' });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not do that.');
    }
  }

  return (
    <Dialog
      title={c.title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={quietBtn} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`${primaryBtn} ${c.danger ? 'bg-danger' : ''}`}
            style={c.danger ? undefined : { backgroundColor: NAVY }}
            onClick={go}
            disabled={busy}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {c.cta}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink leading-relaxed">{c.body}</p>
        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// One person's sign-ins
// ---------------------------------------------------------------------------

function HistoryDialog({ admin, onClose }: { admin: AdminAccount; onClose: () => void }) {
  const { data, isLoading, isError, error } = useAdminLoginHistory(admin.id);
  return (
    <Dialog title={`Sign-ins — ${displayName(admin)}`} onClose={onClose} size="lg">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin inline mr-2" />
          Loading…
        </p>
      ) : isError ? (
        <ErrorBox>{error?.message ?? "Couldn't load the history."}</ErrorBox>
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">
          No sign-ins recorded yet. Sign-ins are recorded from now on; earlier ones weren't kept.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {data.map((e) => (
            <li key={e.id} className="py-3 flex items-start gap-3">
              {e.succeeded ? (
                <CheckCircle2 size={17} className="text-success flex-shrink-0 mt-0.5" aria-label="Signed in" />
              ) : (
                <XCircle size={17} className="text-danger flex-shrink-0 mt-0.5" aria-label="Turned away" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink font-medium">
                  {e.succeeded ? 'Signed in' : describeFailure(e.failureReason)}
                </p>
                <p className="text-xs text-ink-muted">
                  {e.device}
                  {e.ip ? ` · ${e.ip}` : ''}
                </p>
              </div>
              <p className="text-xs text-ink-muted text-right flex-shrink-0" title={formatWhen(e.at)}>
                {relativeWhen(e.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// One administrator
// ---------------------------------------------------------------------------

function Pill({ tone, children }: { tone: 'green' | 'grey' | 'navy' | 'amber'; children: ReactNode }) {
  const cls = {
    green: 'bg-green-50 text-success',
    grey: 'bg-gray-100 text-ink-muted',
    navy: 'bg-blue-50 text-primary',
    amber: 'bg-yellow-50 text-warning',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function AdminCard({
  admin,
  modules,
  isYou,
  onEdit,
  onHistory,
  onConfirm,
}: {
  admin: AdminAccount;
  modules: AdminModule[];
  isYou: boolean;
  onEdit: () => void;
  onHistory: () => void;
  onConfirm: (k: ConfirmKind) => void;
}) {
  const access = accessSummary(admin, modules);
  const act =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-ink hover:bg-gray-50';

  return (
    <li
      className={`bg-white rounded-card shadow-card p-4 md:p-5 ${admin.isActive ? '' : 'opacity-80'}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex items-start gap-3 lg:w-80 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: admin.isActive ? NAVY : '#a0aec0' }}
            aria-hidden="true"
          >
            {initials(admin)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              {displayName(admin)}
              {isYou && <span className="ml-2 text-xs font-medium text-ink-muted">(you)</span>}
            </p>
            {displayName(admin) !== admin.email && (
              <p className="text-xs text-ink-muted truncate">{admin.email}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Pill tone={admin.role === 'super_admin' ? 'navy' : 'grey'}>
                {admin.role === 'super_admin' && <ShieldCheck size={12} aria-hidden="true" />}
                {admin.role === 'super_admin' ? 'Super admin' : 'Administrator'}
              </Pill>
              <Pill tone={admin.isActive ? 'green' : 'amber'}>
                {admin.isActive ? 'Active' : 'Disabled'}
              </Pill>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
            Can do
          </p>
          <p className="text-sm text-ink">{access.headline}</p>
          {access.kind === 'unrestricted' && (
            <p className="text-xs text-ink-muted mt-0.5">
              Use “Edit access” to limit it to specific areas.
            </p>
          )}
          {access.kind === 'unreadable' && (
            <p className="text-xs text-warning mt-0.5">Use “Edit access” to set it again.</p>
          )}
          {access.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {access.chips.map((c) => (
                <span
                  key={c.name}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                    c.canChange ? 'bg-blue-50 text-primary font-medium' : 'bg-gray-100 text-ink-muted'
                  }`}
                  title={c.canChange ? `${c.name}: can view and change` : `${c.name}: view only`}
                >
                  {c.canChange && <Check size={11} aria-hidden="true" />}
                  {c.name}
                  <span className="sr-only">{c.canChange ? ' (view and change)' : ' (view only)'}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-44 text-xs text-ink-muted space-y-0.5">
          <p>
            <span className="font-semibold text-ink">Last sign-in</span>
            <br />
            <span title={formatWhen(admin.lastLogin)}>{relativeWhen(admin.lastLogin)}</span>
          </p>
          <p className="pt-1">
            Added {formatWhen(admin.createdAt)}
            {admin.createdByEmail ? ` by ${admin.createdByEmail}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/70">
        <button type="button" className={act} onClick={onHistory}>
          <History size={13} aria-hidden="true" /> Sign-ins
        </button>
        {isYou ? (
          <p className="text-xs text-ink-muted self-center">
            You can't change your own access. Another super admin can.
          </p>
        ) : (
          <>
            <button type="button" className={act} onClick={onEdit}>
              <Pencil size={13} aria-hidden="true" /> Edit access
            </button>
            {admin.isActive ? (
              <button type="button" className={act} onClick={() => onConfirm('disable')}>
                <Power size={13} aria-hidden="true" /> Disable
              </button>
            ) : (
              <button type="button" className={act} onClick={() => onConfirm('enable')}>
                <Power size={13} aria-hidden="true" /> Turn on
              </button>
            )}
            <button
              type="button"
              className={`${act} text-danger border-red-200 hover:bg-red-50`}
              onClick={() => onConfirm('remove')}
            >
              <Trash2 size={13} aria-hidden="true" /> Remove
            </button>
          </>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type OpenDialog =
  | null
  | { kind: 'form'; form: FormMode }
  | { kind: 'history'; admin: AdminAccount }
  | { kind: 'confirm'; action: ConfirmKind; admin: AdminAccount };

export function AdminsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdmins();
  const [open, setOpen] = useState<OpenDialog>(null);
  const close = () => setOpen(null);

  const active = data?.admins.filter((a) => a.isActive).length ?? 0;
  const disabled = (data?.admins.length ?? 0) - active;

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-ink">Administrators</h1>
            <p className="text-sm text-ink-muted mt-0.5 max-w-xl">
              Who can sign in to this panel, and what each person can do in it. Changes apply
              on their very next click — nobody needs to sign out first.
            </p>
          </div>
          <button
            type="button"
            className={primaryBtn}
            style={{ backgroundColor: NAVY }}
            onClick={() => setOpen({ kind: 'form', form: { mode: 'add' } })}
            disabled={!data}
          >
            <UserPlus size={16} aria-hidden="true" /> Add administrator
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" />
            Loading…
          </div>
        ) : isError || !data ? (
          <div className="space-y-3">
            <ErrorBox>{error?.message ?? "Couldn't load the administrators."}</ErrorBox>
            <button type="button" className={quietBtn} onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-ink-muted mb-3">
              {data.admins.length} administrator{data.admins.length === 1 ? '' : 's'}
              {disabled > 0 ? ` · ${disabled} disabled` : ''}
            </p>
            <ul className="space-y-3">
              {data.admins.map((a) => (
                <AdminCard
                  key={a.id}
                  admin={a}
                  modules={data.modules}
                  isYou={a.id === data.you}
                  onEdit={() => setOpen({ kind: 'form', form: { mode: 'edit', admin: a } })}
                  onHistory={() => setOpen({ kind: 'history', admin: a })}
                  onConfirm={(action) => setOpen({ kind: 'confirm', action, admin: a })}
                />
              ))}
            </ul>
            <p className="text-xs text-ink-muted mt-5 max-w-2xl leading-relaxed">
              Everything on this page is recorded in the Activity log, with who did it and when.
              The last active super admin can't be disabled or removed, so there is always
              someone who can manage this list.
            </p>
          </>
        )}
      </div>

      {open?.kind === 'form' && data && (
        <AdminFormDialog form={open.form} modules={data.modules} onClose={close} />
      )}
      {open?.kind === 'history' && <HistoryDialog admin={open.admin} onClose={close} />}
      {open?.kind === 'confirm' && (
        <ConfirmDialog kind={open.action} admin={open.admin} onClose={close} />
      )}
    </AdminLayout>
  );
}
