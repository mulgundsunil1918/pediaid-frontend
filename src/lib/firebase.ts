// =============================================================================
// lib/firebase.ts — Firebase app init, shared across the whole frontend.
//
// Same project/web-app config as the Flutter build (lib/firebase_options.dart
// web block there) — one Firebase project, one set of credentials, usable
// from either client. No Firestore here: the web app's profile/role data
// already lives in the backend's acad_users table (via the bridge in
// lib/legacyBridge.ts), so there's nothing for Firestore to own on this side.
// =============================================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

// These values are PUBLIC by design, not secrets. Firebase web config is
// shipped to every browser that loads the app — you cannot use Firebase from a
// client without it, and it is present in the deployed bundle and in Flutter's
// firebase_options.dart already. Google documents this explicitly.
//
// GitGuardian flags the apiKey because it pattern-matches an AIza... Google API
// key, many of which (Maps, Places, Cloud) are billable and genuinely must be
// kept private. Rotating this one would achieve nothing: the replacement would
// be published in the very next build.
//
// What actually protects the project:
//   1. Firestore/Storage rules — verified deny-all except a user's own doc.
//   2. API key restrictions in Google Cloud Console (HTTP referrers + allowed
//      APIs), which stop the key being used against other Google services.
// Never put a value here that is not safe to publish.
const firebaseConfig = {
  apiKey: 'AIzaSyCyNYR5v42yWAIgo8maiSXG8dKX055ji1s',
  appId: '1:11076606207:web:fb572f5ad2c6d487f2d4ca',
  messagingSenderId: '11076606207',
  projectId: 'pediaid-app',
  authDomain: 'pediaid-app.firebaseapp.com',
  storageBucket: 'pediaid-app.firebasestorage.app',
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
