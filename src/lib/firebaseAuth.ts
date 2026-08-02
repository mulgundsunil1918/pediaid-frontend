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

// ── Firebase primitives ─────────────────────────────────────────────────

export async function signInEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function registerEmailAccount(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signInGoogle(): Promise<User> {
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
    default:
      break;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

// ── Legacy backend bridge ───────────────────────────────────────────────

async function bridgePassword(uid: string): Promise<string> {
  const data = new TextEncoder().encode(`pediaid-firebase-bridge:${uid}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

async function backendLogin(email: string, password: string): Promise<AuthResponse | null> {
  const res = await fetch(`${API_BASE}/api/academics/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
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
 * Used from LoginPage after any successful Firebase sign-in (email/password
 * or Google): logs into the matching backend account, auto-provisioning a
 * plain reader account the very first time this Firebase user is seen here.
 * Populates useAuthStore on success — every existing admin/CME/etc. call
 * site keeps working completely unchanged after this.
 */
export async function bridgeSignIn(user: User): Promise<AuthResponse> {
  const password = await bridgePassword(user.uid);
  const email = user.email!;

  const existing = await backendLogin(email, password);
  if (existing) {
    useAuthStore.getState().setAuth(existing);
    return existing;
  }

  await backendRegister(email, password, {
    fullName: user.displayName || email.split('@')[0],
  });
  const fresh = await backendLogin(email, password);
  if (!fresh) {
    throw new Error('Account created, but sign-in failed. Please try signing in again.');
  }
  useAuthStore.getState().setAuth(fresh);
  return fresh;
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
  const password = await bridgePassword(user.uid);
  const email = user.email!;

  const regBody = await backendRegister(email, password, extra);
  if (regBody.requiresApproval) {
    return { requiresApproval: true, auth: null };
  }

  const fresh = await backendLogin(email, password);
  if (fresh) useAuthStore.getState().setAuth(fresh);
  return { requiresApproval: false, auth: fresh };
}
