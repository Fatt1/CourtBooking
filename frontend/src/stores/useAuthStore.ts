import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setCredentials: (user: User, token: string, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,

        setCredentials: (user, token, refreshToken = '') =>
          set(
            { user, accessToken: token, refreshToken: refreshToken || null, isAuthenticated: true },
            false,
            'auth/setCredentials'
          ),

        setAccessToken: (token: string) =>
          set(
            { accessToken: token, isAuthenticated: true },
            false,
            'auth/setAccessToken'
          ),

        updateUser: (partialUser) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...partialUser } : null,
            }),
            false,
            'auth/updateUser'
          ),

        logout: () =>
          set(
            { user: null, accessToken: null, refreshToken: null, isAuthenticated: false },
            false,
            'auth/logout'
          ),
      })),
      {
        name: 'court-booking-auth',
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
