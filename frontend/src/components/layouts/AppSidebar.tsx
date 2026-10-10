import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Activity,
  Grid3X3,
  Building2,
  BadgeDollarSign,
  Package,
  Coffee,
  ShoppingCart,
  CreditCard,
  LineChart,
  Gem,
  Users,
  PackageCheck,
  X,
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

  // 12 mục Menu chuẩn theo đúng Figma của Owner (dùng tiền tố /owner/...)
  const ownerNavItems = [
    { label: 'Tổng quan', href: '/owner', icon: LayoutDashboard },
    { label: 'Lịch đặt sân', href: '/owner/orders', icon: CalendarDays },
    { label: 'Trạng thái sân', href: '/owner/court-status', icon: Activity },
    { label: 'Quản lý sân', href: '/owner/courts', icon: Grid3X3 },
    { label: 'Chi nhánh', href: '/owner/branches', icon: Building2 },
    { label: 'Giá và khung giờ', href: '/owner/pricing', icon: BadgeDollarSign },
    { label: 'Danh mục dịch vụ', href: '/owner/service-categories', icon: Package },
    { label: 'Sản phẩm', href: '/owner/products', icon: Coffee },
    { label: 'Bán hàng tại quầy', href: '/owner/pos', icon: ShoppingCart },
    { label: 'Ví và giao dịch', href: '/owner/wallet', icon: CreditCard },
    { label: 'Báo cáo', href: '/owner/reports', icon: LineChart },
    { label: 'Gói dịch vụ', href: '/owner/packages', icon: Gem },
  ];

  // Các mục hệ thống chỉ hiện khi là SystemAdmin
  const systemAdminNavItems = [
    { label: 'Quản lý Tài khoản', href: '/admin/users', icon: Users },
    { label: 'Gói Cước Dịch Vụ', href: '/admin/subscriptions', icon: PackageCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/60 bg-card transition-all duration-300 md:static md:z-auto',
          sidebarCollapsed ? 'md:w-20' : 'md:w-64',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Bar chuẩn Matchday. theo Figma */}
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
          <Link
            to="/owner/orders"
            className="flex items-center gap-1.5 font-black text-xl tracking-tight text-foreground"
          >
            <span className="font-sans font-extrabold text-xl tracking-tight">Matchday</span>
            <span className="text-[#a3e635] text-2xl leading-none">.</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8 text-muted-foreground"
            onClick={onClose}
            aria-label="Đóng sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            // Xác định active menu
            const isActive =
              item.href === '/owner'
                ? location.pathname === '/owner'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-[#a3e635] bg-[#a3e635]/10 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive ? 'text-[#a3e635]' : 'text-muted-foreground'
                  )}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Dành cho System Admin nếu có */}
          {isSystemAdmin && (
            <div className="pt-4 mt-3 border-t border-border/40">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                  Quản trị hệ thống
                </div>
              )}
              {systemAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary bg-primary/10 font-semibold'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
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
          )}
        </div>

        {/* Bottom Role Badge */}
        {!sidebarCollapsed && (
          <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
            <div className="rounded-lg bg-muted/40 p-2.5 text-center border border-border/40">
              <div className="font-semibold text-foreground text-xs">
                {isSystemAdmin ? 'System Admin' : user?.name || 'Chủ sân Matchday'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Cổng Quản Trị Hoạt Động
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
