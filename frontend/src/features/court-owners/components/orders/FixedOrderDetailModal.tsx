import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  FileText,
  X,
  Pencil,
  Trash2,
  Calendar,
  Plus,
  Check,
  CreditCard,
  Image as ImageIcon,
  Copy,
  Receipt,
  Repeat,
  Sparkles,
  Layers,
  Clock,
  AlertTriangle,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OwnerStatusBadge } from '../shared/OwnerStatusBadge';
import { getApiErrorMessage } from '@/types/api';
import {
  useFixedOrderDetailQuery,
  useConfirmOrderMutation,
  useDeleteFixedOrderCycleMutation,
  useUpdateFixedOrderCycleMutation,
  useAddFixedOrderCycleMutation,
  useAddOrderSlotsMutation,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getPaymentMethodLabel,
  getPaymentTypeLabel,
  PaymentTransactionType,
  type FixedOrderResponse,
  type FixedOrderSlotDto,
  type FixedCycleDetailDto,
  type PaymentTransactionDto,
  type CourtBookingSlotPayload,
} from '@/api/orders';
import { getImageUrl } from '@/api/storage';
import { UpdateCustomerModal } from './UpdateCustomerModal';
import { CancelOrderModal } from './CancelOrderModal';
import { CancelOrderSlotModal } from './CancelOrderSlotModal';
import { AddServiceModal } from './AddServiceModal';
import { AddTransactionModal } from './AddTransactionModal';
import { VisualBookingModal } from './VisualBookingModal';
import { FixedVisualBookingModal, type FixedCycleConfig } from './FixedVisualBookingModal';
import { type SelectedCourtSlot } from './timeline';

interface FixedOrderDetailModalProps {
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
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch { }
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
 * Lấy thứ trong tuần tiếng Việt
 */
function getDayOfWeekLabel(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.split('T')[0]);
    const day = d.getDay();
    const map = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return map[day];
  } catch {
    return '';
  }
}

