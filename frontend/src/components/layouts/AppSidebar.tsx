import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Grid3X3,
  BadgeDollarSign,
  Trophy,
  ShoppingCart,
  Users,
  PackageCheck,
  Dumbbell,
  Star,
  X,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarCollapsed } = useAppThemeStore();

  const isSystemAdmin = user?.role === 'SystemAdmin';
  const isCourtOwnerOrStaff = user?.role === 'CourtOwner' || user?.role === 'Staff';

  // Navigation Items dựa trên Role thực tế
  const adminNavSections = [
    ...(isCourtOwnerOrStaff
      ? [
          {
            title: 'VẬN HÀNH SÂN',
            items: [
              { label: 'Tổng quan sân', href: '/admin', icon: LayoutDashboard },
              { label: 'Lưới lịch & Duyệt đơn', href: '/admin/orders', icon: CalendarDays },
              { label: 'Bán lẻ POS & Dịch vụ', href: '/admin/pos', icon: ShoppingCart },
            ],
          },
          {
            title: 'CẤU HÌNH CƠ SỞ',
            items: [
              { label: 'Chi nhánh & VietQR', href: '/admin/branches', icon: Building2 },
              { label: 'Loại sân & Sân con', href: '/admin/courts', icon: Grid3X3 },
              { label: 'Bảng giá & Slot cố định', href: '/admin/pricing', icon: BadgeDollarSign },
              { label: 'Sự kiện & Bán vé', href: '/admin/events', icon: Trophy },
              { label: 'Đánh giá khách hàng', href: '/admin/reviews', icon: Star },
            ],
          },
        ]
      : []),

    ...(isSystemAdmin
      ? [
          {
            title: 'HỆ THỐNG SAAS',
            items: [
              { label: 'Dashboard Toàn Sàn', href: '/admin', icon: LayoutDashboard },
              { label: 'Quản lý Tài khoản', href: '/admin/users', icon: Users },
              { label: 'Gói Cước Dịch Vụ', href: '/admin/subscriptions', icon: PackageCheck },
              { label: 'Danh mục Môn Thể Thao', href: '/admin/sport-types', icon: Layers },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 md:static md:z-auto',
          sidebarCollapsed ? 'md:w-20' : 'md:w-64',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Bar */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-foreground overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Dumbbell className="size-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="truncate text-base font-extrabold tracking-tight">
                Court<span className="text-primary">Admin</span>
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label="Đóng sidebar"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {adminNavSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-1 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Role Badge */}
        {!sidebarCollapsed && (
          <div className="border-t p-3 text-xs text-muted-foreground">
            <div className="rounded-lg bg-muted/60 p-2 text-center">
              <div className="font-semibold text-foreground">
                {isSystemAdmin ? 'System Admin' : user?.role || 'Quản lý'}
              </div>
              <div className="text-[10px] text-muted-foreground">Hệ thống CourtBooking v2</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
