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

// A session handed over from the PediAid app has to land before anything
// auth-dependent renders — otherwise the first paint is signed-out and every
// guarded page flashes its logged-out state before correcting itself.
// consumeSsoHandoff resolves either way and returns immediately when there is
// no code, so the normal path is not delayed.
void consumeSsoHandoff().finally(mount);

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
