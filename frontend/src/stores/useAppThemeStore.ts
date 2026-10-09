import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface AppThemeState {
  theme: Theme;
  sidebarCollapsed: boolean;
  selectedBranchId: string | null;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedBranchId: (branchId: string | null) => void;
}

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      selectedBranchId: null,

      setTheme: (theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
        set({ theme });
      },

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'court-booking-ui-preferences',
    }
  )
);
