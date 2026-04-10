// =============================================================================
// store/authStore.ts — Zustand auth store for PediAid Academics
//
// Persistence model:
//   - localStorage, with each field as its own top-level key so external
//     tooling (the Flutter app, browser extensions, manual debugging) can
//     read them without parsing a zustand JSON blob:
//         acad_access_token   — string
//         acad_refresh_token  — string
//         acad_user           — JSON
//   - The store also reads the legacy zustand key 'acad-auth' as a one-time
//     fallback so existing users upgrading into this build don't get
//     logged out by the key rename.
//   - Backend refresh token TTL is 90 days (ACAD_REFRESH_TOKEN_EXPIRY),
//     access token TTL is 7 days (ACAD_JWT_ACCESS_EXPIRY). The silent
//     refresh loop in sessionRefresh.ts rotates both every 6 days while
//     the tab is open so the access token is always fresh.
//   - clearAuth removes all three keys. It should ONLY run on explicit
//     logout or when /auth/refresh itself fails — never on a normal 401.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { AuthUser, AuthResponse, AcadUserRole } from '../academics/types';

const KEY_ACCESS  = 'acad_access_token';
const KEY_REFRESH = 'acad_refresh_token';
const KEY_USER    = 'acad_user';
const LEGACY_KEY  = 'acad-auth'; // from an earlier zustand persist format

interface PersistedShape {
  state: {
    accessToken: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
  };
  version: number;
}

/**
 * Custom zustand storage adapter that shreds the persisted state into three
 * separate localStorage keys instead of one JSON blob. Zustand expects a
 * StateStorage with getItem/setItem/removeItem returning a JSON string
 * shaped like `{ state, version }`, so this adapter assembles that wrapper
 * on the fly from the three individual keys.
 */
const splitStorage: StateStorage = {
  getItem: (_name) => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const accessToken  = localStorage.getItem(KEY_ACCESS);
      const refreshToken = localStorage.getItem(KEY_REFRESH);
      const userRaw      = localStorage.getItem(KEY_USER);

      // If at least one of the new keys is present, build the wrapper from
      // them. If all three are missing, fall back to the legacy single blob
      // so existing sessions migrate cleanly.
      if (accessToken || refreshToken || userRaw) {
        const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
        const shape: PersistedShape = {
          state: { accessToken, refreshToken, user },
          version: 0,
        };
        return JSON.stringify(shape);
      }

      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        // Zustand already wraps in { state, version } — return as-is and
        // let the first setItem migrate it to the new layout.
        return legacy;
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: (_name, value) => {
    if (typeof localStorage === 'undefined') return;
    try {
      const parsed = JSON.parse(value) as PersistedShape;
      const { accessToken, refreshToken, user } = parsed.state ?? {};
      if (accessToken) localStorage.setItem(KEY_ACCESS, accessToken);
      else             localStorage.removeItem(KEY_ACCESS);
      if (refreshToken) localStorage.setItem(KEY_REFRESH, refreshToken);
      else              localStorage.removeItem(KEY_REFRESH);
      if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
      else      localStorage.removeItem(KEY_USER);
      // Drop the legacy key once we've written the split layout — avoids
      // having two sources of truth after the migration.
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Malformed value — ignore rather than crash the store.
    }
  },

  removeItem: (_name) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(LEGACY_KEY);
  },
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;

  // Actions
  setAuth: (response: AuthResponse) => void;
  /** Updates only the access + refresh tokens during silent rotation. */
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
      // Logical name used by zustand internally. The actual localStorage
      // keys are driven by splitStorage above — zustand just sees a
      // single flat storage layer via createJSONStorage.
      name: 'acad-auth',
      storage: createJSONStorage(() => splitStorage),
      partialize: (state) =>
        ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
        }) as unknown as AuthState,
    },
  ),
);
