import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initChunkRecovery } from './lib/chunkRecovery';
import { initVersionCheck } from './lib/versionCheck';
import { consumeSsoHandoff } from './academics/auth/ssoHandoff';

// Must run before the first lazy route resolves, so a stale cached
// index.html asking for a deleted bundle self-recovers instead of
// rendering a blank page.
initChunkRecovery();
initVersionCheck();

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

function mount() {
  ReactDOM.createRoot(root!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// MOUNT FIRST, ALWAYS.
//
// This used to await the sign-in handoff before rendering, to avoid a brief
// signed-out flash on guarded pages. That made the entire app's first paint
// depend on a network call: when the backend was cold — Render sleeps after
// inactivity and can take ~30s to wake — the splash screen simply stayed up,
// and a hung request meant it stayed up forever. A blank screen is far worse
// than a flash, and it is worse in exactly the situation where the user is
// already waiting.
//
// The handoff now runs alongside. When it completes it writes to the auth
// store, React re-renders, and the page corrects itself.
mount();
void consumeSsoHandoff();

// -----------------------------------------------------------------------------
// Splash screen hand-off
//
// index.html paints a navy "PediAid" splash immediately so visitors see
// something before the JS bundle finishes parsing. Once React mounts and
// adds its first child into #root, we fade the app in and fade the splash
// out. Uses a MutationObserver so we don't depend on a specific React
// render timing.
// -----------------------------------------------------------------------------
(function handoffSplash() {
  const rootEl = document.getElementById('root');
  const splash = document.getElementById('acad-splash');
  if (!rootEl || !splash) return;

  const reveal = () => {
    // Minimum splash dwell of 400ms so the fade-in animation doesn't
    // get cut off on very fast devices.
    setTimeout(() => {
      rootEl.classList.add('ready');
      splash.classList.add('fading');
      // Remove from DOM after the fade completes so it never blocks
      // clicks on the app.
      setTimeout(() => splash.remove(), 450);
    }, 400);
  };

  if (rootEl.childNodes.length > 0) {
    reveal();
    return;
  }

  const obs = new MutationObserver(() => {
    if (rootEl.childNodes.length > 0) {
      obs.disconnect();
      reveal();
    }
  });
  obs.observe(rootEl, { childList: true });
})();
