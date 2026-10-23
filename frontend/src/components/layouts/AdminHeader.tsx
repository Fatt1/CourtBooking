import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { useAdminLogoutMutation } from '@/api/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppThemeStore();
  const { mutate: adminLogout } = useAdminLogoutMutation();

  // Xác định tiêu đề Breadcrumb động dựa trên Route hiện tại
  const getPageTitle = (pathname: string) => {
    if (pathname === '/admin' || pathname.includes('/admin/dashboard')) return 'Tổng quan';
    if (pathname.includes('/admin/users')) return 'Quản lý người dùng';
    if (pathname.includes('/admin/owners')) return 'Quản lý chủ sân';
    if (pathname.includes('/admin/subscriptions')) return 'Gói cước & đăng ký';
    if (pathname.includes('/admin/sport-types')) return 'Môn thể thao';
    return 'Tổng quan';
  };

  const pageTitle = getPageTitle(location.pathname);

  const getInitials = (name?: string) => {
    if (!name) return 'HA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user?.name);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#141b16] bg-[#070a08]/95 px-4 backdrop-blur-md md:px-6 select-none">
      {/* 1. Bên Trái: Toggle sidebar & Breadcrumbs chuẩn CourtOS Console */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onMenuClick}
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex size-9 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          onClick={toggleSidebar}
          aria-label="Thu gọn sidebar"
        >
          {sidebarCollapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>

        {/* Breadcrumb Path theo đúng Figma */}
        <nav className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="hidden sm:inline">Không gian quản trị</span>
          <span className="text-zinc-600 hidden sm:inline">/</span>
          <span className="text-white font-semibold">{pageTitle}</span>
        </nav>
      </div>

      {/* 2. Bên Phải: Notification + Avatar Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Admin Avatar Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#18241d] bg-[#0c130f] p-1 pr-2 hover:bg-[#121c17] transition-colors cursor-pointer"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#132c20] border border-emerald-500/30 text-emerald-400 font-extrabold text-xs select-none">
                {initials}
              </div>
              <ChevronDown className="size-3 text-zinc-500 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-[#1b2b22] bg-[#0f1713] text-zinc-200 shadow-2xl p-1.5"
          >
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-white leading-none">
                  {user?.name || 'Hoàng Anh'}
                </p>
                <p className="text-[11px] text-zinc-400 leading-none truncate">
                  {user?.email || 'admin@courtbooking.com'}
                </p>
                <span className="inline-block mt-1 w-fit rounded bg-emerald-950/70 border border-emerald-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  {user?.role || 'System Admin'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#1b2b22]" />
            <DropdownMenuItem
              onClick={() => navigate('/owner/orders')}
              className="text-xs cursor-pointer hover:bg-zinc-800/50"
            >
              Cổng Quản lý Chủ sân
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/')}
              className="text-xs cursor-pointer hover:bg-zinc-800/50"
            >
              Xem giao diện người chơi
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1b2b22]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              <span>Đăng xuất CourtOS</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
