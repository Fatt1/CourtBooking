import { Menu, PanelLeftClose, PanelLeft, Sun, Moon, LogOut, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppThemeStore } from '@/stores/useAppThemeStore';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useAppThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleSidebar}
          aria-label="Thu gọn sidebar"
        >
          {sidebarCollapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>

        <span className="text-sm font-semibold text-muted-foreground hidden sm:inline-block">
          Bảng Điều Khiển
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Link back to public view */}
        <Button variant="ghost" size="sm" asChild className="hidden lg:flex gap-1.5 text-xs text-muted-foreground">
          <Link to="/" target="_blank">
            <span>Xem trang người chơi</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>

        {/* Theme mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Chuyển chế độ sáng/tối"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        {/* User Profile display */}
        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold leading-none text-foreground">{user?.name || user?.email}</span>
            <span className="text-[10px] text-primary font-medium mt-0.5">{user?.role || 'Admin'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
