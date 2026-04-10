// =============================================================================
// store/authStore.ts — Zustand auth store for PediAid Academics
//
// Persistence model:
//   - localStorage (NOT sessionStorage) so closing the tab does not log the
//     user out. The combination of a long-lived refresh token on the server
//     and this persisted store is what powers "stay logged in permanently
//     until you manually click Logout".
//   - Both accessToken and refreshToken are stored. The access token is
//     rotated by the silent-refresh loop every ~50 minutes; the refresh
//     token itself is rotated each time /auth/refresh is called.
//   - clearAuth wipes both — it should ONLY be called on explicit logout
//     or when /auth/refresh itself returns 401 (refresh token truly dead).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, AuthResponse, AcadUserRole } from '../academics/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;

  // Actions
  setAuth: (response: AuthResponse) => void;
  /**
   * Updates only the access token (used by the silent refresh loop when the
   * backend returns a new token pair — the refresh token is also rotated).
   */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;

  // Derived helpers
  isAuthenticated: () => boolean;
  hasRole: (...roles: AcadUserRole[]) => boolean;
  canAuthor: () => boolean;
  canModerate: () => boolean;
  canAdmin: () => boolean;
  isPendingRoleApproval: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth: (response: AuthResponse) => {
        set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
        });
      },

      setTokens: ({ accessToken, refreshToken }) => {
        set({ accessToken, refreshToken });
      },

      clearAuth: () => {
        set({ accessToken: null, refreshToken: null, user: null });
      },

      isAuthenticated: () => {
        return get().accessToken !== null && get().user !== null;
      },

      hasRole: (...roles: AcadUserRole[]) => {
        const role = get().user?.role;
        return role !== undefined && roles.includes(role);
      },

      // Approved roles — does NOT include pending_author / pending_moderator.
      // Use this helper to gate "write" actions throughout the UI so anyone
      // waiting for admin approval is correctly locked out.
      canAuthor: () => {
        return get().hasRole('author', 'moderator', 'admin');
      },
      canModerate: () => {
        return get().hasRole('moderator', 'admin');
      },
      canAdmin: () => {
        return get().hasRole('admin');
      },
      /** True while the user's role request is still awaiting admin approval. */
      isPendingRoleApproval: () => {
        return get().hasRole('pending_author', 'pending_moderator');
      },
    }),
    {
      name: 'acad-auth',
      // localStorage — survives tab close and browser restart. The matching
      // server-side refresh token has a 30 day TTL (see
      // ACAD_REFRESH_TOKEN_EXPIRY env var), and the frontend silently rotates
      // the access token every 50 minutes so the user effectively never
      // needs to sign in again until they click Logout.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
