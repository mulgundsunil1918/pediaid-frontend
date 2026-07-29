// =============================================================================
// academics/admin/pages/SystemStatusPage.tsx
//
// Live infrastructure status, folded into the same dashboard as content
// moderation so there's one admin panel, not a separate status site.
//
// Ported from the standalone status.github.io page. Same rules carry over:
//   - Nothing runs automatically. Every check here is a real network call
//     (the backend one runs a live `SELECT 1`), so this only fires when an
//     admin presses "Check now" — never on mount, never on a timer.
//   - Red = genuinely broken. Yellow = an intentional pending-setup state
//     (console-mode email, unconfigured Firebase keys) that looks bad but
//     isn't a failure. Mixing those up is worse than not checking at all.
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  RadioTower,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import { API_BASE } from '../../../lib/apiBase';

type CheckId = 'backend' | 'app' | 'academics' | 'landing';

const CHECKS: { id: CheckId; title: string; sub: string; url: string }[] = [
  {
    id: 'backend',
    title: 'Backend API',
    sub: 'pediaid-backend.onrender.com — may take ~30s to wake from sleep',
    url: `${API_BASE}/api/academics/health`,
  },
  {
    id: 'app',
    title: 'PediAid App',
    sub: 'pediaid.bridgr.co.in — the main app',
    url: 'https://pediaid.bridgr.co.in/',
  },
  {
    id: 'academics',
    title: 'PediAid Academics',
    sub: 'academics.pediaid.bridgr.co.in — this site',
    url: 'https://academics.pediaid.bridgr.co.in/',
  },
  {
    id: 'landing',
    title: 'Landing Page',
    sub: 'info.pediaid.bridgr.co.in — public front page',
    url: 'https://info.pediaid.bridgr.co.in/',
  },
];

interface HostResult {
  up: boolean;
  ms: number;
  checkedAt: string;
}

interface HealthChecks {
  database?: string;
  email?: string;
  storage?: string;
  firebasePush?: string;
  authTestingMode?: string;
}

interface KnownIssue {
  title: string;
  detail: string;
  eta?: string;
}

type Tone = 'green' | 'yellow' | 'red' | 'gray';

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-success/10 text-success border-success/30',
  yellow: 'bg-warning/10 text-warning border-warning/30',
  red: 'bg-danger/10 text-danger border-danger/30',
  gray: 'bg-gray-100 text-ink-muted border-border',
};

