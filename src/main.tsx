import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

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
