// =============================================================================
// lib/firebaseAuth.ts — Firebase identity + legacy backend bridge.
//
// Firebase Auth is the front door (same project as the Flutter app, so the
// same email+password or Google account works on both). Everything else in
// this app — CME, Never Again, admin, chapters — still talks to the
// pre-Firebase JWT backend (acad_users), so every Firebase sign-in here
// silently logs into (or creates) a matching backend account using a
// password derived from the Firebase uid that nobody ever sees or types.
// This mirrors the Flutter app's AuthProvider._bridgeLegacySession exactly,
// so the same account works identically on both platforms.
// =============================================================================

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  type User,
  type AuthError,
} from 'firebase/auth';
import { firebaseApp } from './firebase';
import { API_BASE } from './apiBase';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../academics/types';

export const auth = getAuth(firebaseApp);

/**
 * Firebase stores its session in IndexedDB by default. When IndexedDB is
 * unavailable — private windows, aggressive privacy settings, a corrupted
 * store, or another tab holding the connection — the SDK throws raw
 * internal errors like "Database is closing", which surfaced to users on
 * the sign-in form.
 *
 * Degrade instead: localStorage, then sessionStorage, then memory. The last
 * one always works; the session simply doesn't outlive the tab. Runs once at
 * module load, and every sign-in awaits it so persistence is settled before
 * any credential call.
 */
const persistenceReady: Promise<void> = (async () => {
  for (const mode of [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]) {
    try {
      await setPersistence(auth, mode);
      return;
    } catch {
      // Try the next, less capable, store.
    }
  }
})();

// ── Firebase primitives ─────────────────────────────────────────────────

export async function signInEmail(email: string, password: string): Promise<User> {
  await persistenceReady;
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function registerEmailAccount(email: string, password: string): Promise<User> {
  await persistenceReady;
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signInGoogle(): Promise<User> {
  await persistenceReady;
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return cred.user;
}

export async function sendReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Errors ───────────────────────────────────────────────────────────────

export function friendlyAuthError(error: unknown): string {
  const code = (error as AuthError)?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect. Please check and try again.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password too weak — please choose at least 6 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/unauthorized-domain':
      return 'This site is not yet authorized for sign-in — contact the admin.';
    case 'auth/internal-error':
      return 'Sign-in is temporarily unavailable. Please try again in a moment.';
    default:
      break;
  }

  // Storage-layer failures from the SDK's IndexedDB session store. These
  // arrive as raw internal text ("Database is closing", "Database deleted by
  // request of the user", ...) and were being shown verbatim on the sign-in
  // form, which is meaningless to a user and looks like data loss.
  const raw = error instanceof Error ? error.message : '';
  if (/database|indexeddb|storage|quota/i.test(raw)) {
    return (
      'Your browser is blocking the storage sign-in needs. ' +
      'Try a normal (non-private) window, or allow cookies and site data for this site.'
    );
  }

  // Never surface raw SDK internals — they leak implementation detail and
  // read as scary nonsense.
  if (raw && /^[A-Za-z ,.'\-]+$/.test(raw) && raw.length < 120) return raw;
  return 'Something went wrong. Please try again.';
}

// ── Legacy backend bridge ───────────────────────────────────────────────

interface RegisterExtra {
  fullName?: string;
  qualification?: string;
  specialty?: string;
  institution?: string;
  bio?: string;
  reason?: string;
  requestedRole?: 'author' | 'moderator';
}

interface RegisterResponseBody {
  message?: string;
  userId?: string;
  requiresApproval?: boolean;
}

/**
 * Exchanges the Firebase ID token this client already holds for the backend's
 * own token pair. The server verifies the token's signature against Google's
 * public certificates, so possession of a genuine Firebase session is the
 * proof of identity.
 *
 * This replaced a scheme where the client derived a password from its own
 * Firebase uid and logged in with it. That derivation shipped in this bundle,
 * so anyone who learned a uid could compute that user's password and sign in
 * as them. A uid is an identifier, not a secret — it must not be usable as
 * a credential.
 */
async function backendFirebaseLogin(user: User): Promise<AuthResponse> {
  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/academics/auth/firebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Could not sign in to PediAid Academics.');
  }
  return (await res.json()) as AuthResponse;
}

async function backendRegister(
  email: string,
  password: string,
  extra: RegisterExtra,
): Promise<RegisterResponseBody> {
  const res = await fetch(`${API_BASE}/api/academics/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...extra }),
  });
  const body = (await res.json().catch(() => ({}))) as RegisterResponseBody;
  if (!res.ok) {
    throw new Error(body.message ?? 'Could not link your account to PediAid Academics.');
  }
  return body;
}

/**
 * A throwaway password for the /register call only. The account is always
 * signed into via the Firebase token exchange afterwards, so this value is
 * never needed again — it exists purely because /register requires the
 * field. Random, so unlike the old uid-derived scheme nobody can recompute it.
 */
function throwawayPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Used from LoginPage after any successful Firebase sign-in (email/password
 * or Google): exchanges the Firebase ID token for a backend session,
 * auto-provisioning a plain reader account the first time this user is seen.
 * Populates useAuthStore on success — every existing admin/CME/etc. call
 * site keeps working completely unchanged after this.
 */
export async function bridgeSignIn(user: User): Promise<AuthResponse> {
  // The endpoint upserts the account itself, so there's no separate
  // register-then-retry dance any more.
  const auth = await backendFirebaseLogin(user);
  useAuthStore.getState().setAuth(auth);
  return auth;
}

/**
 * Used from RegisterPage: an explicit new signup, optionally an
 * author/moderator application carrying the extra profile fields that
 * flow already collects. Always registers (never tries login first) — if
 * requiresApproval comes back, there's no session yet, matching the page's
 * existing pending-review behaviour exactly.
 */
export async function bridgeRegister(
  user: User,
  extra: RegisterExtra,
): Promise<{ requiresApproval: boolean; auth: AuthResponse | null }> {
  const email = user.email!;

  // /register still needs a password field, but it's never used to sign in —
  // the token exchange below is what establishes the session.
  const regBody = await backendRegister(email, throwawayPassword(), extra);
  if (regBody.requiresApproval) {
    return { requiresApproval: true, auth: null };
  }

  const fresh = await backendFirebaseLogin(user);
  useAuthStore.getState().setAuth(fresh);
  return { requiresApproval: false, auth: fresh };
}
