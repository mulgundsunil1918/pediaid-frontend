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

      canAuthor: () => {
        return get().hasRole('author', 'moderator', 'admin');
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
