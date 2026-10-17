import { useState, useEffect } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Bell,
  LogOut,
  ExternalLink,
  Store,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCourtOwnerLogoutMutation } from '@/api/auth';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { useOwnerBranchesQuery } from '@/api/branches';
import { cn } from '@/lib/utils';

interface OwnerHeaderProps {
  onMenuClick: () => void;
}

export function OwnerHeader({ onMenuClick }: OwnerHeaderProps) {
  const { user } = useAuthStore();
  const { mutate: logoutCourtOwner } = useCourtOwnerLogoutMutation();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useAppThemeStore();
  const { selectedBranchId, setSelectedBranchId, setBranches, clearBranchState } = useBranchStore();
  const { data: branches = [], isLoading: isLoadingBranches } = useOwnerBranchesQuery();

  const navigate = useNavigate();
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  // Tự động đồng bộ danh sách chi nhánh vào store và chọn chi nhánh đầu tiên nếu chưa chọn
  useEffect(() => {
    if (branches && branches.length > 0) {
      setBranches(branches);
    }
  }, [branches, setBranches]);

  const handleLogout = () => {
    clearBranchState();
    logoutCourtOwner();
    navigate('/owner/login', { replace: true });
  };

  const isDark = theme === 'dark';

  const changeTheme = (nextTheme: 'light' | 'dark') => {
    if (theme === nextTheme) return;
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
      return;
    }
    document.documentElement.dataset.themeTransition = nextTheme;
    const transition = document.startViewTransition(() => setTheme(nextTheme));
    void transition.finished.finally(() => {
      delete document.documentElement.dataset.themeTransition;
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/60 bg-card/85 px-4 backdrop-blur-md md:px-6">
      {/* Cụm Bên Trái: Toggle Sidebar & Bộ chọn Chi nhánh theo Figma */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9"
          onClick={onMenuClick}
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex size-9 text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
          aria-label="Thu gọn sidebar"
        >
          {sidebarCollapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>

        {/* Bộ chọn cơ sở sân (Branch Switcher) động từ Backend theo Chủ sân */}
        <div className="flex items-center">
          <Select
            value={selectedBranchId || ''}
            onValueChange={(val) => setSelectedBranchId(val)}
            disabled={isLoadingBranches || branches.length === 0}
          >
            <SelectTrigger className="h-9 w-[190px] md:w-[230px] rounded-xl border-border/60 bg-card/70 px-3 text-xs md:text-sm font-semibold focus:ring-1 focus:ring-[#a3e635]/50">
              <div className="flex items-center gap-2 truncate">
                <Store className="size-3.5 text-[#a3e635] shrink-0" />
                <SelectValue
                  placeholder={
                    isLoadingBranches
                      ? 'Đang tải cụm sân...'
                      : branches.length === 0
                      ? 'Chưa có cụm sân'
                      : 'Chọn cụm sân'
                  }
                />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60 max-h-72">
              {branches.length === 0 ? (
                <div className="py-2.5 px-3 text-xs text-muted-foreground text-center">
                  Chủ sân chưa có chi nhánh
                </div>
              ) : (
                branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs md:text-sm cursor-pointer">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold">{b.name}</span>
                      {b.district && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          • {b.district}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cụm Bên Phải: Pill Switch Light/Dark + Thông báo + Avatar MD theo Figma */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Link xem giao diện người chơi */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hidden xl:flex gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link to="/" target="_blank">
            <span>Xem trang khách</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>

        {/* Pill Theme Switcher chuẩn Figma: [Light | Dark] */}
        <div
          role="group"
          aria-label="Giao diện sáng hoặc tối"
          className={cn(
            'relative flex w-[180px] items-center rounded-full border p-0.5 text-xs transition-colors duration-300',
            !isDark
              ? 'bg-[#E8ECE9] border-slate-300/70'
              : 'bg-[#0B1324] border-slate-800'
          )}
        >
          <span aria-hidden="true" className={cn(
            'pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%_-_2px)] rounded-full shadow-xs transition-[transform,background-color] duration-300 ease-in-out motion-reduce:transition-none',
            isDark ? 'translate-x-full bg-white' : 'translate-x-0 bg-[#18231C]'
          )} />
          <button
            type="button"
            onClick={() => changeTheme('light')}
            aria-pressed={!isDark}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors duration-300 cursor-pointer',
              !isDark
                ? 'text-white font-bold'
                : 'text-slate-400 hover:text-white font-semibold'
            )}
            title="Chế độ sáng"
          >
            <Sun className="size-3.5 stroke-[2.2]" />
            <span className="font-bold">Light</span>
          </button>
          <button
            type="button"
            onClick={() => changeTheme('dark')}
            aria-pressed={isDark}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors duration-300 cursor-pointer',
              isDark
                ? 'text-slate-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            )}
            title="Chế độ tối"
          >
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 0 0 18V3z" fill="currentColor" />
            </svg>
            <span className="font-bold">Dark</span>
          </button>
        </div>

        {/* Chuông thông báo (Notification Bell) màu vàng hổ phách có chấm đỏ theo Figma */}
        <button
          type="button"
          onClick={() => setHasUnreadNotification(false)}
          className="relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-amber-400 hover:bg-muted/70 transition-colors cursor-pointer"
          aria-label="Thông báo"
          title="Thông báo mới"
        >
          <Bell className="size-4.5 fill-amber-400/20" />
          {hasUnreadNotification && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
          )}
        </button>

        {/* User Avatar MD (Matchday) hình tròn xanh neon theo Figma */}
        <div className="flex items-center gap-2 pl-1 border-l border-border/60">
          <div
            className="flex size-9 items-center justify-center rounded-full bg-[#a3e635] text-black font-extrabold text-xs shadow-xs select-none"
            title={user?.name || 'Matchday Owner'}
          >
            MD
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Đăng xuất"
            className="size-8 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
