// =============================================================================
// store/authStore.ts — Zustand auth store for PediAid Academics
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, AuthResponse, AcadUserRole } from '../academics/types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;

  // Actions
  setAuth: (response: AuthResponse) => void;
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
      user: null,

      setAuth: (response: AuthResponse) => {
        set({
          accessToken: response.accessToken,
          user: response.user,
        });
      },

      clearAuth: () => {
        set({ accessToken: null, user: null });
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
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the token + user, not the derived functions
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
