// =============================================================================
// components/ErrorBoundary.tsx
//
// Turns a crash into a readable message instead of a blank white page.
//
// React unmounts the whole tree when a render throws and nothing catches it,
// so the page goes silently white. The only way to find out what happened is
// to open the browser console — which nobody outside development does. That
// makes real bugs invisible and impossible to report usefully.
//
// This catches the error, shows what broke, and offers the two things that
// actually fix most cases: reload, or reload with caches cleared.
// =============================================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the full trace in the console for anyone who does look.
    console.error('[ErrorBoundary] Render failed:', error, info.componentStack);
  }

  private handleHardReload = async () => {
    // A stale cached bundle is a common cause, so offer a real cache clear
    // rather than a plain reload, which may just re-read the same bad copy.
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* best effort */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-border rounded-2xl shadow-card p-8">
          <h1 className="text-xl font-bold text-ink mb-2">This page hit an error</h1>
          <p className="text-sm text-ink-muted mb-5">
            Something broke while loading this screen. The details below help pin down
            what — reloading fixes most cases.
          </p>

          <pre className="text-xs bg-gray-50 border border-border rounded-xl p-3 mb-5 overflow-x-auto whitespace-pre-wrap break-words text-danger">
            {error.message || String(error)}
          </pre>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleHardReload}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink border border-border hover:bg-gray-50"
            >
              Clear cache and reload
            </button>
            <a
              href="/academics"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Back to Academics
            </a>
          </div>
        </div>
      </div>
    );
  }
}