const TONE_DOT: Record<Tone, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
  gray: 'bg-gray-300',
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${TONE_CLASSES[tone]}`}
    >
      <span className={`w-2 h-2 rounded-full ${TONE_DOT[tone]}`} />
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SystemStatusPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) {
    return (
      <Navigate
        to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
    );
  }

  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [hostResults, setHostResults] = useState<Partial<Record<CheckId, HostResult>>>({});
  const [health, setHealth] = useState<HealthChecks | null>(null);
  const [backendReachable, setBackendReachable] = useState(false);

  async function runAllChecks() {
    setChecking(true);
    const next: Partial<Record<CheckId, HostResult>> = {};

    await Promise.all(
      CHECKS.map(async (c) => {
        const start = performance.now();
        const stamp = () =>
          new Date().toLocaleTimeString('en-IN', { hour12: false });

        if (c.id === 'backend') {
          try {
            const res = await fetch(c.url, { mode: 'cors', cache: 'no-store' });
            next[c.id] = {
              up: res.ok,
              ms: Math.round(performance.now() - start),
              checkedAt: stamp(),
            };
            if (res.ok) {
              const data = await res.json().catch(() => null);
              setHealth(data?.checks ?? null);
              setBackendReachable(true);
            } else {
              setHealth(null);
              setBackendReachable(false);
            }
          } catch {
            next[c.id] = {
              up: false,
              ms: Math.round(performance.now() - start),
              checkedAt: stamp(),
            };
            setHealth(null);
            setBackendReachable(false);
          }
          return;
        }

        // Static GitHub Pages sites don't send CORS headers, so we can't
        // read a real status code — but a resolved no-cors fetch still
        // proves the server answered, and a network error still proves
        // it didn't. That's enough to tell "up" from "down".
        try {
          await fetch(c.url, { mode: 'no-cors', cache: 'no-store' });
          next[c.id] = {
            up: true,
            ms: Math.round(performance.now() - start),
            checkedAt: stamp(),
          };
        } catch {
          next[c.id] = {
            up: false,
            ms: Math.round(performance.now() - start),
            checkedAt: stamp(),
          };
        }
      }),
    );

    setHostResults(next);
    setCheckedOnce(true);
    setChecking(false);
  }

  const upCount = Object.values(hostResults).filter((r) => r?.up).length;
  const allUp = checkedOnce && upCount === CHECKS.length;

  const knownIssues: KnownIssue[] = [];
  if (checkedOnce && backendReachable && health && health.database !== 'ok') {
    knownIssues.push({
      title: 'Neon PostgreSQL is paused — monthly compute quota exhausted',
      detail:
        "The database isn't accepting connections right now. Anything that reads or writes live data — login, Never Again posts, CME submissions, guide search, the visitor counter — will fail until it resets. Static content and the offline calculators are unaffected.",
      eta: 'Resets automatically 1 Aug 2026 with the new billing cycle. This card clears itself next time you press "Check now" after it\'s back.',
    });
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <RadioTower size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                System Status
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Live infrastructure health — checked only when you press the
                button below, never automatically.
              </p>
            </div>
          </div>
        </header>

        <button
          type="button"
          onClick={runAllChecks}
          disabled={checking}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 mb-6"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking…' : 'Check now'}
        </button>

        {/* Overall banner */}
        <div
          className={`rounded-2xl border px-5 py-4 mb-6 font-semibold text-sm flex items-center gap-2 ${
            !checkedOnce
              ? 'bg-gray-50 border-border text-ink-muted'
              : allUp
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {!checkedOnce ? (
            <>
              <HelpCircle size={18} /> Not checked yet — press "Check now" above.
            </>
          ) : allUp ? (
            <>
              <CheckCircle2 size={18} /> All systems live — everything is up and
              running.
            </>
          ) : (
            <>
              <AlertTriangle size={18} /> {upCount} of {CHECKS.length} sites
              responding — see below.
            </>
          )}
        </div>

        {/* Known issues */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2">
            Known issues
          </h2>
          {!checkedOnce ? (
            <div className="rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm text-ink-muted">
              Not checked yet.
            </div>
          ) : knownIssues.length === 0 ? (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
              No known issues right now.
            </div>
          ) : (
            <div className="space-y-3">
              {knownIssues.map((issue) => (
                <div
                  key={issue.title}
                  className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
                >
                  <p className="text-sm font-bold text-danger mb-1">
                    {issue.title}
                  </p>
                  <p className="text-sm text-ink leading-relaxed mb-1.5">
                    {issue.detail}
                  </p>
                  {issue.eta && (
                    <p className="text-xs text-ink-muted italic">{issue.eta}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hosting */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2">
            Hosting
          </h2>
          <div className="bg-white rounded-2xl shadow-card border border-border divide-y divide-border overflow-hidden">
            {CHECKS.map((c) => {
              const r = hostResults[c.id];
              const tone: Tone = !checkedOnce ? 'gray' : r?.up ? 'green' : 'red';
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{c.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{c.sub}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r && (
                      <span className="text-xs text-ink-muted tabular-nums">
                        {r.ms} ms
                      </span>
                    )}
                    <Pill tone={tone}>
                      {!checkedOnce ? 'Unchecked' : r?.up ? 'Live' : 'Not responding'}
                    </Pill>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Backend dependencies */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-2">
            Backend dependencies
          </h2>
          <div className="bg-white rounded-2xl shadow-card border border-border divide-y divide-border overflow-hidden">
            {/* Database */}
            <StatusRow
              title="Database (Neon Postgres)"
              sub={
                !checkedOnce
                  ? 'Not checked yet'
                  : !backendReachable
                    ? 'Unknown — backend unreachable'
                    : health?.database === 'ok'
                      ? 'Connected'
                      : 'Paused — quota exhausted'
              }
              tone={
                !checkedOnce || !backendReachable
                  ? 'gray'
                  : health?.database === 'ok'
                    ? 'green'
                    : 'red'
              }
              label={
                !checkedOnce
                  ? 'Unchecked'
                  : !backendReachable
                    ? 'Unknown'
                    : health?.database === 'ok'
                      ? 'Connected'
                      : 'Paused'
              }
            />
            {/* Email */}
            <StatusRow
              title="Email (Gmail SMTP)"
              sub={
                !checkedOnce
                  ? 'Not checked yet'
                  : !backendReachable
                    ? 'Unknown — backend unreachable'
                    : health?.email === 'ok'
                      ? 'pediaid.app@gmail.com · sending real emails'
                      : 'EMAIL_MODE=console on Render — emails print to logs only, not sent'
              }
              tone={
                !checkedOnce || !backendReachable
                  ? 'gray'
                  : health?.email === 'ok'
                    ? 'green'
                    : 'yellow'
              }
              label={
                !checkedOnce
                  ? 'Unchecked'
                  : !backendReachable
                    ? 'Unknown'
                    : health?.email === 'ok'
                      ? 'Connected'
                      : 'Console mode'
              }
            />
            {/* Firebase push */}
            <StatusRow
              title="Push notifications (Firebase)"
              sub={
                !checkedOnce
                  ? 'Not checked yet'
                  : !backendReachable
                    ? 'Unknown — backend unreachable'
                    : health?.firebasePush === 'ok'
                      ? 'Broadcast is wired up and active'
                      : 'Needs FIREBASE_SERVICE_ACCOUNT_JSON + ADMIN_BROADCAST_KEY on Render'
              }
              tone={
                !checkedOnce || !backendReachable
                  ? 'gray'
                  : health?.firebasePush === 'ok'
                    ? 'green'
                    : 'yellow'
              }
              label={
                !checkedOnce
                  ? 'Unchecked'
                  : !backendReachable
                    ? 'Unknown'
                    : health?.firebasePush === 'ok'
                      ? 'Active'
                      : 'Needs Render keys'
              }
            />
            {/* Auth mode */}
            <StatusRow
              title="Auth mode"
              sub={
                !checkedOnce
                  ? 'Not checked yet'
                  : !backendReachable
                    ? 'Unknown — backend unreachable'
                    : health?.authTestingMode === 'on'
                      ? 'TESTING_MODE=true on Render — turn off before wider launch'
                      : 'Production mode'
              }
              tone={
                !checkedOnce || !backendReachable
                  ? 'gray'
                  : health?.authTestingMode === 'on'
                    ? 'yellow'
                    : 'green'
              }
              label={
                !checkedOnce
                  ? 'Unchecked'
                  : !backendReachable
                    ? 'Unknown'
                    : health?.authTestingMode === 'on'
                      ? 'Testing mode ON'
                      : 'Production mode'
              }
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function StatusRow({
  title,
  sub,
  tone,
  label,
}: {
  title: string;
  sub: string;
  tone: Tone;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-muted mt-0.5">{sub}</p>
      </div>
      <div className="shrink-0">
        <Pill tone={tone}>{label}</Pill>
      </div>
    </div>
  );
}