export function FixedOrderDetailModal({
  open,
  onOpenChange,
  orderId,
  onOrderUpdated,
}: FixedOrderDetailModalProps) {
  const { data: order, isLoading, refetch } = useFixedOrderDetailQuery(orderId);
  const { mutateAsync: confirmOrder, isPending: isConfirming } = useConfirmOrderMutation();
  const { mutateAsync: deleteFixedCycle, isPending: isDeletingCycle } = useDeleteFixedOrderCycleMutation();
  const { mutateAsync: updateFixedCycle } = useUpdateFixedOrderCycleMutation();
  const { mutateAsync: addFixedCycle } = useAddFixedOrderCycleMutation();
  const { mutateAsync: addOrderSlots } = useAddOrderSlotsMutation();

  // Sub-modals states
  const [isUpdateCustomerOpen, setIsUpdateCustomerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [showPriceDetail, setShowPriceDetail] = useState(false);

  // Quản lý ca sân lẻ (Xóa 1 buổi hoặc Thêm ngày lẻ)
  const [slotToDelete, setSlotToDelete] = useState<FixedOrderSlotDto | null>(null);
  const [isCancelSlotOpen, setIsCancelSlotOpen] = useState(false);
  const [isAddSingleSlotOpen, setIsAddSingleSlotOpen] = useState(false);

  // Quản lý chu kỳ (Sửa hoặc Thêm chu kỳ mới)
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<FixedCycleDetailDto | null>(null);
  const [cycleToDelete, setCycleToDelete] = useState<FixedCycleDetailDto | null>(null);

  // Xem trước ảnh biên lai chuyển khoản
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Nhóm các ca thi đấu theo ngày chơi (slot.date)
  const groupedSlotsByDate = useMemo(() => {
    if (!order?.slots || order.slots.length === 0) return {};
    return order.slots.reduce((acc, slot) => {
      const d = slot.date?.split('T')[0] || 'unknown';
      if (!acc[d]) acc[d] = [];
      acc[d].push(slot);
      return acc;
    }, {} as Record<string, FixedOrderSlotDto[]>);
  }, [order?.slots]);

  // Tổng số tiền khách đã thanh toán thực tế (Payment - Refund)
  const totalPaidAmount = useMemo(() => {
    if (!order?.paymentTransactions) return 0;
    const paid = order.paymentTransactions
      .filter((t) => t.type === PaymentTransactionType.Payment)
      .reduce((acc, t) => acc + t.amount, 0);
    const refunded = order.paymentTransactions
      .filter((t) => t.type === PaymentTransactionType.Refund)
      .reduce((acc, t) => acc + t.amount, 0);
    return Math.max(0, paid - refunded);
  }, [order?.paymentTransactions]);

  // Xử lý xác nhận đơn hàng
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
    }
  };

  // 1. Xóa một ca chơi (Mở popup xác nhận kèm hoàn tiền)
  const handleOpenCancelSlot = (slot: FixedOrderSlotDto) => {
    setSlotToDelete(slot);
    setIsCancelSlotOpen(true);
  };

  // 2. Thêm ngày lẻ cho đơn hàng qua VisualBookingModal
  const handleAddSingleSlots = async (newSlots: SelectedCourtSlot[]) => {
    if (!order) return;
    if (newSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ca sân.');
      return;
    }

    const groupMap: Record<string, { courtTypeId: string; priceTableId?: string | null; slots: any[] }> = {};
    newSlots.forEach((slot) => {
      const cleanPriceTableId = slot.priceTableId && slot.priceTableId.trim() ? slot.priceTableId : null;
      const groupKey = `${slot.courtTypeId}__${cleanPriceTableId || 'default'}`;
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          courtTypeId: slot.courtTypeId,
          priceTableId: cleanPriceTableId,
          slots: [],
        };
      }
      groupMap[groupKey].slots.push({
        courtId: slot.courtId,
        date: slot.date,
        startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
        endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
      });
    });

    try {
      await addOrderSlots({
        orderId: order.id,
        courtSlots: Object.values(groupMap),
      });
      toast.success('Đã thêm ngày chơi lẻ vào đơn hàng thành công!');
      setIsAddSingleSlotOpen(false);
      refetch();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể thêm ngày chơi lẻ'));
    }
  };

  // 3. Xóa một chu kỳ cố định
  const handleConfirmDeleteCycle = async () => {
    if (!order || !cycleToDelete) return;

    if (order.cycles.length <= 1) {
      toast.error('Đơn hàng chỉ có 1 chu kỳ duy nhất. Nếu không tiếp tục sử dụng, vui lòng hủy toàn bộ đơn hàng.');
      setCycleToDelete(null);
      return;
    }

    try {
      await deleteFixedCycle({
        orderId: order.id,
        cycleId: cycleToDelete.cycleId,
      });
      toast.success('Đã xóa chu kỳ thành công! Lịch sân đã được tính toán lại.');
      setCycleToDelete(null);
      refetch();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa chu kỳ này'));
    }
  };

  // 4. Lưu cập nhật một chu kỳ cố định từ FixedVisualBookingModal
  const handleSaveEditCycle = async (updatedCycle: FixedCycleConfig) => {
    if (!order || !editingCycle) return;

    try {
      await updateFixedCycle({
        orderId: order.id,
        cycleId: editingCycle.cycleId,
        courtTypeId: updatedCycle.courtTypeId,
        priceTableId: updatedCycle.priceTableId,
        startDate: updatedCycle.startDate,
        endDate: updatedCycle.endDate,
        daysOfWeekMask: updatedCycle.daysOfWeekMask,
        startTime: updatedCycle.startTime,
        endTime: updatedCycle.endTime,
        courtIds: updatedCycle.courtIds,
        exceptionDates: updatedCycle.exceptionDates,
      });
      toast.success('Cập nhật chu kỳ thành công!');
      setEditingCycle(null);
      refetch();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật chu kỳ'));
    }
  };

  // 5. Thêm chu kỳ mới vào đơn hàng từ FixedVisualBookingModal
  const handleSaveNewCycle = async (newCycle: FixedCycleConfig) => {
    if (!order) return;

    try {
      await addFixedCycle({
        orderId: order.id,
        courtTypeId: newCycle.courtTypeId,
        priceTableId: newCycle.priceTableId,
        startDate: newCycle.startDate,
        endDate: newCycle.endDate,
        daysOfWeekMask: newCycle.daysOfWeekMask,
        startTime: newCycle.startTime,
        endTime: newCycle.endTime,
        courtIds: newCycle.courtIds,
        exceptionDates: newCycle.exceptionDates,
      });
      toast.success('Đã thêm chu kỳ mới thành công!');
      setIsAddCycleOpen(false);
      refetch();
      onOrderUpdated?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể thêm chu kỳ mới'));
    }
  };

  // Chuyển đổi FixedCycleDetailDto sang FixedCycleConfig cho modal chỉnh sửa
  const initialCycleForEdit: FixedCycleConfig | null = useMemo(() => {
    if (!editingCycle) return null;
    return {
      courtTypeId: editingCycle.courtTypeId,
      courtTypeName: editingCycle.courtTypeName,
      priceTableId: '',
      priceTableName: '',
      startDate: editingCycle.startDate.split('T')[0],
      endDate: editingCycle.endDate.split('T')[0],
      daysOfWeekMask: editingCycle.daysOfWeekMask,
      daysOfWeekLabels: editingCycle.dayNames || [],
      startTime: editingCycle.startTime,
      endTime: editingCycle.endTime,
      courtIds: editingCycle.courts.map((c) => c.courtId),
      courtNames: editingCycle.courts.map((c) => c.courtName),
      exceptionDates: editingCycle.exceptionDates || [],
      totalSessions: 0,
    };
  }, [editingCycle]);

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-5xl lg:max-w-6xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between px-5 py-4 bg-[#0f172a] border-b border-border/60">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Chi tiết đặt lịch cố định
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
            <p className="text-sm font-medium text-slate-200">Đang tải thông tin chi tiết đơn hàng cố định...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md p-6 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl text-center space-y-4">
          <p className="text-sm text-slate-300">Không tìm thấy thông tin đơn cố định hoặc đơn không tồn tại.</p>
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

  const displayOrder: FixedOrderResponse = order;

  const totalAmountFormatted = (displayOrder.totalAmount || 0).toLocaleString('vi-VN');
  const remainingAmountFormatted = (displayOrder.remainingAmount || 0).toLocaleString('vi-VN');
  const totalServiceFormatted = (displayOrder.totalServiceAmount || 0).toLocaleString('vi-VN');

  const isAwaiting =
    displayOrder.status === OrderStatus.PendingConfirmation ||
    displayOrder.status === OrderStatus.AwaitingPayment;
  const isConfirmed = displayOrder.status === OrderStatus.Confirmed;
  const isCompleted = displayOrder.status === OrderStatus.Completed;
  const isCancelled = displayOrder.status === OrderStatus.Cancelled;

  let primaryButtonText = 'ĐANG SỬ DỤNG';
  if (isAwaiting) primaryButtonText = 'XÁC NHẬN ĐƠN';
  else if (isCompleted) primaryButtonText = 'ĐÃ HOÀN THÀNH';
  else if (isCancelled) primaryButtonText = 'ĐÃ HỦY';

  const isActionPending = isConfirming;
  const isTerminalState = isCompleted || isCancelled;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onPointerDownOutside={(e) => {
            // Không đóng modal chi tiết khi click vào modal con hoặc backdrop của modal con
            if (
              isAddSingleSlotOpen ||
              isAddCycleOpen ||
              !!editingCycle ||
              !!cycleToDelete ||
              isCancelSlotOpen ||
              isCancelModalOpen ||
              isUpdateCustomerOpen ||
              isAddServiceOpen ||
              isAddTransactionOpen ||
              !!previewImage
            ) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (
              isAddSingleSlotOpen ||
              isAddCycleOpen ||
              !!editingCycle ||
              !!cycleToDelete ||
              isCancelSlotOpen ||
              isCancelModalOpen ||
              isUpdateCustomerOpen ||
              isAddServiceOpen ||
              isAddTransactionOpen ||
              !!previewImage
            ) {
              e.preventDefault();
            }
          }}
          className="w-[95vw] max-w-5xl lg:max-w-6xl p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl sm:rounded-3xl z-50"
        >
          {/* ================================================================= */}
          {/* 1. HEADER MODAL (Đồng bộ chuẩn DailyOrderDetailModal) */}
          {/* ================================================================= */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] border-b border-border/60">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Quay lại"
              >
                <ChevronLeft className="size-5 stroke-[2.5]" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Chi tiết đặt lịch cố định
              </h2>
              <OwnerStatusBadge
                status={isConfirmed ? 'Đang sử dụng' : getOrderStatusLabel(displayOrder.status)}
                variant={isConfirmed ? 'success' : getOrderStatusVariant(displayOrder.status)}
              />
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Lịch cố định
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ================================================================= */}
          {/* 2. BODY CHÍNH (Layout 2 cột chuẩn Matchday) */}
          {/* ================================================================= */}
          <div className="p-4 sm:p-6 bg-[#070D1A] grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-6 max-h-[78vh] overflow-y-auto">
            {/* --------------------------------------------------------------- */}
            {/* CỘT TRÁI: KHÁCH HÀNG & THÔNG TIN LỊCH & CHU KỲ & CÁC NGÀY CHƠI */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 1: THÔNG TIN KHÁCH HÀNG */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white relative shadow-sm hover:border-slate-700 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="relative size-14 sm:size-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shrink-0 shadow-md flex items-center justify-center text-white border-2 border-amber-300/60">
                    <span className="text-2xl select-none">👨</span>
                  </div>

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

                  {/* Nút sửa thông tin KH */}
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

              {/* CARD 2: THÔNG TIN ĐẶT LỊCH & DANH SÁCH CHU KỲ CỐ ĐỊNH */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-3.5 relative shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-base">📋</span>
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      Thông tin đặt lịch cố định
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Mã lịch đặt với nút copy */}
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

                  {/* CỤM DANH SÁCH CHU KỲ CỐ ĐỊNH (CÓ NÚT SỬA & XÓA & THÊM) */}
                  <div className="pt-2 border-t border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#a3e635] uppercase tracking-wider">
                        <Repeat className="size-3.5" />
                        <span>Cấu hình các chu kỳ ({displayOrder.cycles?.length || 0})</span>
                      </div>

                      {!isTerminalState && (
                        <button
                          type="button"
                          onClick={() => setIsAddCycleOpen(true)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#1a2742] hover:bg-[#223354] text-[#a3e635] border border-border/60 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="size-3" />
                          <span>Thêm chu kỳ</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {displayOrder.cycles && displayOrder.cycles.length > 0 ? (
                        displayOrder.cycles.map((cycle, idx) => (
                          <div
                            key={cycle.cycleId || idx}
                            className="rounded-xl bg-[#0e172a] border border-border/50 p-3 space-y-1.5 relative text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 pr-16 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                                  Chu kỳ #{idx + 1}
                                </span>
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {cycle.courtTypeName}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-[#a3e635]">
                                {formatTime(cycle.startTime)} - {formatTime(cycle.endTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-300 text-xs flex-wrap">
                              <span>
                                Thứ: <span className="font-semibold text-white">{cycle.dayNames?.join(', ') || '—'}</span>
                              </span>
                              <span>•</span>
                              <span>
                                Thời gian: <span className="font-semibold text-white">{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</span>
                              </span>
                            </div>

                            <div className="text-slate-400 text-[11px]">
                              Sân áp dụng:{' '}
                              <span className="font-semibold text-slate-200">
                                {cycle.courts?.map((c) => c.courtName).join(', ') || '—'}
                              </span>
                            </div>

                            {/* CỤM NÚT SỬA & XÓA CHU KỲ (THỨ 2 TRONG YÊU CẦU) */}
                            {!isTerminalState && (
                              <div className="absolute top-3 right-3 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingCycle(cycle)}
                                  className="size-7 rounded-lg bg-[#1a2742] hover:bg-[#223354] border border-border/50 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                                  title="Chỉnh sửa chu kỳ này"
                                >
                                  <Pencil className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCycleToDelete(cycle)}
                                  className="size-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Xóa chu kỳ này"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-xs py-1">Chưa có chu kỳ nào được lưu</div>
                      )}
                    </div>
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
                      Tổng đơn cố định:{' '}
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

                {/* Khối xem chi tiết chiết tính giá */}
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

              {/* CARD 3: DANH SÁCH CHI TIẾT CÁC NGÀY CHƠI (CÓ ICON XÓA VÀ THÊM NGÀY LẺ) */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 text-white space-y-3.5 relative shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#a3e635]" />
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      Chi tiết các ngày chơi
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2742] text-slate-300 font-semibold border border-border/50">
                      {displayOrder.slots?.length || 0} buổi
                    </span>
                  </div>

                  {/* NÚT THÊM NGÀY LẺ CHO ĐƠN HÀNG CỐ ĐỊNH (THỨ 3 TRONG YÊU CẦU) */}
                  {!isTerminalState && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddSingleSlotOpen(true)}
                      className="h-8 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>Thêm ngày lẻ</span>
                    </Button>
                  )}
                </div>

                {/* Danh sách từng ngày và từng ca chơi */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {Object.keys(groupedSlotsByDate).length > 0 ? (
                    Object.entries(groupedSlotsByDate).map(([dateKey, slots]) => (
                      <div
                        key={dateKey}
                        className="rounded-xl bg-[#0e172a] border border-border/40 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#a3e635]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5" />
                            <span>
                              {getDayOfWeekLabel(dateKey)} • {formatDate(dateKey)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {slots.length} ca
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {slots.map((slot) => (
                            <div
                              key={slot.orderDetailId}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#131d31] border border-border/40 px-3 py-2 text-xs text-slate-200 hover:border-slate-600 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-white truncate">
                                  {slot.courtName}
                                </span>
                                {slot.courtTypeName && (
                                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                    ({slot.courtTypeName})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className="font-mono text-[#a3e635] bg-[#1a2742] px-2 py-0.5 rounded border border-border/40 text-[11px]">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </div>
                                <span className="font-mono font-bold text-white text-xs">
                                  {(slot.price || 0).toLocaleString('vi-VN')}đ
                                </span>

                                {/* NÚT XÓA 1 NGÀY CHƠI (THỨ 1 TRONG YÊU CẦU) */}
                                {!isTerminalState && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelSlot(slot)}
                                    className="size-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                                    title="Hủy buổi chơi này và hoàn tiền"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Chưa có ca chơi nào được ghi nhận trong đơn hàng này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CỘT PHẢI: DỊCH VỤ & GIAO DỊCH THANH TOÁN (PAYMENT TRANSACTIONS) */}
            {/* --------------------------------------------------------------- */}
            <div className="space-y-4">
              {/* CARD 4: DỊCH VỤ TRONG ĐƠN */}
              <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-[#a3e635]" />
                    <span className="font-bold text-sm text-slate-100">Dịch vụ đính kèm</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2742] text-slate-300 font-semibold border border-border/50">
                      {displayOrder.services?.length || 0}
                    </span>
                  </div>

                  {!isTerminalState && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddServiceOpen(true)}
                      className="h-8 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm dịch vụ</span>
                    </Button>
                  )}
                </div>

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
                      Không có dịch vụ nào đính kèm
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-300">
                    Tổng dịch vụ:{' '}
                    <span className="font-bold text-white">{totalServiceFormatted}đ</span>
                  </div>
                </div>
              </div>

              {/* CARD 5: LỊCH SỬ GIAO DỊCH THANH TOÁN (PAYMENT TRANSACTIONS) */}
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

                  {!isTerminalState && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddTransactionOpen(true)}
                      className="h-8 rounded-xl bg-[#1a2742] hover:bg-[#223354] border border-border/60 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Thêm giao dịch</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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

                          {/* Nút xem chi tiết hình ảnh biên lai nếu có ảnh */}
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
            {/* Nút HỦY ĐƠN màu cam đỏ */}
            <button
              type="button"
              disabled={isTerminalState || isActionPending}
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full h-11.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-md transition-colors cursor-pointer flex items-center justify-center active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              HỦY ĐƠN
            </button>

            {/* Nút ĐANG SỬ DỤNG / XÁC NHẬN */}
            <button
              type="button"
              disabled={isTerminalState || isActionPending || isConfirmed}
              onClick={handlePrimaryAction}
              className="w-full h-11.5 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-md transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isActionPending ? 'Đang xử lý...' : primaryButtonText}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* 4. SUB-MODALS LIÊN QUAN */}
      {/* ================================================================= */}

      {/* Modal chỉnh sửa thông tin khách hàng */}
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

      {/* Modal hủy toàn bộ đơn hàng (hoàn cọc/thanh toán) */}
      <CancelOrderModal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        totalPaid={totalPaidAmount}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      {/* Modal hủy một buổi chơi lẻ và hoàn tiền */}
      <CancelOrderSlotModal
        open={isCancelSlotOpen}
        onOpenChange={setIsCancelSlotOpen}
        orderId={displayOrder.id}
        slot={slotToDelete}
        totalPaid={totalPaidAmount}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      {/* Modal thêm ngày lẻ cho đơn hàng cố định (VisualBookingModal) */}
      {displayOrder.branchId && (
        <VisualBookingModal
          open={isAddSingleSlotOpen}
          onOpenChange={setIsAddSingleSlotOpen}
          branchId={displayOrder.branchId}
          branchName={displayOrder.branchName}
          excludeOrderCode={displayOrder.orderCode}
          title="Thêm ngày chơi lẻ cho đơn hàng cố định"
          confirmText="Xác nhận thêm ngày lẻ"
          onConfirm={handleAddSingleSlots}
        />
      )}

      {/* Modal chỉnh sửa chu kỳ cố định */}
      {editingCycle && (
        <FixedVisualBookingModal
          open={!!editingCycle}
          onOpenChange={(op) => !op && setEditingCycle(null)}
          branchId={displayOrder.branchId}
          branchName={displayOrder.branchName}
          initialCycle={initialCycleForEdit}
          title={`Chỉnh sửa Chu kỳ #${displayOrder.cycles.findIndex((c) => c.cycleId === editingCycle.cycleId) + 1}`}
          confirmText="Lưu cập nhật chu kỳ"
          onSaveCycle={handleSaveEditCycle}
        />
      )}

      {/* Modal thêm chu kỳ mới */}
      <FixedVisualBookingModal
        open={isAddCycleOpen}
        onOpenChange={setIsAddCycleOpen}
        branchId={displayOrder.branchId}
        branchName={displayOrder.branchName}
        title="Thêm chu kỳ mới vào đơn hàng cố định"
        confirmText="Thêm chu kỳ mới"
        onSaveCycle={handleSaveNewCycle}
      />

      {/* Modal xác nhận xóa chu kỳ */}
      {cycleToDelete && (
        <Dialog open={!!cycleToDelete} onOpenChange={(op) => !op && setCycleToDelete(null)}>
          <DialogContent className="w-[95vw] max-w-md p-6 bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa chu kỳ</h3>
                <p className="text-xs text-slate-400">Hành động này sẽ xóa các ca chơi thuộc chu kỳ này.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#131d31] border border-border/50 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Loại sân: </span>
                <span className="font-semibold text-white">{cycleToDelete.courtTypeName}</span>
              </div>
              <div>
                <span className="text-slate-400">Khung giờ: </span>
                <span className="font-mono text-[#a3e635]">
                  {formatTime(cycleToDelete.startTime)} - {formatTime(cycleToDelete.endTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Thứ áp dụng: </span>
                <span className="text-white">{cycleToDelete.dayNames?.join(', ') || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCycleToDelete(null)}
                className="border-border/60 text-slate-300 hover:text-white"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                disabled={isDeletingCycle}
                onClick={handleConfirmDeleteCycle}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeletingCycle ? 'Đang xóa...' : 'Xóa chu kỳ'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal thêm dịch vụ */}
      <AddServiceModal
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        orderId={displayOrder.id}
        branchId={displayOrder.branchId}
        currentServices={displayOrder.services || []}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      {/* Modal thêm giao dịch thanh toán */}
      <AddTransactionModal
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        orderId={displayOrder.id}
        orderCode={displayOrder.orderCode}
        totalAmount={displayOrder.totalAmount || 0}
        totalPaid={totalPaidAmount}
        onSuccess={() => {
          refetch();
          onOrderUpdated?.();
        }}
      />

      {/* Modal xem trước ảnh biên lai giao dịch thanh toán */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden bg-[#0B1324] border border-border/70 text-slate-100 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-border/60">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-sky-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-sm">
                  {previewImage.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="size-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center bg-[#070D1A] min-h-[300px]">
              <img
                src={previewImage.url}
                alt="Biên lai thanh toán"
                className="max-h-[65vh] w-auto rounded-xl object-contain border border-border/50 shadow-md"
              />
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs border-border/60 bg-[#131d31] text-white hover:bg-[#1a2742]"
                >
                  <a href={previewImage.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1.5" />
                    Mở ảnh gốc
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
