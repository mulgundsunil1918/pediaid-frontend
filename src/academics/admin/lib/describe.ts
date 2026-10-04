// =============================================================================
// academics/admin/lib/describe.ts
//
// Plain-language labels for the Admin Management screens: what an audit action
// means, what an administrator can do, when something happened. The server
// stores machine names (`trial_publish_toggled`, `admins.manage`); a person
// reading "who did what" should never have to decode one.
// =============================================================================

import type { AdminAccount, AdminModule, AuditEntry } from '../hooks/useAdminManagement';

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeWhen(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatWhen(iso);
}

// ---------------------------------------------------------------------------
// Audit actions
// ---------------------------------------------------------------------------

const ACTIONS: Record<string, string> = {
  // Administrators
  admin_granted: 'Gave someone admin access',
  admin_updated: "Changed an administrator's access",
  admin_enabled: 'Re-enabled an administrator',
  admin_disabled: 'Disabled an administrator',
  admin_revoked: 'Removed admin access',
  // App control and broadcasts
  update_app_config: 'Changed App control',
  push_broadcast: 'Sent a push notification',
  announce: 'Announced something to everyone',
  // Users and credentials
  change_role: "Changed a user's role",
  deactivate_user: 'Deactivated a user',
  reactivate_user: 'Reactivated a user',
  verify_credentials: 'Verified credentials',
  reject_credentials: 'Rejected credentials',
  approve_role_request: 'Approved a role request',
  reject_role_request: 'Rejected a role request',
  // Taxonomy
  create_subject: 'Added a subject',
  update_subject: 'Edited a subject',
  deactivate_subject: 'Switched off a subject',
  create_system: 'Added a system',
  update_system: 'Edited a system',
  deactivate_system: 'Switched off a system',
  create_topic: 'Added a topic',
  update_topic: 'Edited a topic',
  deactivate_topic: 'Switched off a topic',
  // Chapters
  archive_chapter: 'Archived a chapter',
  hard_delete_chapter: 'Permanently deleted a chapter',
  // Never Again
  approve_never_again_post: 'Approved a Never Again post',
  reject_never_again_post: 'Rejected a Never Again post',
  request_changes_never_again_post: 'Asked for changes to a Never Again post',
  update_never_again_post: 'Edited a Never Again post',
  delete_never_again_post: 'Deleted a Never Again post',
  // Events
  create_cme_event: 'Added an event',
  update_cme_event: 'Edited an event',
  cancel_cme_event: 'Cancelled an event',
  approve_cme_event: 'Approved an event',
  reject_cme_event: 'Rejected an event',
  request_changes_cme_event: 'Asked for changes to an event',
  delete_cme_event: 'Deleted an event',
  issue_certificates: 'Issued certificates',
  mark_attendance: 'Marked attendance',
  // Landmark trials and guideline notes
  trial_created: 'Added a landmark trial',
  trial_updated: 'Edited a landmark trial',
  trial_deleted: 'Deleted a landmark trial',
  trial_publish_toggled: 'Published or unpublished a landmark trial',
  trial_moderated: 'Reviewed a submitted trial',
  guideline_note_created: 'Added a guideline note',
  guideline_note_updated: 'Edited a guideline note',
  guideline_note_deleted: 'Deleted a guideline note',
  guideline_note_publish_toggled: 'Published or unpublished a guideline note',
  guideline_note_moderated: 'Reviewed a submitted guideline note',
};

export function describeAction(action: string): string {
  const known = ACTIONS[action];
  if (known) return known;
  const words = action.replace(/[_-]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Unknown action';
}

/** How much care a row deserves at a glance: privileges and removals stand out. */
export type ActionTone = 'privilege' | 'destructive' | 'normal';

export function actionTone(action: string): ActionTone {
  if (/^admin_|^change_role$|^update_app_config$/.test(action)) return 'privilege';
  if (/delete|deactivate|reject|revoked|disabled|cancel|archive/.test(action)) return 'destructive';
  return 'normal';
}

const TARGETS: Record<string, string> = {
  admin: 'Administrator',
  user: 'User',
  trial: 'Landmark trial',
  guideline_note: 'Guideline note',
  app_config: 'App control',
  subject: 'Subject',
  system: 'System',
  topic: 'Topic',
  chapter: 'Chapter',
  cme_event: 'Event',
  never_again_post: 'Never Again post',
  broadcast: 'Notification',
  credentials: 'Credentials',
  role_request: 'Role request',
};

/** "Landmark trial · The CAP Trial" - the kind of thing, then the best name for it. */
export function describeTarget(e: Pick<AuditEntry, 'targetType' | 'targetId' | 'metadata'>): string {
  const kind = e.targetType ? (TARGETS[e.targetType] ?? e.targetType.replace(/_/g, ' ')) : '';
  const m = e.metadata ?? {};
  const name = [m.title, m.name, m.email]
    .find((v): v is string => typeof v === 'string' && v.trim().length > 0);
  const detail = name ?? (e.targetId ? e.targetId.slice(0, 8) : '');
  return [kind, detail].filter(Boolean).join(' · ') || '—';
}

// ---------------------------------------------------------------------------
// What an administrator can do
// ---------------------------------------------------------------------------

/** Chip-sized names. The server's labels are sentences; these fit in a row. */
const SHORT: Record<string, string> = {
  users: 'Users',
  conferences: 'Conferences',
  workshops: 'Workshops',
  credentials: 'Credentials',
  notifications: 'Notifications',
  content: 'Content',
  taxonomy: 'Taxonomy',
  reports: 'Reports',
  settings: 'App control',
};

export function shortModuleName(m: AdminModule): string {
  return SHORT[m.key] ?? m.label;
}

export interface AccessSummary {
  kind: 'super' | 'unrestricted' | 'limited' | 'unreadable';
  headline: string;
  /** Per area: can they change it (true) or only look (false). */
  chips: { name: string; canChange: boolean }[];
}

export function accessSummary(a: AdminAccount, modules: AdminModule[]): AccessSummary {
  if (a.role === 'super_admin') {
    return { kind: 'super', headline: 'Everything, and manages administrators', chips: [] };
  }
  const granted = a.permissions;
  if (granted === null || granted.length === 0) {
    return { kind: 'unrestricted', headline: 'Everything — no limits were ever set', chips: [] };
  }
  if (granted.includes('unreadable.grants')) {
    return {
      kind: 'unreadable',
      headline: "Saved access couldn't be read — nothing allowed until you save it again",
      chips: [],
    };
  }
  const have = new Set(granted);
  const chips = modules
    .filter((m) => have.has(`${m.key}.read`) || have.has(`${m.key}.write`))
    .map((m) => ({ name: shortModuleName(m), canChange: have.has(`${m.key}.write`) }));
  return {
    kind: 'limited',
    headline: `${chips.length} of ${modules.length} areas`,
    chips,
  };
}

/** What a person sees as the name of an administrator. */
export function displayName(a: Pick<AdminAccount, 'fullName' | 'email'>): string {
  const n = a.fullName?.trim();
  return n && n.toLowerCase() !== a.email.toLowerCase() ? n : a.email;
}

export function initials(a: Pick<AdminAccount, 'fullName' | 'email'>): string {
  const n = displayName(a);
  const parts = n.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Turn a sign-in refusal code into words. */
export function describeFailure(reason: string | null): string {
  switch (reason) {
    case 'account_disabled':
      return 'Turned away — account is disabled';
    case 'mfa_failed':
      return 'Turned away — second step failed';
    default:
      return reason ? `Turned away — ${reason.replace(/_/g, ' ')}` : 'Turned away';
  }
}
