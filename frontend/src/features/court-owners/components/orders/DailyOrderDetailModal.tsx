import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  FileText,
  X,
  Pencil,
  Grid,
  Calendar,
  Plus,
  Check,
  CreditCard,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Receipt,
  QrCode,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OwnerStatusBadge } from '../shared/OwnerStatusBadge';
import { getApiErrorMessage } from '@/types/api';
import {
  useDailyOrderDetailQuery,
  useConfirmOrderMutation,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getPaymentMethodLabel,
  getPaymentTypeLabel,
  PaymentTransactionType,
  type DailyOrderResponse,
  type DailyOrderSlotItemDto,
  type PaymentTransactionDto,
} from '@/api/orders';
import { getImageUrl } from '@/api/storage';
import { UpdateCustomerModal } from './UpdateCustomerModal';
import { CancelOrderModal } from './CancelOrderModal';
import { AddServiceModal } from './AddServiceModal';
import { ConfirmCompleteOrderModal } from './ConfirmCompleteOrderModal';
import { AddTransactionModal } from './AddTransactionModal';

interface DailyOrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onOrderUpdated?: () => void;
}

/**
 * Format ngày theo chuẩn dd/MM/yyyy
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Format giờ: HH:mm:ss -> HHhMM (ví dụ: 10:00:00 -> 10h00)
 */
function formatTime(timeStr?: string): string {
  if (!timeStr) return '00h00';
  const clean = timeStr.substring(0, 5);
  return clean.replace(':', 'h');
}

/**
 * Modal hiển thị chi tiết đặt lịch cho đơn hàng ngày
 * Đã chuẩn hóa:
 * - Tone màu tối sang trọng (#0B1324, #131d31) đồng bộ 100% với các modal khác trong hệ thống
 * - Bổ sung hiển thị danh sách Payment Transactions kèm nút xem chi tiết hình ảnh chuyển khoản
 * - Xóa mục "Đối tượng" trong thẻ thông tin khách hàng
 * - Mở rộng không gian hiển thị mã đơn hàng dài, chống ngắt dòng
 */
