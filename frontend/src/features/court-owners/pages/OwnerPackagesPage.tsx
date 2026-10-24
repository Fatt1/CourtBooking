import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Gem,
  PhoneCall,
  Mail,
  MessageSquare,
  RefreshCw,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OwnerPageHeader, OwnerModal } from '@/features/court-owners/components/shared';
import {
  useOwnerSubscriptionMeQuery,
  useServicePackagesConfigQuery,
} from '@/api/subscriptions';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/format';

/**
 * Format ngày chuỗi sang chuẩn Việt Nam DD/MM/YYYY
 */
function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return '--/--/----';
  return formatDate(dateStr);
}

/**
 * Format ngày giờ tạo DD/MM/YYYY HH:mm theo múi giờ Việt Nam
 */
function formatDateTimeVN(dateStr?: string | null): string {
  if (!dateStr) return '--';
  return formatDateTime(dateStr);
}

/**
 * Tính số ngày còn lại đến ngày hết hạn
 */
function calculateDaysRemaining(endDateStr?: string | null): number | null {
  if (!endDateStr) return null;
  let targetDate: Date;
  if (endDateStr.includes('/')) {
    const [d, m, y] = endDateStr.split('/').map(Number);
    targetDate = new Date(y, m - 1, d);
  } else {
    targetDate = new Date(endDateStr);
  }

  if (isNaN(targetDate.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function OwnerPackagesPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // 1. Gọi API lấy gói dịch vụ hiện tại & lịch sử của Chủ sân
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useOwnerSubscriptionMeQuery();

  // 2. Lấy danh sách gói cước hệ thống để hiển thị trong modal liên hệ/gia hạn
  const { data: availablePackages = [] } = useServicePackagesConfigQuery();

  const current = data?.currentSubscription;
  const history = data?.history || [];

  // Tính số ngày còn lại
  const daysRemaining = useMemo(() => {
    return calculateDaysRemaining(current?.endDate);
  }, [current?.endDate]);

  // Màu sắc thời gian còn lại
  const remainingColorClass = useMemo(() => {
    if (daysRemaining === null) return 'text-foreground';
    if (daysRemaining <= 0) return 'text-rose-600 dark:text-rose-400';
    if (daysRemaining <= 15) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-[#a3e635]';
  }, [daysRemaining]);

  const handleRefresh = async () => {
    await refetch();
    toast.success('Đã cập nhật dữ liệu gói cước mới nhất.');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER TRANG ── */}
      <OwnerPageHeader
        category="Gói phần mềm (SaaS)"
        title="Thông tin gói dịch vụ"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching || isLoading}
              className="gap-2 rounded-xl border-border/80 h-10 px-4 text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              <RefreshCw className={cn('size-3.5', isRefetching && 'animate-spin')} />
              <span>Làm mới</span>
            </Button>
            <Button
              onClick={() => setIsContactModalOpen(true)}
              className="gap-2 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-10 px-5 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <PhoneCall className="size-4 stroke-[2.5]" />
              <span>Gia hạn / Nâng cấp</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. LOADING SKELETON ── */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 rounded-2xl bg-muted/60" />
          <div className="h-64 rounded-2xl bg-muted/60" />
          <div className="h-72 rounded-2xl bg-muted/60" />
        </div>
      ) : (
        <>
          {/* ── 3. BANNER CẢNH BÁO SẮP HẾT HẠN (Layout & Text chuẩn theo hình) ── */}
          {current && daysRemaining !== null && daysRemaining <= 30 && (
            <div
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:px-5 md:py-4 rounded-2xl border shadow-xs transition-colors',
                daysRemaining <= 0
                  ? 'bg-rose-50 border-rose-200/90 text-rose-950 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-200'
                  : 'bg-amber-50/90 border-amber-200/90 text-amber-950 dark:bg-amber-950/25 dark:border-amber-500/30 dark:text-amber-200'
              )}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={cn(
                    'size-5 shrink-0',
                    daysRemaining <= 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                />
                <span className="text-xs md:text-sm font-medium leading-relaxed">
                  {daysRemaining <= 0 ? (
                    <>
                      Gói cước của bạn{' '}
                      <strong className="font-bold underline decoration-rose-500 decoration-2">
                        đã hết hạn
                      </strong>
                      . Vui lòng liên hệ Admin để gia hạn nhằm tránh gián đoạn dịch vụ!
                    </>
                  ) : (
                    <>
                      Gói cước của bạn sẽ hết hạn sau{' '}
                      <strong className="font-bold underline decoration-amber-500 decoration-2">
                        {daysRemaining} ngày
                      </strong>{' '}
                      nữa. Vui lòng liên hệ Admin để gia hạn nhằm tránh gián đoạn dịch vụ!
                    </>
                  )}
                </span>
              </div>

              <Button
                onClick={() => setIsContactModalOpen(true)}
                className="self-end sm:self-auto bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-[#a3e635] dark:text-black dark:hover:bg-[#8ece28] font-bold h-9 px-5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs md:text-sm shrink-0"
              >
                Gia hạn ngay
              </Button>
            </div>
          )}

          {/* ── 4. CARD THÔNG TIN GÓI HIỆN TẠI (Layout chuẩn theo hình người dùng gửi) ── */}
          {current ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all">
              {/* Viền sọc màu trên đầu card */}
              <div className="h-1.5 w-full bg-emerald-700 dark:bg-[#a3e635]" />

              <div className="p-6 md:p-8 space-y-6">
                {/* Hàng 1: Tên gói & Nút liên hệ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                      {current.packageName}
                    </h2>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setIsContactModalOpen(true)}
                    className="self-start sm:self-auto rounded-xl border-border/90 bg-background/50 hover:bg-muted text-foreground font-semibold text-xs md:text-sm h-10 px-5 shadow-xs transition-colors cursor-pointer"
                  >
                    Liên hệ Admin gia hạn
                  </Button>
                </div>

                {/* Đường gạch phân cách mỏng */}
                <div className="border-t border-border/60" />

                {/* Hàng 2: Các cột thông số thời gian */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-1">
                  {/* Cột 1: NGÀY BẮT ĐẦU */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      NGÀY BẮT ĐẦU
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-foreground font-mono">
                      {formatDateVN(current.startDate)}
                    </div>
                  </div>

                  {/* Cột 2: NGÀY HẾT HẠN */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      NGÀY HẾT HẠN
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-foreground font-mono">
                      {formatDateVN(current.endDate)}
                    </div>
                  </div>

                  {/* Cột 3: THỜI GIAN CÒN LẠI */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      THỜI GIAN CÒN LẠI
                    </div>
                    <div
                      className={cn(
                        'text-2xl md:text-3xl font-black tracking-tight',
                        remainingColorClass
                      )}
                    >
                      {daysRemaining !== null
                        ? daysRemaining <= 0
                          ? 'Đã hết hạn'
                          : `${daysRemaining} Ngày`
                        : '--'}
                    </div>
                  </div>

                  {/* Cột 4: CHI PHÍ ĐÃ THANH TOÁN */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      CHI PHÍ GÓI
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-foreground font-mono">
                      {formatCurrency(current.pricePaid ?? 0)} đ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Khi chưa có gói nào đang kích hoạt */
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Gem className="size-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-foreground">
                  Chưa có gói dịch vụ nào đang hoạt động
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tài khoản của bạn hiện chưa kích hoạt thuê bao SaaS. Vui lòng liên hệ với Quản trị
                  viên để chọn gói phù hợp và mở khoá đầy đủ tính năng.
                </p>
              </div>
              <Button
                onClick={() => setIsContactModalOpen(true)}
                className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold px-6 h-10 rounded-xl"
              >
                Liên hệ kích hoạt gói ngay
              </Button>
            </div>
          )}

          {/* ── 5. BẢNG DANH SÁCH LỊCH SỬ GÓI DỊCH VỤ ── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#a3e635]/15 text-emerald-700 dark:text-[#a3e635]">
                  <History className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground tracking-tight">
                    Lịch sử gói dịch vụ
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Toàn bộ lịch sử các lần kích hoạt, đổi gói và gia hạn dịch vụ của bạn
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                {history.length} bản ghi
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">STT</th>
                      <th className="py-3.5 px-4 font-bold">Gói dịch vụ</th>
                      <th className="py-3.5 px-4 font-bold">Ngày bắt đầu</th>
                      <th className="py-3.5 px-4 font-bold">Ngày kết thúc</th>
                      <th className="py-3.5 px-4 font-bold">Chi phí thanh toán</th>
                      <th className="py-3.5 px-4 font-bold">Thời gian đăng ký</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {history.length > 0 ? (
                      history.map((item, idx) => {
                        const isCurrentActive =
                          current &&
                          (current.id === item.id || current.servicePackageId === item.id);

                        return (
                          <tr
                            key={item.id || idx}
                            className={cn(
                              'hover:bg-muted/20 transition-colors',
                              isCurrentActive && 'bg-emerald-500/[0.03]'
                            )}
                          >
                            {/* Cột 1: STT */}
                            <td className="py-4 px-4 text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </td>

                            {/* Cột 2: Gói dịch vụ */}
                            <td className="py-4 px-4 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <Gem className="size-4 text-[#a3e635] shrink-0" />
                                <span>{item.packageName}</span>
                              </div>
                            </td>

                            {/* Cột 3: Ngày bắt đầu */}
                            <td className="py-4 px-4 font-mono text-foreground font-medium">
                              {formatDateVN(item.startDate)}
                            </td>

                            {/* Cột 4: Ngày kết thúc */}
                            <td className="py-4 px-4 font-mono text-foreground font-medium">
                              {formatDateVN(item.endDate)}
                            </td>

                            {/* Cột 5: Chi phí */}
                            <td className="py-4 px-4 font-mono font-bold text-foreground">
                              {formatCurrency(item.pricePaid ?? 0)} đ
                            </td>

                            {/* Cột 6: Thời gian tạo */}
                            <td className="py-4 px-4 text-muted-foreground font-mono">
                              {formatDateTimeVN(item.createdAt)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-xs text-muted-foreground"
                        >
                          Chưa có lịch sử giao dịch gói dịch vụ nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 6. MODAL LIÊN HỆ ADMIN GIA HẠN / NÂNG CẤP ── */}
      <OwnerModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        title="Liên hệ Quản trị viên để gia hạn gói"
        description="Đội ngũ hỗ trợ Matchday luôn sẵn sàng hỗ trợ bạn gia hạn hoặc chuyển đổi gói cước tốt nhất."
        maxWidth="max-w-xl"
        cancelText="Đóng"
      >
        <div className="space-y-5 pt-2 text-sm">
          {/* Thông tin gói hiện tại tóm tắt */}
          {current && (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Gói đang sử dụng:</span>
                <span className="text-foreground font-bold">{current.packageName}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Hạn sử dụng hiện tại:</span>
                <span className="text-foreground font-mono font-bold">
                  {formatDateVN(current.endDate)}
                </span>
              </div>
            </div>
          )}

          {/* Các kênh liên hệ trực tiếp */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Các kênh hỗ trợ trực tiếp
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kênh 1: Hotline */}
              <a
                href="tel:0909123456"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-[#a3e635] hover:bg-muted/40 transition-colors group cursor-pointer"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#a3e635]">
                  <PhoneCall className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Hotline hỗ trợ</div>
                  <div className="text-xs text-muted-foreground font-mono">0909 123 456</div>
                </div>
              </a>

              {/* Kênh 2: Zalo CSKH */}
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-[#a3e635] hover:bg-muted/40 transition-colors group cursor-pointer"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Zalo Tư vấn</div>
                  <div className="text-xs text-muted-foreground truncate">Zalo Official CSKH</div>
                </div>
              </a>

              {/* Kênh 3: Email */}
              <a
                href="mailto:admin@courtbooking.vn"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-[#a3e635] hover:bg-muted/40 transition-colors group cursor-pointer col-span-1 sm:col-span-2"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Mail className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Email tiếp nhận yêu cầu</div>
                  <div className="text-xs text-muted-foreground font-mono">admin@courtbooking.vn</div>
                </div>
              </a>
            </div>
          </div>

          {/* Danh sách các gói khả dụng tham khảo */}
          {availablePackages.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Bảng gói dịch vụ hệ thống tham khảo
              </h4>
              <div className="space-y-2">
                {availablePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span>{pkg.name}</span>
                        {pkg.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#a3e635]/20 text-emerald-800 dark:text-[#a3e635] font-bold">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Thời hạn: {pkg.durationMonths} tháng
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground font-mono">
                        {formatCurrency(pkg.price)} đ
                      </div>
                      <div className="text-[10px] text-muted-foreground">Toàn bộ tính năng</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/20 flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-[#a3e635] shrink-0 mt-0.5" />
            <span>
              Khi gia hạn thành công qua Admin, thời hạn gói mới sẽ tự động được nối tiếp sau ngày
              kết thúc của gói cũ để đảm bảo quyền lợi tối đa cho bạn.
            </span>
          </div>
        </div>
      </OwnerModal>
    </div>
  );
}
