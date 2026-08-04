// =============================================================================
// academics/admin/pages/SendNotificationPage.tsx
//
// Push a notification to every device that has the app installed. Reuses
// the admin's existing login (JWT) — no separate broadcast key needed, even
// though the backend also accepts one for curl/script use.
//
// Other pages can deep-link here with prefilled fields, e.g. from the CME
// admin page's "Notify everyone" button on a just-approved event:
//   /academics/admin/notify?title=...&body=...&linkPath=/academics/cme/slug
// =============================================================================

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { useSendBroadcast } from '../hooks/useAdmin';

export function SendNotificationPage() {
  const [params] = useSearchParams();

  const [title, setTitle] = useState(params.get('title') ?? '');
  const [body, setBody] = useState(params.get('body') ?? '');
  const [linkPath, setLinkPath] = useState(params.get('linkPath') ?? '');
  const [sentAt, setSentAt] = useState<number | null>(null);

  const broadcast = useSendBroadcast();

  // Access is enforced by AdminGuard in AdminLayout, which asks the server
  // (GET /admin/me). The old check here read the role from localStorage —
  // untrustworthy, and it matched 'admin' exactly, so a super_admin was
  // redirected to login, which then bounced back here: an infinite loop
  // that rendered a blank page.

  const valid = title.trim().length > 0 && body.trim().length > 0;

  async function handleSend() {
    setSentAt(null);
    await broadcast.mutateAsync({
      title: title.trim(),
      body: body.trim(),
      linkPath: linkPath.trim() || undefined,
    });
    setSentAt(Date.now());
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Megaphone size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Send notification
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Pushes to every device with PediAid installed. There's no
                undo, so double-check before sending.
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-card border border-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="e.g. NeoUpdate 2026 registrations are open"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-ink-muted mt-1">{title.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 240))}
              rows={4}
              placeholder="e.g. Early-bird registration closes 15 Aug — grab your slot before prices go up."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-y"
            />
            <p className="text-xs text-ink-muted mt-1">{body.length}/240</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Link (optional)
            </label>
            <input
              type="text"
              value={linkPath}
              onChange={(e) => setLinkPath(e.target.value)}
              placeholder="/academics/cme/some-event-slug"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors font-mono"
            />
            <p className="text-xs text-ink-muted mt-1">
              Where tapping the notification takes the user. Leave blank to
              just open the app.
            </p>
          </div>

          {broadcast.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {broadcast.error instanceof Error
                ? broadcast.error.message
                : 'Failed to send.'}
            </div>
          )}

          {sentAt && !broadcast.isPending && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 size={16} /> Sent to every device.
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!valid || broadcast.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {broadcast.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {broadcast.isPending ? 'Sending…' : 'Send to everyone'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
