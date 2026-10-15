import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CalendarDays,
  Clock,
  Activity,
  ArrowRight,
  Store,
  ChevronRight,
  User,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { useOwnerBranchesQuery } from '@/api/branches';
import { useCourtOwnerRevenueQuery } from '@/api/analytics';
import { useDailyOrdersQuery, OrderStatus, getOrderStatusLabel, getOrderStatusVariant } from '@/api/orders';
import { useCourtsQuery } from '@/api/courts';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared';

export function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 1. Ngày hôm nay theo chuẩn YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Ngày hiển thị tiếng Việt (VD: Thứ Năm, 15/10/2026)
  const todayDisplay = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  // 2. Lấy danh sách chi nhánh
  const { data: branches = [] } = useOwnerBranchesQuery();

  // Chi nhánh hiệu lực (nếu chưa chọn thì lấy chi nhánh đầu tiên)
  const effectiveBranchId = selectedBranchId || branches[0]?.id;

  // 3. API Doanh thu & chỉ số vận hành hôm nay
  const { data: todayRevenue, isLoading: isLoadingRevenue } = useCourtOwnerRevenueQuery({
    fromDate: todayStr,
    toDate: todayStr,
    branchId: effectiveBranchId,
  });

  // 4. API 5 đơn hàng gần nhất của chi nhánh
  const { data: recentOrdersData, isLoading: isLoadingOrders } = useDailyOrdersQuery({
    branchId: effectiveBranchId,
    page: 1,
    pageSize: 5,
  });

  const recentOrders = recentOrdersData?.items || [];

  // 5. API danh sách sân để đếm số sân hoạt động
  const { data: courts = [] } = useCourtsQuery({
    branchId: effectiveBranchId,
  });

  // Đếm đơn cần xác nhận
  const pendingOrdersCount = useMemo(() => {
    return recentOrders.filter(
      (o) => o.status === OrderStatus.PendingConfirmation || o.status === OrderStatus.AwaitingPayment
    ).length;
  }, [recentOrders]);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER TỐI GIẢN (WELCOME & LIVE DATE) ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Tổng quan
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            {todayDisplay}
            {selectedBranch?.name ? ` • Cơ sở: ${selectedBranch.name}` : ''}
          </p>
        </div>

        <Link to="/owner/orders">
          <Button
            size="sm"
            className="bg-[#a3e635] hover:bg-[#8fd028] text-slate-950 font-bold gap-2 shadow-xs cursor-pointer"
          >
            <span>Lịch đặt sân</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>

      {/* ── 2. HÀNG 4 THẺ SỐ LIỆU HÔM NAY (TODAY'S NUMBERS) ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Doanh thu hôm nay */}
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              DOANH THU HÔM NAY
            </span>
            <DollarSign className="size-4 text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-mono">
              {formatVND(todayRevenue?.totalNetRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền sân & dịch vụ phát sinh trong ngày
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#a3e635]" />
        </div>

        {/* Thẻ 2: Lượt đặt hôm nay */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              LƯỢT ĐẶT HÔM NAY
            </span>
            <CalendarDays className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-mono">
              {todayRevenue?.totalBookings ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {todayRevenue?.onlineBookings ?? 0} online • {todayRevenue?.posBookings ?? 0} tại quầy
            </p>
          </div>
        </div>

        {/* Thẻ 3: Đơn chờ xác nhận */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              ĐƠN CHỜ DUYỆT
            </span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-amber-400 font-mono">
              {pendingOrdersCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingOrdersCount > 0 ? 'Có đơn mới cần chủ sân xử lý' : 'Tất cả đơn đã được xác nhận'}
            </p>
          </div>
        </div>

        {/* Thẻ 4: Sân đang hoạt động */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold tracking-wider uppercase">
              SÂN SẴN SÀNG
            </span>
            <Activity className="size-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-[#38bdf8] font-mono">
              {courts.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {branches.length} chi nhánh đang quản lý
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. BẢNG 5 ĐƠN ĐẶT SÂN MỚI NHẤT (RECENT ORDERS) ─────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Đơn đặt sân gần đây
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Danh sách 5 đơn hàng mới nhất cần theo dõi
            </p>
          </div>
          <Link
            to="/owner/orders"
            className="text-xs font-semibold text-[#a3e635] hover:underline flex items-center gap-1 group"
          >
            <span>Xem tất cả đơn</span>
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="py-8 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full bg-muted/40 rounded-lg" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border/60 rounded-lg">
            <CalendarDays className="size-8 mx-auto mb-2 opacity-30 text-[#a3e635]" />
            <p className="text-sm font-medium text-foreground">Chưa có đơn đặt sân nào gần đây</p>
            <p className="text-xs text-muted-foreground mt-1">
              Đơn đặt mới sẽ tự động hiển thị tại đây khi khách đặt qua ứng dụng hoặc tại quầy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="py-3 px-4 font-semibold">Mã đơn & Khách hàng</th>
                  <th className="py-3 px-4 font-semibold">Sân & Khung giờ</th>
                  <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                  <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {recentOrders.map((order) => {
                  const detail = order.details?.[0];
                  const courtDisplay = detail
                    ? `${detail.courtName} (${detail.startTime.slice(0, 5)} - ${detail.endTime.slice(0, 5)})`
                    : 'Đặt theo lịch';

                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground font-mono text-xs">
                            {order.orderCode}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <User className="size-3" />
                            {order.customerName}
                            {order.customerPhone ? ` • ${order.customerPhone}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground text-xs font-medium">
                        {courtDisplay}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono text-sm">
                        {formatVND(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <OwnerStatusBadge
                          variant={getOrderStatusVariant(order.status)}
                          status={getOrderStatusLabel(order.status)}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/owner/orders?search=${order.orderCode}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold hover:text-[#a3e635] hover:bg-[#a3e635]/10"
                          >
                            Xem chi tiết
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
