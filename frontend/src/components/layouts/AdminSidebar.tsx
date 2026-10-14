import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  UserCheck,
  CalendarCheck,
  Trophy,
  ChevronDown,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { useAdminLogoutMutation } from '@/api/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarCollapsed } = useAppThemeStore();
  const { mutate: adminLogout } = useAdminLogoutMutation();

  // Danh mục menu chuẩn CourtOS Admin Console theo đúng bản thiết kế
  const adminNavItems: AdminNavItem[] = [
    {
      label: 'Tổng quan',
      href: '/admin/dashboard',
      icon: LayoutGrid,
    },
    {
      label: 'Quản lý người dùng',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Quản lý chủ sân',
      href: '/admin/owners',
      icon: UserCheck,
    },
    {
      label: 'Gói cước & đăng ký',
      href: '/admin/subscriptions',
      icon: CalendarCheck,
    },
    {
      label: 'Môn thể thao',
      href: '/admin/sport-types',
      icon: Trophy,
    },
  ];

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  // Lấy 2 chữ cái đầu của tên admin làm Avatar
  const getInitials = (name?: string) => {
    if (!name) return 'HA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user?.name);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#16241c] bg-[#0c1410] text-slate-200 transition-all duration-300 md:static md:z-auto select-none',
          sidebarCollapsed ? 'md:w-20' : 'md:w-64',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* 1. Brand Bar chuẩn CourtOS Admin Console */}
        <div className="flex h-16 items-center justify-between border-b border-[#16241c] px-4">
          <Link to="/admin/users" className="flex items-center gap-3 group">
            {/* Logo Icon CourtOS */}
            <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
              <div className="size-full bg-[#0c1410] rounded-[10px] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 text-emerald-400 stroke-current"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 12h18" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M7 3v4" />
                  <path d="M17 3v4" />
                  <path d="M7 17v4" />
                  <path d="M17 17v4" />
                </svg>
              </div>
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                  Court<span className="text-emerald-400">OS</span>
                </span>
                <span className="text-[9px] tracking-[0.22em] font-extrabold text-zinc-400 uppercase mt-0.5">
                  ADMIN CONSOLE
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Đóng sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 2. Workspace Selector Box */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between rounded-xl bg-[#111c16] border border-[#1b2d22] p-2.5 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div className="size-7 rounded-lg bg-[#0e271c] border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  C
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">CourtOS Workspace</div>
                  <div className="text-[10px] text-zinc-400 truncate">Quản trị viên hệ thống</div>
                </div>
              </div>
              <ChevronDown className="size-3.5 text-zinc-500 shrink-0 ml-1" />
            </div>
          </div>
        )}

        {/* 3. Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-2 pt-2 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Không gian quản trị
            </div>
          )}

          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-150',
                  isActive
                    ? 'bg-[#0d281e] text-emerald-400 font-semibold border border-emerald-500/25 shadow-xs'
                    : 'text-zinc-400 hover:bg-[#121c17] hover:text-white font-medium',
                  sidebarCollapsed && 'justify-center px-2 py-2.5'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-zinc-400'
                    )}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!sidebarCollapsed && item.badge && (
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#16271e] border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 4. Bottom System Status & Admin Profile Footer */}
        <div className="border-t border-[#16241c] p-3 space-y-2.5">
          {/* Trạng thái hệ thống */}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 px-1 text-[11px] text-zinc-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống hoạt động ổn định</span>
            </div>
          )}

          {/* Admin Profile Box */}
          <div
            className={cn(
              'flex items-center justify-between rounded-xl bg-[#111c16]/70 border border-[#1b2d22] p-2',
              sidebarCollapsed && 'justify-center p-1.5'
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="size-8 rounded-full bg-[#132c20] border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name || 'Hoàng Anh'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {user?.role === 'SystemAdmin' ? 'System Administrator' : 'Quản trị viên'}
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Đăng xuất khỏi CourtOS"
                className="size-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Link chuyển nhanh sang cổng chủ sân / khách hàng nếu cần */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
              <Link
                to="/owner/orders"
                className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Cổng chủ sân</span>
                <ExternalLink className="size-3" />
              </Link>
              <Link to="/" className="hover:text-emerald-400 transition-colors">
                Trang khách
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
