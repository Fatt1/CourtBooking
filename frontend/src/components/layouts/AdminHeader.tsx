import { useState } from 'react';
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
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar, selectedBranchId, setSelectedBranchId } =
    useAppThemeStore();
  const navigate = useNavigate();
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isDark = theme === 'dark';

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

        {/* Bộ chọn cơ sở sân (Branch Switcher) chuẩn Figma: "Matchday Bình Thạnh" */}
        <div className="flex items-center">
          <Select
            value={selectedBranchId || 'binh-thanh'}
            onValueChange={(val) => setSelectedBranchId(val)}
          >
            <SelectTrigger className="h-9 w-[190px] md:w-[210px] rounded-xl border-border/60 bg-card/70 px-3 text-xs md:text-sm font-semibold focus:ring-1 focus:ring-[#a3e635]/50">
              <div className="flex items-center gap-2 truncate">
                <Store className="size-3.5 text-[#a3e635] shrink-0" />
                <SelectValue placeholder="Chọn cụm sân" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="binh-thanh" className="text-xs md:text-sm">
                Matchday Bình Thạnh
              </SelectItem>
              <SelectItem value="quan-7" className="text-xs md:text-sm">
                Matchday Quận 7
              </SelectItem>
              <SelectItem value="thu-duc" className="text-xs md:text-sm">
                Matchday Thủ Đức
              </SelectItem>
              <SelectItem value="tan-binh" className="text-xs md:text-sm">
                Matchday Tân Bình
              </SelectItem>
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
        <div className="flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all text-xs font-medium cursor-pointer',
              !isDark
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Chế độ sáng"
          >
            <Sun className="size-3.5" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all text-xs font-medium cursor-pointer',
              isDark
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Chế độ tối"
          >
            <Moon className="size-3.5" />
            <span className="hidden sm:inline">Dark</span>
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
