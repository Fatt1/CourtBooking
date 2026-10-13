import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface AppThemeState {
  theme: Theme;
  sidebarCollapsed: boolean;
  selectedBranchId: string | null;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedBranchId: (branchId: string | null) => void;
}

/**
 * Hàm áp dụng class 'dark' hoặc 'light' vào thẻ <html> của trình duyệt
 */
export function applyThemeToDom(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

// Tự động kiểm tra và áp dụng theme ngay khi file store được nạp
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('court-booking-ui-preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        applyThemeToDom(parsed.state.theme);
      }
    }
  } catch {
    // ignore
  }
}

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      selectedBranchId: null,

      setTheme: (theme) => {
        applyThemeToDom(theme);
        set({ theme });
      },

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'court-booking-ui-preferences',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDom(state.theme);
        }
      },
    }
  )
);
