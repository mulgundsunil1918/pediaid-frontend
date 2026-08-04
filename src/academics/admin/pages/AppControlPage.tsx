// =============================================================================
// academics/admin/pages/AppControlPage.tsx
//
// The emergency lever for released apps.
//
// Every dose and calculator constant is compiled into the app, so a mistake
// that ships cannot normally be fixed without a store release and then waiting
// for each user to update — which many never do. These three controls reach
// installed apps on their next launch instead.
//
// The page is written to be read under pressure by someone who has just
// discovered a wrong dose. Each control states plainly what it does to a real
// user's screen, blocking is confirmed separately from the other fields, and
// the current state is shown at the top so it is never ambiguous whether a
// previous block is still in force.
// =============================================================================

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert, Check } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { useAppConfig, useUpdateAppConfig } from '../hooks/useAdmin';
import { safeDate } from '../../../lib/safeDate';

export function AppControlPage() {
  const { data: config, isLoading } = useAppConfig();
  const update = useUpdateAppConfig();

  const [minVersion, setMinVersion] = useState('');
  const [disabledTools, setDisabledTools] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeUrl, setNoticeUrl] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!config) return;
    setMinVersion(config.minVersion ?? '');
    setDisabledTools((config.disabledTools ?? []).join(', '));
    setNotice(config.notice ?? '');
    setNoticeUrl(config.noticeUrl ?? '');
  }, [config]);

  const blockingNow = Boolean(config?.minVersion);
  // Asking for confirmation only when a block is being INTRODUCED. Requiring it
  // to clear one would put a speed bump in front of the recovery action, which
  // is the one moment speed actually matters.
  const introducingBlock = Boolean(minVersion.trim()) && !blockingNow;

  async function save() {
    setError('');
    setSaved(false);
    if (introducingBlock && !confirmBlock) {
      setConfirmBlock(true);
      return;
    }
    try {
      await update.mutateAsync({
        minVersion: minVersion.trim() || null,
        disabledTools: disabledTools
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notice: notice.trim() || null,
        noticeUrl: noticeUrl.trim() || null,
      });
      setConfirmBlock(false);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  const input =
    'w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent';

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">App control</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Reaches installed apps on their next launch — no store release needed.
          Use it when something shipped that shouldn't have.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          <Loader2 size={18} className="animate-spin inline mr-2" />
          Loading…
        </div>
      ) : (
        <div className="max-w-2xl space-y-5">
          {/* Current state first: after an incident it must be unambiguous
              whether a block is still in force. */}
          <div
            className={`rounded-card border p-4 ${
              blockingNow
                ? 'border-danger/40 bg-danger/5'
                : 'border-border bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {blockingNow ? (
                <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" />
              ) : (
                <Check size={18} className="text-success flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold text-ink">
                  {blockingNow
                    ? `Blocking every app below ${config?.minVersion}`
                    : 'Nothing is blocked — the app is running normally'}
                </p>
                {config?.updatedAt && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    Last changed {safeDate(config.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          {saved && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-success">
              Saved. Apps pick this up on their next launch.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Block versions below
            </label>
            <input
              className={input}
              value={minVersion}
              onChange={(e) => {
                setMinVersion(e.target.value);
                setConfirmBlock(false);
              }}
              placeholder="e.g. 1.3.1 — leave blank to block nothing"
            />
            <p className="text-xs text-ink-muted mt-1.5">
              Anyone on an older build gets a full-screen message and{' '}
              <strong className="text-ink">cannot use the app at all</strong>{' '}
              until they update. Only for something genuinely unsafe — a wrong
              dose, a broken calculator.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Disable specific tools
            </label>
            <input
              className={input}
              value={disabledTools}
              onChange={(e) => setDisabledTools(e.target.value)}
              placeholder="tpn-calculator, bilirubin-chart"
            />
            <p className="text-xs text-ink-muted mt-1.5">
              Comma-separated. Those screens show a notice instead of the tool,
              and the rest of the app keeps working — usually the better first
              move when one calculator is wrong.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Notice
            </label>
            <textarea
              className={`${input} min-h-[80px]`}
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="Correction issued for TPN dosing — please update."
            />
            <p className="text-xs text-ink-muted mt-1.5">
              Shown to everyone. Also used as the explanation on the blocking
              screen, so say what is wrong rather than just "please update" —
              a reason people can act on is one they will not ignore.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Notice link (optional)
            </label>
            <input
              className={input}
              value={noticeUrl}
              onChange={(e) => setNoticeUrl(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.pediaid.pediaid"
            />
          </div>

          {confirmBlock && (
            <div className="rounded-card border border-danger/40 bg-danger/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    This locks every app below {minVersion.trim()}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    Anyone on an older build loses access entirely, including
                    mid-shift. Press Save again to confirm.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={update.isPending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${
              confirmBlock ? 'bg-danger' : ''
            }`}
            style={confirmBlock ? undefined : { backgroundColor: '#1e3a5f' }}
          >
            {update.isPending && <Loader2 size={15} className="animate-spin" />}
            {confirmBlock ? 'Yes — block those versions' : 'Save'}
          </button>

          <p className="text-xs text-ink-muted pt-2 border-t border-border">
            Apps read this on launch. If the server is unreachable they fall back
            to a static copy and, failing that, carry on working normally — a
            safety switch that bricks the app when the network is down would do
            more harm than the rare bad release it exists for.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
