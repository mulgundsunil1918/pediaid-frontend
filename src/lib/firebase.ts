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