export function DailyOrderDetailModal({
  open,
  onOpenChange,
  orderId,
  onOrderUpdated,
}: DailyOrderDetailModalProps) {
  const { data: order, isLoading, refetch } = useDailyOrderDetailQuery(orderId);
  const { mutateAsync: confirmOrder, isPending: isConfirming } = useConfirmOrderMutation();

  // Sub-modals
  const [isUpdateCustomerOpen, setIsUpdateCustomerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [showPriceDetail, setShowPriceDetail] = useState(false);

  // Xem trước ảnh biên lai thanh toán
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Lấy ngày hôm nay (YYYY-MM-DD theo giờ địa phương)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Nhóm các ca sân theo ngày chơi thực tế (slot.date)
  const groupedSlotsByDate = useMemo(() => {
    if (!order?.slots || order.slots.length === 0) return {};
    return order.slots.reduce((acc, slot) => {
      const d = slot.date?.split('T')[0] || 'unknown';
      if (!acc[d]) acc[d] = [];
      acc[d].push(slot);
      return acc;
    }, {} as Record<string, DailyOrderSlotItemDto[]>);
  }, [order?.slots]);

  // Kiểm tra xem đã tới ngày chơi hay chưa (so sánh ngày sớm nhất với hôm nay)
  const isBeforePlayDate = useMemo(() => {
    if (!order?.slots || order.slots.length === 0) return false;
    const dates = order.slots
      .map((s) => s.date?.split('T')[0])
      .filter(Boolean)
      .sort();
    if (dates.length === 0) return false;
    const earliestDate = dates[0];
    return earliestDate > todayStr;
  }, [order?.slots, todayStr]);

  // Tổng số tiền khách đã thanh toán thực tế (Payment - Refund)
  const totalPaidAmount = useMemo(() => {
    if (!order?.paymentTransactions) return 0;
    const paid = order.paymentTransactions
      .filter((t) => t.type === PaymentTransactionType.Payment)
      .reduce((acc, t) => acc + t.amount, 0);
    const refunded = order.paymentTransactions
      .filter((t) => t.type === PaymentTransactionType.Refund)
      .reduce((acc, t) => acc + t.amount, 0);
    return paid - refunded;
  }, [order?.paymentTransactions]);

  // Xử lý nút hành động chính bên phải ("ĐÃ CHƠI XONG" hoặc "XÁC NHẬN")
  const handlePrimaryAction = async () => {
    if (!order) return;

    if (order.status === OrderStatus.PendingConfirmation || order.status === OrderStatus.AwaitingPayment) {
      try {
        await confirmOrder(order.id);
        toast.success(`Đã xác nhận đơn hàng #${order.orderCode} thành công!`);
        refetch();
        onOrderUpdated?.();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Không thể xác nhận đơn'));
      }
    } else if (order.status === OrderStatus.Confirmed) {
      if (isBeforePlayDate) {
        toast.error('Chưa tới ngày chơi, không thể xác nhận hoàn thành!');
        return;
      }
      setIsConfirmCompleteOpen(true);
    }
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between px-5 py-4 bg-[#0f172a] border-b border-border/60">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Chi tiết đặt lịch
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="size-10 rounded-full border-2 border-[#a3e635]/20 border-t-[#a3e635] animate-spin" />
            <p className="text-sm font-medium text-slate-200">Đang tải thông tin chi tiết đơn hàng...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md p-6 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl text-center space-y-4">
          <p className="text-sm text-slate-300">Không tìm thấy thông tin đơn đặt hoặc đơn không tồn tại.</p>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/60 bg-[#131d31] text-white hover:bg-[#1a2742]"
          >
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const displayOrder: DailyOrderResponse = order;

  const orderPlayDates = Object.keys(groupedSlotsByDate).map(formatDate).join(', ');
  const orderFormattedDate = orderPlayDates || formatDate(displayOrder.orderDate);

  const totalAmountFormatted = (displayOrder.totalAmount || 0).toLocaleString('vi-VN');
  const remainingAmountFormatted = (displayOrder.remainingAmount || 0).toLocaleString('vi-VN');
  const totalServiceFormatted = (displayOrder.totalServiceAmount || 0).toLocaleString('vi-VN');

  // Kiểm tra trạng thái và nút hành động chính
  const isAwaiting =
    displayOrder.status === OrderStatus.PendingConfirmation ||
    displayOrder.status === OrderStatus.AwaitingPayment;
  const isConfirmed = displayOrder.status === OrderStatus.Confirmed;
  const isCompleted = displayOrder.status === OrderStatus.Completed;
  const isCancelled = displayOrder.status === OrderStatus.Cancelled;

  let primaryButtonText = 'ĐÃ CHƠI XONG';
  if (isAwaiting) primaryButtonText = 'XÁC NHẬN ĐƠN';
  else if (isCompleted) primaryButtonText = 'ĐÃ HOÀN THÀNH';
  else if (isCancelled) primaryButtonText = 'ĐÃ HỦY';
  else if (isConfirmed && isBeforePlayDate) primaryButtonText = 'CHƯA TỚI NGÀY';

  const isActionPending = isConfirming;
  const isTerminalState = isCompleted || isCancelled;
  const isPrimaryDisabled =
    isTerminalState || isActionPending || (isConfirmed && isBeforePlayDate);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl"
        >
          {/* ================================================================= */}
          {/* 1. HEADER MODAL (Đồng bộ tông màu chuẩn của hệ thống #0f172a) */}
          {/* ================================================================= */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Quay lại"
              >
                <ChevronLeft className="size-5 stroke-[2.5]" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Chi tiết đặt lịch
              </h2>
              <OwnerStatusBadge
                status={getOrderStatusLabel(displayOrder.status)}
                variant={getOrderStatusVariant(displayOrder.status)}
              />
            </div>


          </div>

          {/* ================================================================= */}
          {/* 2. BODY CHÍNH (Layout 2 cột rộng rãi theo tông màu Matchday) */}
          {/* ================================================================= */}
          <div className="p-4 sm:p-6 bg-[#070D1A] grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-6 max-h-[78vh] overflow-y-auto">
            {/* --------------------------------------------------------------- */}
            {/* CỘT TRÁI: KHÁCH HÀNG & THÔNG TIN ĐẶT LỊCH */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 1: THÔNG TIN KHÁCH HÀNG (ĐÃ XÓA MỤC "ĐỐI TƯỢNG" THEO YÊU CẦU) */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white relative shadow-sm hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  {/* Avatar hình tròn cam/vàng */}
                  <div className="relative size-14 sm:size-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shrink-0 shadow-md flex items-center justify-center text-white border-2 border-amber-300/60">
                    <span className="text-2xl select-none">👨</span>
                  </div>

                  {/* Thông tin KH, SĐT (Đã xóa Đối tượng) */}
                  <div className="flex-1 min-w-0 pr-8 space-y-1.5">
                    <div className="text-sm font-semibold text-slate-300">
                      KH:{' '}
                      <span className="font-bold text-white text-base">
                        {displayOrder.customerName || 'Khách vãng lai'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      SĐT:{' '}
                      <span
                        className={`font-semibold ${displayOrder.customerPhone && displayOrder.customerPhone !== 'Không cung cấp'
                          ? 'text-[#a3e635]'
                          : 'text-slate-400'
                          }`}
                      >
                        {displayOrder.customerPhone || 'Không cung cấp'}
                      </span>
                    </div>
                  </div>

                  {/* Nút sửa thông tin KH (Pencil icon) */}
                  <button
                    type="button"
                    onClick={() => setIsUpdateCustomerOpen(true)}
                    className="absolute top-4 right-4 size-8 rounded-lg bg-[#1a2742] border border-border/60 hover:bg-[#223354] text-white flex items-center justify-center cursor-pointer transition-colors"
                    title="Chỉnh sửa thông tin khách"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* CARD 2: THÔNG TIN ĐẶT LỊCH */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-3.5 relative shadow-sm">
                {/* Header card */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-base">📋</span>
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      Thông tin đặt lịch
                    </span>
                  </div>
                </div>

                {/* Nội dung chi tiết: Mã lịch, Chi nhánh, Sân & Thời gian */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Mã lịch đặt với nhiều không gian & nút Copy */}
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-slate-300">
                      <span>Mã lịch đặt: </span>
                      <span className="font-bold text-white font-mono select-all text-xs sm:text-sm tracking-tight">
                        {displayOrder.orderCode.startsWith('#')
                          ? displayOrder.orderCode
                          : `#${displayOrder.orderCode}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(displayOrder.orderCode);
                        toast.success('Đã sao chép mã đơn hàng!');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a2742] hover:bg-[#223354] text-slate-300 hover:text-white flex items-center gap-1 border border-border/50 cursor-pointer transition-colors"
                      title="Sao chép mã đơn"
                    >
                      <Copy className="size-3" /> Sao chép
                    </button>
                  </div>

                  <div>
                    <span className="text-slate-300">Chi nhánh: </span>
                    <span className="font-bold text-white">
                      {displayOrder.branchName || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Sân & Thời gian chơi:</span>
                      <Grid className="size-4 text-[#a3e635]" />
                    </div>

                    {Object.keys(groupedSlotsByDate).length > 0 ? (
                      <div className="space-y-2.5">
                        {Object.entries(groupedSlotsByDate).map(([dateKey, slots]) => (
                          <div
                            key={dateKey}
                            className="rounded-xl bg-[#0e172a] border border-border/40 p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a3e635]">
                              <Calendar className="size-3.5" />
                              <span>Ngày chơi: {formatDate(dateKey)}</span>
                            </div>

                            <div className="space-y-1 pl-1 text-xs">
                              {slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2 text-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-white">{slot.courtName}</span>
                                    {slot.courtTypeName && (
                                      <span className="text-[11px] text-slate-400">({slot.courtTypeName})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 font-mono text-[#a3e635] bg-[#1a2742] px-2 py-0.5 rounded border border-border/40">
                                    <span>
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                    <Check className="size-2.5 text-[#a3e635]" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-xs">Chưa có thông tin ca sân</div>
                    )}
                  </div>

                  {/* Ghi chú đặt sân */}
                  <div className="pt-2.5 border-t border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <FileText className="size-3.5 text-amber-400" />
                      <span>Ghi chú:</span>
                    </div>
                    <div className="rounded-xl bg-[#0e172a] border border-border/40 p-2.5 text-xs text-slate-200">
                      {displayOrder.note?.trim() ? (
                        <p className="whitespace-pre-wrap">{displayOrder.note}</p>
                      ) : (
                        <p className="text-slate-500 italic">Không có ghi chú</p>
                      )}
                    </div>
                  </div>

                  {/* Lý do hủy nếu đơn bị hủy */}
                  {displayOrder.cancelReason && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                        <AlertTriangle className="size-3.5" />
                        <span>Lý do hủy đơn:</span>
                      </div>
                      <div className="rounded-xl bg-rose-950/30 border border-rose-800/40 p-2.5 text-xs text-rose-200">
                        <p className="whitespace-pre-wrap">{displayOrder.cancelReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cụm tiền & Link Chi tiết dưới đáy Card */}
                <div className="pt-3 border-t border-border/50 flex items-end justify-between">
                  <div className="space-y-0.5 text-xs sm:text-sm">
                    <div className="font-semibold text-slate-300">
                      Tổng đơn ngày:{' '}
                      <span className="font-bold text-white">{totalAmountFormatted}đ</span>
                    </div>
                    <div className="font-semibold text-slate-300">
                      Cần thanh toán:{' '}
                      <span className="font-bold text-amber-400">{remainingAmountFormatted}đ</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPriceDetail(!showPriceDetail)}
                    className="text-xs font-semibold text-[#a3e635] hover:underline cursor-pointer pb-0.5"
                  >
                    {showPriceDetail ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                </div>

                {/* Khối xem chi tiết chiết tính giá khi bấm "Chi tiết" */}
                {showPriceDetail && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#0e172a] border border-border/60 text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Tiền sân:</span>
                      <span className="text-white font-medium">
                        {(displayOrder.totalCourtAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền dịch vụ:</span>
                      <span className="text-white font-medium">
                        {(displayOrder.totalServiceAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {displayOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-300">
                        <span>Giảm giá:</span>
                        <span>-{displayOrder.discountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CỘT PHẢI: DỊCH VỤ & GIAO DỊCH THANH TOÁN (PAYMENT TRANSACTIONS) */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 3: DỊCH VỤ TRONG NGÀY */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 shadow-sm space-y-3">
                {/* Header Cột phải */}
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2 rounded-xl bg-[#1a2742] border border-border/60 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    <Calendar className="size-3.5 text-[#a3e635]" />
                    <span>{orderFormattedDate}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddServiceOpen(true)}
                    className="h-8 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Thêm dịch vụ</span>
                  </Button>
                </div>

                {/* Vùng nội dung dịch vụ */}
                <div className="py-2 min-h-[90px] flex items-center justify-center">
                  {displayOrder.services && displayOrder.services.length > 0 ? (
                    <div className="w-full space-y-2">
                      {displayOrder.services.map((srv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl bg-[#0e172a] border border-border/50 px-3.5 py-2.5 text-xs text-white"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{srv.serviceName}</div>
                            <div className="text-slate-400 text-[11px]">
                              {srv.quantity} {srv.unit || 'phần'} x{' '}
                              {srv.unitPrice.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                          <div className="font-bold text-[#a3e635]">
                            {srv.totalPrice.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs sm:text-sm text-slate-400 font-medium select-none">
                      Không có dịch vụ nào trong ngày
                    </div>
                  )}
                </div>

                {/* Footer Dịch vụ */}
                <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-300">
                    Tổng dịch vụ:{' '}
                    <span className="font-bold text-white">{totalServiceFormatted} đ</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info('Tính năng xuất hóa đơn dịch vụ riêng đang hoàn thiện.')
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <FileText className="size-3.5" />
                    <span>Hóa đơn dịch vụ</span>
                  </button>
                </div>
              </div>

              {/* CARD 4: LỊCH SỬ GIAO DỊCH THANH TOÁN (PAYMENT TRANSACTIONS) THEO YÊU CẦU */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-[#a3e635]" />
                    <span className="font-bold text-sm text-slate-100">
                      Giao dịch thanh toán
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2742] text-slate-300 font-semibold border border-border/50">
                      {displayOrder.paymentTransactions?.length || 0}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddTransactionOpen(true)}
                    className="h-8 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Thêm giao dịch</span>
                  </Button>
                </div>

                {/* Danh sách giao dịch */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {displayOrder.paymentTransactions && displayOrder.paymentTransactions.length > 0 ? (
                    displayOrder.paymentTransactions.map((tx: PaymentTransactionDto) => {
                      const isRefund = tx.type === PaymentTransactionType.Refund;
                      const hasImage = Boolean(tx.imageKey);
                      const imageUrl = hasImage ? getImageUrl(tx.imageKey) : '';

                      return (
                        <div
                          key={tx.id}
                          className="rounded-xl bg-[#0e172a] border border-border/50 p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                  {getPaymentTypeLabel(tx.type)}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a2742] text-slate-300 border border-border/40">
                                  {getPaymentMethodLabel(tx.paymentMethod)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-bold text-sm ${isRefund ? 'text-rose-400' : 'text-[#a3e635]'
                                  }`}
                              >
                                {isRefund ? '-' : '+'}
                                {tx.amount.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>

                          {/* NÚT XEM CHI TIẾT HÌNH ẢNH BIÊN LAI NẾU CÓ ẢNH */}
                          {hasImage && (
                            <div className="pt-1.5 border-t border-border/40 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                Có đính kèm chứng từ thanh toán
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewImage({
                                    url: imageUrl,
                                    title: `Biên lai ${getPaymentMethodLabel(
                                      tx.paymentMethod
                                    )} • ${tx.amount.toLocaleString('vi-VN')}đ`,
                                  })
                                }
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-white cursor-pointer"
                              >
                                <ImageIcon className="size-3" />
                                <span>Xem chi tiết hình</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      Chưa ghi nhận giao dịch thanh toán nào cho đơn này.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. FOOTER MODAL (Đồng bộ nút bấm Matchday sang trọng) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:p-4 bg-[#0B1324] border-t border-border/60">
            {/* Nút HỦY màu cam đỏ */}
            <button
              type="button"
              disabled={isTerminalState || isActionPending}
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full h-11.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-md transition-colors cursor-pointer flex items-center justify-center active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              HỦY
            </button>

            {/* Nút ĐÃ CHƠI XONG / CHƯA TỚI NGÀY / XÁC NHẬN */}
            <button
              type="button"
              disabled={isPrimaryDisabled}
              onClick={handlePrimaryAction}
              className="w-full h-11.5 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-md transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isActionPending ? 'Đang xử lý...' : primaryButtonText}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* 4. MODAL XEM CHI TIẾT ẢNH BIÊN LAI THANH TOÁN (LIGHTBOX) */}
      {/* ================================================================= */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-2xl bg-[#0B1324] border border-border/70 text-white p-5 rounded-2xl shadow-2xl">
            <DialogHeader className="pb-3 border-b border-border/50">
              <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="size-4 text-[#a3e635]" />
                {previewImage.title || 'Chứng từ thanh toán'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center p-3 bg-[#050B17] border border-border/60 rounded-xl overflow-hidden max-h-[70vh]">
              <img
                src={previewImage.url}
                alt="Chứng từ chuyển khoản"
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://placehold.co/600x400/0f172a/a3e635?text=Ảnh+chứng+từ+chuyển+khoản';
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#a3e635] hover:underline flex items-center gap-1.5 font-semibold"
              >
                <ExternalLink className="size-3.5" /> Mở ảnh trong tab mới
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="h-8 rounded-lg text-xs border-border/60 bg-[#131d31] text-white hover:bg-[#1a2742]"
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sub-modals */}
      <UpdateCustomerModal
        open={isUpdateCustomerOpen}
        onOpenChange={setIsUpdateCustomerOpen}
        orderId={displayOrder.id}
        initialName={displayOrder.customerName}
        initialPhone={displayOrder.customerPhone}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      <CancelOrderModal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        totalPaid={displayOrder.totalAmount - displayOrder.remainingAmount}
        onSuccess={() => {
          onOpenChange(false);
          refetch();
          onOrderUpdated?.();
        }}
      />

      <AddServiceModal
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        mode="update"
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        branchId={displayOrder.branchId}
        currentServices={displayOrder.services}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      <ConfirmCompleteOrderModal
        open={isConfirmCompleteOpen}
        onOpenChange={setIsConfirmCompleteOpen}
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        customerName={displayOrder.customerName}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      <AddTransactionModal
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        totalAmount={displayOrder.totalAmount}
        totalPaid={totalPaidAmount}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />
    </>
  );
}
