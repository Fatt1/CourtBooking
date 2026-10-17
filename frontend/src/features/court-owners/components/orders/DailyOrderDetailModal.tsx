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
  useUpdateOrderItemsMutation,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getPaymentMethodLabel,
  getPaymentTypeLabel,
  PaymentTransactionType,
  type DailyOrderResponse,
  type DailyOrderSlotItemDto,
  type PaymentTransactionDto,
  type CourtBookingSlotPayload,
} from '@/api/orders';
import { getImageUrl } from '@/api/storage';
import { UpdateCustomerModal } from './UpdateCustomerModal';
import { CancelOrderModal } from './CancelOrderModal';
import { AddServiceModal } from './AddServiceModal';
import { ConfirmCompleteOrderModal } from './ConfirmCompleteOrderModal';
import { AddTransactionModal } from './AddTransactionModal';
import { VisualBookingModal } from './VisualBookingModal';
import { type SelectedCourtSlot, timeToMinutes } from './timeline';

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
  const { mutateAsync: updateOrderItems, isPending: isUpdatingSlots } = useUpdateOrderItemsMutation();

  // Sub-modals
  const [isUpdateCustomerOpen, setIsUpdateCustomerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditSlotsOpen, setIsEditSlotsOpen] = useState(false);
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

  // Danh sách slot ban đầu phục vụ modal chọn lịch trực quan
  const initialSlotsForEdit: SelectedCourtSlot[] = useMemo(() => {
    if (!order?.slots || order.slots.length === 0) return [];
    return order.slots.map((s) => ({
      courtId: s.courtId,
      courtName: s.courtName || '',
      courtTypeId: s.courtTypeId || (s as any).courTypeId || '',
      courtTypeName: s.courtTypeName || '',
      date: s.date?.split('T')[0] || todayStr,
      startTime: s.startTime,
      endTime: s.endTime,
      priceTableId: '',
      priceTableName: '',
      price: s.price || 0,
    }));
  }, [order?.slots, todayStr]);

  const initialDateForEdit = useMemo(() => {
    return order?.slots?.[0]?.date?.split('T')[0] || todayStr;
  }, [order?.slots, todayStr]);

  // Xử lý cập nhật danh sách ca sân (Order Details)
  const handleUpdateSlots = async (newSlots: SelectedCourtSlot[]) => {
    if (!order) return;
    if (newSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ca sân.');
      return;
    }

    // Kiểm tra xem có thêm slot mới nào không hay chỉ giữ / xóa bớt slot cũ
    const hasAnyNewSlot = newSlots.some((ns) => {
      const nsDate = ns.date?.split('T')[0];
      const nsStart = timeToMinutes(ns.startTime);
      const nsEnd = timeToMinutes(ns.endTime);

      return !order.slots.some((os) => {
        const osDate = os.date?.split('T')[0];
        const osStart = timeToMinutes(os.startTime);
        const osEnd = timeToMinutes(os.endTime);
        return (
          os.courtId === ns.courtId &&
          osDate === nsDate &&
          nsStart >= osStart &&
          nsEnd <= osEnd
        );
      });
    });

    const groupMap: Record<string, { courtTypeId: string; priceTableId?: string; slots: any[] }> = {};

    newSlots.forEach((slot) => {
      // Đảm bảo courtTypeId luôn có giá trị GUID hợp lệ
      const courtTypeId =
        slot.courtTypeId ||
        order.slots.find((s) => s.courtId === slot.courtId)?.courtTypeId ||
        (order.slots.find((s) => s.courtId === slot.courtId) as any)?.courTypeId ||
        '';

      // Nếu không có slot mới nào (chỉ xóa / giữ ca cũ) -> bỏ đi priceTableId theo yêu cầu
      const priceTableId = hasAnyNewSlot ? (slot.priceTableId || undefined) : undefined;

      const groupKey = `${courtTypeId}__${priceTableId || 'no_pt'}`;
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          courtTypeId,
          priceTableId: priceTableId || undefined,
          slots: [],
        };
      }
      groupMap[groupKey].slots.push({
        courtId: slot.courtId,
        date: slot.date?.split('T')[0] || todayStr,
        startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
        endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
      });
    });

    const courtBookingSlots: CourtBookingSlotPayload[] = Object.values(groupMap);

    try {
      await updateOrderItems({
        orderId: order.id,
        courtBookingSlots,
      });
      toast.success('Cập nhật lịch đặt sân thành công!');
      setIsEditSlotsOpen(false);
      refetch();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật lịch sân'));
    }
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-card border border-border/70 text-foreground shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b border-border/60">
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide">
              Chi tiết đặt lịch
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="size-10 rounded-full border-2 border-[#a3e635]/20 border-t-[#a3e635] animate-spin" />
            <p className="text-sm font-medium text-foreground">Đang tải thông tin chi tiết đơn hàng...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md p-6 bg-card border border-border/70 text-foreground shadow-2xl rounded-2xl text-center space-y-4">
          <p className="text-sm text-muted-foreground">Không tìm thấy thông tin đơn đặt hoặc đơn không tồn tại.</p>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/60 bg-card text-foreground hover:bg-muted"
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
  const canEditSlots = !isTerminalState;
  const isPrimaryDisabled =
    isTerminalState || isActionPending || (isConfirmed && isBeforePlayDate);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[95vw] max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-card border border-border/70 text-foreground shadow-2xl rounded-2xl sm:rounded-3xl"
        >
          {/* ================================================================= */}
          {/* 1. HEADER MODAL (Đồng bộ tông màu chuẩn của hệ thống #0f172a) */}
          {/* ================================================================= */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/40 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="size-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Quay lại"
              >
                <ChevronLeft className="size-5 stroke-[2.5]" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide">
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
          <div className="p-4 sm:p-6 bg-background grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-6 max-h-[78vh] overflow-y-auto">
            {/* --------------------------------------------------------------- */}
            {/* CỘT TRÁI: KHÁCH HÀNG & THÔNG TIN ĐẶT LỊCH */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 1: THÔNG TIN KHÁCH HÀNG (ĐÃ XÓA MỤC "ĐỐI TƯỢNG" THEO YÊU CẦU) */}
              <div className="rounded-2xl bg-card border border-border/60 p-4.5 text-foreground relative shadow-sm hover:border-border transition-all">
                <div className="flex items-start gap-3.5">
                  {/* Avatar hình tròn cam/vàng */}
                  <div className="relative size-14 sm:size-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shrink-0 shadow-md flex items-center justify-center text-white border-2 border-amber-300/60">
                    <span className="text-2xl select-none">👨</span>
                  </div>

                  {/* Thông tin KH, SĐT (Đã xóa Đối tượng) */}
                  <div className="flex-1 min-w-0 pr-8 space-y-1.5">
                    <div className="text-sm font-semibold text-muted-foreground">
                      KH:{' '}
                      <span className="font-bold text-foreground text-base">
                        {displayOrder.customerName || 'Khách vãng lai'}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      SĐT:{' '}
                      <span
                        className={`font-semibold ${displayOrder.customerPhone && displayOrder.customerPhone !== 'Không cung cấp'
                          ? 'text-emerald-700 dark:text-[#a3e635]'
                          : 'text-muted-foreground'
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
                    className="absolute top-4 right-4 size-8 rounded-lg bg-muted border border-border/60 hover:bg-accent text-foreground flex items-center justify-center cursor-pointer transition-colors"
                    title="Chỉnh sửa thông tin khách"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* CARD 2: THÔNG TIN ĐẶT LỊCH */}
              <div className="rounded-2xl bg-card border border-border/60 p-4.5 text-foreground space-y-3.5 relative shadow-sm">
                {/* Header card */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-400 text-base">📋</span>
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      Thông tin đặt lịch
                    </span>
                  </div>
                </div>

                {/* Nội dung chi tiết: Mã lịch, Chi nhánh, Sân & Thời gian */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Mã lịch đặt với nhiều không gian & nút Copy */}
                  <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-muted-foreground">
                      <span>Mã lịch đặt: </span>
                      <span className="font-bold text-foreground font-mono select-all text-xs sm:text-sm tracking-tight">
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
                      className="text-[11px] px-2 py-0.5 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border/50 cursor-pointer transition-colors"
                      title="Sao chép mã đơn"
                    >
                      <Copy className="size-3" /> Sao chép
                    </button>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Chi nhánh: </span>
                    <span className="font-bold text-foreground">
                      {displayOrder.branchName || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Sân & Thời gian chơi:</span>
                      {canEditSlots ? (
                        <button
                          type="button"
                          onClick={() => setIsEditSlotsOpen(true)}
                          className="size-7 sm:size-8 rounded-lg bg-muted border border-border/60 hover:bg-accent text-foreground flex items-center justify-center cursor-pointer transition-colors"
                          title="Chỉnh sửa sân & thời gian chơi"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      ) : (
                        <Grid className="size-4 text-muted-foreground" />
                      )}
                    </div>

                    {Object.keys(groupedSlotsByDate).length > 0 ? (
                      <div className="space-y-2.5">
                        {Object.entries(groupedSlotsByDate).map(([dateKey, slots]) => (
                          <div
                            key={dateKey}
                            className="rounded-xl bg-muted/30 border border-border/40 p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-[#a3e635]">
                              <Calendar className="size-3.5" />
                              <span>Ngày chơi: {formatDate(dateKey)}</span>
                            </div>

                            <div className="space-y-1 pl-1 text-xs">
                              {slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2 text-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground">{slot.courtName}</span>
                                    {slot.courtTypeName && (
                                      <span className="text-[11px] text-muted-foreground">({slot.courtTypeName})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 font-mono text-emerald-700 dark:text-[#a3e635] bg-muted px-2 py-0.5 rounded border border-border/40">
                                    <span>
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                    <Check className="size-2.5 text-emerald-700 dark:text-[#a3e635]" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic text-xs">Chưa có thông tin ca sân</div>
                    )}
                  </div>

                  {/* Ghi chú đặt sân */}
                  <div className="pt-2.5 border-t border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <FileText className="size-3.5 text-amber-700 dark:text-amber-400" />
                      <span>Ghi chú:</span>
                    </div>
                    <div className="rounded-xl bg-muted/30 border border-border/40 p-2.5 text-xs text-foreground">
                      {displayOrder.note?.trim() ? (
                        <p className="whitespace-pre-wrap">{displayOrder.note}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Không có ghi chú</p>
                      )}
                    </div>
                  </div>

                  {/* Lý do hủy nếu đơn bị hủy */}
                  {displayOrder.cancelReason && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
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
                    <div className="font-semibold text-muted-foreground">
                      Tổng đơn ngày:{' '}
                      <span className="font-bold text-foreground">{totalAmountFormatted}đ</span>
                    </div>
                    <div className="font-semibold text-muted-foreground">
                      Cần thanh toán:{' '}
                      <span className="font-bold text-amber-700 dark:text-amber-400">{remainingAmountFormatted}đ</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPriceDetail(!showPriceDetail)}
                    className="text-xs font-semibold text-emerald-700 dark:text-[#a3e635] hover:underline cursor-pointer pb-0.5"
                  >
                    {showPriceDetail ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                </div>

                {/* Khối xem chi tiết chiết tính giá khi bấm "Chi tiết" */}
                {showPriceDetail && (
                  <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Tiền sân:</span>
                      <span className="text-foreground font-medium">
                        {(displayOrder.totalCourtAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền dịch vụ:</span>
                      <span className="text-foreground font-medium">
                        {(displayOrder.totalServiceAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {displayOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-700 dark:text-rose-300">
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
              <div className="rounded-2xl bg-card border border-border/60 p-4.5 shadow-sm space-y-3">
                {/* Header Cột phải */}
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2 rounded-xl bg-muted border border-border/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                    <Calendar className="size-3.5 text-emerald-700 dark:text-[#a3e635]" />
                    <span>{orderFormattedDate}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddServiceOpen(true)}
                    className="h-8 rounded-xl bg-muted hover:bg-accent border border-border/60 text-foreground text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
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
                          className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 px-3.5 py-2.5 text-xs text-foreground"
                        >
                          <div>
                            <div className="font-semibold text-foreground">{srv.serviceName}</div>
                            <div className="text-muted-foreground text-[11px]">
                              {srv.quantity} {srv.unit || 'phần'} x{' '}
                              {srv.unitPrice.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                          <div className="font-bold text-emerald-700 dark:text-[#a3e635]">
                            {srv.totalPrice.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs sm:text-sm text-muted-foreground font-medium select-none">
                      Không có dịch vụ nào trong ngày
                    </div>
                  )}
                </div>

                {/* Footer Dịch vụ */}
                <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="font-semibold text-muted-foreground">
                    Tổng dịch vụ:{' '}
                    <span className="font-bold text-foreground">{totalServiceFormatted} đ</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info('Tính năng xuất hóa đơn dịch vụ riêng đang hoàn thiện.')
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <FileText className="size-3.5" />
                    <span>Hóa đơn dịch vụ</span>
                  </button>
                </div>
              </div>

              {/* CARD 4: LỊCH SỬ GIAO DỊCH THANH TOÁN (PAYMENT TRANSACTIONS) THEO YÊU CẦU */}
              <div className="rounded-2xl bg-card border border-border/60 p-4.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                    <span className="font-bold text-sm text-foreground">
                      Giao dịch thanh toán
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border/50">
                      {displayOrder.paymentTransactions?.length || 0}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddTransactionOpen(true)}
                    className="h-8 rounded-xl bg-muted hover:bg-accent border border-border/60 text-foreground text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
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
                          className="rounded-xl bg-muted/30 border border-border/50 p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {getPaymentTypeLabel(tx.type)}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                                  {getPaymentMethodLabel(tx.paymentMethod)}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-bold text-sm ${isRefund ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-[#a3e635]'
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
                              <span className="text-[11px] text-muted-foreground">
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
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 hover:text-white cursor-pointer"
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
                    <div className="py-4 text-center text-xs text-muted-foreground">
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
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:p-4 bg-card border-t border-border/60">
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
          <DialogContent className="max-w-2xl bg-card border border-border/70 text-foreground p-5 rounded-2xl shadow-2xl">
            <DialogHeader className="pb-3 border-b border-border/50">
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                {previewImage.title || 'Chứng từ thanh toán'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center p-3 bg-background border border-border/60 rounded-xl overflow-hidden max-h-[70vh]">
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
                className="text-xs text-emerald-700 dark:text-[#a3e635] hover:underline flex items-center gap-1.5 font-semibold"
              >
                <ExternalLink className="size-3.5" /> Mở ảnh trong tab mới
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="h-8 rounded-lg text-xs border-border/60 bg-card text-foreground hover:bg-muted"
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

      {displayOrder.branchId && (
        <VisualBookingModal
          open={isEditSlotsOpen}
          onOpenChange={setIsEditSlotsOpen}
          branchId={displayOrder.branchId}
          branchName={displayOrder.branchName}
          initialDate={initialDateForEdit}
          initialSlots={initialSlotsForEdit}
          excludeOrderCode={displayOrder.orderCode}
          title={`Cập nhật lịch sân #${displayOrder.orderCode}`}
          confirmText={isUpdatingSlots ? 'Đang lưu...' : 'Lưu thay đổi lịch sân'}
          onConfirm={handleUpdateSlots}
        />
      )}
    </>
  );
}
