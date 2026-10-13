import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Calendar,
  Grid,
  Plus,
  ShoppingBag,
  Trash2,
  Clock,
  CircleDollarSign,
  Store,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores/useBranchStore';
import { useOwnerBranchesQuery } from '@/api/branches';
import {
  useCreateOrderByOwnerMutation,
  PaymentMethod,
  type CourtBookingSlotPayload,
  type OrderServiceInputItem,
} from '@/api/orders';
import { VisualBookingModal } from './VisualBookingModal';
import { AddServiceModal, type SelectedServiceItem } from './AddServiceModal';
import { type SelectedCourtSlot, timeToMinutes, mergeAdjacentSlots } from './timeline';
import { createDailyOrderSchema } from './schemas';
import { getApiErrorMessage } from '@/types/api';

interface CreateDailyOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  branchName?: string;
  onSuccess?: () => void;
}

export function CreateDailyOrderModal({
  open,
  onOpenChange,
  branchId: propBranchId,
  branchName: propBranchName,
  onSuccess,
}: CreateDailyOrderModalProps) {
  // Lấy chi nhánh từ store và query fallback
  const { selectedBranch, selectedBranchId, branches } = useBranchStore();
  const { data: ownerBranches = [] } = useOwnerBranchesQuery();

  const allBranches = useMemo(() => {
    return branches.length > 0 ? branches : ownerBranches;
  }, [branches, ownerBranches]);

  const activeBranch = useMemo(() => {
    if (propBranchId) {
      return allBranches.find((b) => b.id === propBranchId) || selectedBranch || null;
    }
    return selectedBranch || allBranches[0] || null;
  }, [propBranchId, allBranches, selectedBranch]);

  const activeBranchId = propBranchId || activeBranch?.id || selectedBranchId || '';
  const activeBranchName = propBranchName || activeBranch?.name || '';

  // Form states (Đã xóa Đối tượng và Đặt cọc theo yêu cầu)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);

  // Danh sách ca sân đã chọn từ VisualBookingModal
  const [selectedSlots, setSelectedSlots] = useState<SelectedCourtSlot[]>([]);

  // Danh sách dịch vụ đính kèm đã chọn từ AddServiceModal
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);

  // Modal phụ: Popup chọn lịch trực quan toàn màn hình
  const [isVisualBookingOpen, setIsVisualBookingOpen] = useState(false);

  // Modal phụ: Thêm dịch vụ
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  const { mutateAsync: createOrder, isPending } = useCreateOrderByOwnerMutation();

  // Reset form khi modal mở/đóng
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setNote('');
      setSelectedSlots([]);
      setSelectedServices([]);
      setPaymentMethod(PaymentMethod.Cash);
    }
    onOpenChange(newOpen);
  };

  // Gom các slot liền kề (1 sân, giờ liên tiếp -> 1 ca / 1 OrderDetail)
  const mergedSelectedSlots = useMemo(() => {
    return mergeAdjacentSlots(selectedSlots);
  }, [selectedSlots]);

  // Gom các slot theo ngày chơi để hiển thị
  const groupedSlotsByDate = useMemo(() => {
    return mergedSelectedSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, SelectedCourtSlot[]>);
  }, [mergedSelectedSlots]);

  // Tính tổng tiền sân & tổng giờ
  const { totalCourtAmount, totalMinutes } = useMemo(() => {
    let money = 0;
    let mins = 0;
    mergedSelectedSlots.forEach((s) => {
      money += s.price;
      const sMin = timeToMinutes(s.startTime);
      const eMin = timeToMinutes(s.endTime);
      mins += Math.max(0, eMin - sMin);
    });
    return { totalCourtAmount: money, totalMinutes: mins };
  }, [mergedSelectedSlots]);

  const totalHoursFormatted = useMemo(() => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h00`;
  }, [totalMinutes]);

  // Tính tổng tiền dịch vụ
  const totalServiceAmount = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0);
  }, [selectedServices]);

  // Tổng cộng toàn đơn
  const grandTotal = totalCourtAmount + totalServiceAmount;

  // Xóa 1 dịch vụ khỏi danh sách
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  // Xử lý tạo đơn
  const handleSubmit = async () => {
    // 1. Chuẩn hóa số điện thoại trước khi validate (nếu người dùng nhập không có 0)
    let formattedPhone = customerPhone.trim();
    if (formattedPhone.startsWith('+84')) {
      formattedPhone = '0' + formattedPhone.slice(3);
    } else if (formattedPhone.startsWith('84') && formattedPhone.length >= 11) {
      formattedPhone = '0' + formattedPhone.slice(2);
    } else if (/^[1-9][0-9]{8,9}$/.test(formattedPhone)) {
      formattedPhone = '0' + formattedPhone;
    }

    // 2. Validate dữ liệu bằng Zod Schema (đồng bộ chuẩn FluentValidation backend)
    const validationResult = createDailyOrderSchema.safeParse({
      branchId: activeBranchId,
      customerName,
      customerPhone: formattedPhone,
      note: note.trim() || null,
      paymentMethod,
      slots: mergedSelectedSlots,
    });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || 'Dữ liệu đơn hàng không hợp lệ.';
      toast.error(firstError);
      return;
    }

    // 3. Gom slots theo (CourtTypeId + PriceTableId) theo đúng format backend
    // Các slot liền kề cùng sân đã được gộp thành 1 slot duy nhất -> Tạo đúng 1 OrderDetail
    // Các slot khác sân hoặc không liền kề vẫn là các slot riêng biệt -> Tạo OrderDetail riêng biệt
    const groupMap: Record<string, { courtTypeId: string; priceTableId: string; slots: any[] }> = {};

    mergedSelectedSlots.forEach((slot) => {
      const key = `${slot.courtTypeId}__${slot.priceTableId}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          courtTypeId: slot.courtTypeId,
          priceTableId: slot.priceTableId,
          slots: [],
        };
      }
      groupMap[key].slots.push({
        courtId: slot.courtId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });

    const courtSlotsPayload: CourtBookingSlotPayload[] = Object.values(groupMap);

    const servicesPayload: OrderServiceInputItem[] = selectedServices.map((s) => ({
      serviceId: s.serviceId,
      quantity: s.quantity,
    }));

    try {
      await createOrder({
        branchId: activeBranchId,
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        note: note.trim() || null,
        discountAmount: 0,
        paymentMethod,
        courtSlots: courtSlotsPayload,
        services: servicesPayload.length > 0 ? servicesPayload : undefined,
      });

      toast.success('Tạo đơn đặt lịch thành công!');
      handleOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể tạo đơn đặt sân'));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden bg-[#070D1A] border border-border/70 text-slate-100 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <DialogHeader className="px-5 py-3.5 bg-[#0f172a] border-b border-border/60 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-5 stroke-[2.5]" />
              </button>
              <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-wide">
                Đặt lịch ngày trực quan
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Body Form */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4.5 flex-1">
            {/* 1. THÔNG TIN KHÁCH HÀNG (ĐÃ BỎ ĐỐI TƯỢNG) */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">
                  TÊN KHÁCH HÀNG <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: A. Hậu, Chị Lan..."
                  className="h-10 rounded-xl bg-[#131d31] border-border/60 text-white placeholder:text-slate-500 text-sm focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">
                  SỐ ĐIỆN THOẠI <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="h-10 rounded-xl bg-[#131d31] border-border/60 text-white placeholder:text-slate-500 text-sm focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">GHI CHÚ</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú đặt sân..."
                  className="w-full rounded-xl bg-[#131d31] border border-border/60 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>

            {/* 2. THÔNG TIN LỊCH ĐẶT */}
            <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#a3e635]" />
                  <span className="font-bold text-sm text-white">Thông tin lịch đặt</span>
                </div>

                {/* ICON / NÚT MỞ POPUP TRỰC QUAN TOÀN MÀN HÌNH */}
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeBranchId) {
                      toast.warning('Vui lòng chọn chi nhánh trước khi chọn ngày & giờ trực quan.');
                      return;
                    }
                    setIsVisualBookingOpen(true);
                  }}
                  className="h-8 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Grid className="size-3.5" />
                  <span>Chọn ngày & giờ trực quan</span>
                </Button>
              </div>

              {/* Chi nhánh đang chọn */}
              <div className="text-xs flex items-center justify-between text-slate-300">
                <span>Chi nhánh:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Store className="size-3.5 text-[#a3e635]" />
                  {activeBranchName || 'Chưa chọn chi nhánh'}
                </span>
              </div>

              {/* Danh sách ca sân đã chọn */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-300">Sân & Thời gian:</div>

                {selectedSlots.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(groupedSlotsByDate).map(([dateKey, slots]) => {
                      const dateParts = dateKey.split('-');
                      const displayDate =
                        dateParts.length === 3
                          ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                          : dateKey;

                      return (
                        <div
                          key={dateKey}
                          className="rounded-xl bg-[#0e172a] border border-border/50 p-3 space-y-1.5"
                        >
                          <div className="text-xs font-bold text-[#a3e635]">{displayDate}</div>
                          <div className="space-y-1 text-xs">
                            {slots.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-slate-200"
                              >
                                <span>
                                  • {s.courtName}: {s.startTime.substring(0, 5)} -{' '}
                                  {s.endTime.substring(0, 5)}
                                </span>
                                <span className="font-mono font-semibold text-[#a3e635]">
                                  {s.price.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Cụm tổng giờ & tiền */}
                    <div className="pt-2 border-t border-border/40 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tổng giờ:</span>
                        <span className="font-bold text-white font-mono">{totalHoursFormatted}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Tổng tiền sân:</span>
                        <span className="font-bold text-[#a3e635] text-sm">
                          {totalCourtAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsVisualBookingOpen(true)}
                    className="p-4 rounded-xl border border-dashed border-border/60 text-center text-xs text-slate-400 hover:border-[#a3e635]/60 hover:text-slate-300 cursor-pointer transition-colors"
                  >
                    Bấm vào đây hoặc nút trên để mở bảng lịch trực quan chọn sân và khung giờ.
                  </div>
                )}
              </div>
            </div>

            {/* 3. DỊCH VỤ ĐI KÈM */}
            <div className="rounded-2xl bg-[#131d31] border border-border/60 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-4 text-[#a3e635]" />
                  <span className="font-bold text-sm text-white">Dịch vụ đi kèm</span>
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

              {selectedServices.length > 0 ? (
                <div className="space-y-2">
                  {selectedServices.map((srv) => (
                    <div
                      key={srv.serviceId}
                      className="flex items-center justify-between rounded-xl bg-[#0e172a] border border-border/50 px-3 py-2 text-xs text-white"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{srv.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {srv.quantity} {srv.unit || 'phần'} x {srv.unitPrice.toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#a3e635]">
                          {(srv.unitPrice * srv.quantity).toLocaleString('vi-VN')}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(srv.serviceId)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-border/40 flex justify-between text-xs text-slate-300">
                    <span>Tổng dịch vụ:</span>
                    <span className="font-bold text-white">
                      {totalServiceAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-500 italic">
                  Chưa chọn dịch vụ nào (tùy chọn)
                </div>
              )}
            </div>

            {/* 4. PHƯƠNG THỨC THANH TOÁN (TIỀN MẶT / CHUYỂN KHOẢN) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">PHƯƠNG THỨC THANH TOÁN</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.Cash)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    paymentMethod === PaymentMethod.Cash
                      ? 'bg-emerald-700/80 border-emerald-500 text-white'
                      : 'bg-[#131d31] border-border/60 text-slate-300 hover:bg-[#1a2742]'
                  }`}
                >
                  <Banknote className="size-4" />
                  <span>Tiền mặt tại quầy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.QrTransfer)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    paymentMethod === PaymentMethod.QrTransfer
                      ? 'bg-emerald-700/80 border-emerald-500 text-white'
                      : 'bg-[#131d31] border-border/60 text-slate-300 hover:bg-[#1a2742]'
                  }`}
                >
                  <QrCode className="size-4" />
                  <span>Chuyển khoản QR</span>
                </button>
              </div>
            </div>

            {/* 5. TỔNG CỘNG ĐƠN HÀNG */}
            <div className="p-3.5 rounded-xl bg-[#0f172a] border border-border/60 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-300">TỔNG CỘNG ĐƠN HÀNG:</span>
              <span className="font-extrabold text-base text-[#a3e635]">
                {grandTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Footer Nút Xác Nhận */}
          <div className="p-4 bg-[#0f172a] border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl border-border/60 bg-[#131d31] hover:bg-[#1a2742] text-xs font-bold text-slate-200"
            >
              Hủy
            </Button>
            <Button
              disabled={isPending || selectedSlots.length === 0}
              onClick={handleSubmit}
              className="h-10 px-8 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-extrabold text-xs tracking-wider uppercase cursor-pointer disabled:opacity-40"
            >
              {isPending ? 'Đang tạo đơn...' : 'XÁC NHẬN'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP 2: MODAL CHỌN LỊCH TRỰC QUAN TOÀN MÀN HÌNH */}
      {activeBranchId && (
        <VisualBookingModal
          open={isVisualBookingOpen}
          onOpenChange={setIsVisualBookingOpen}
          branchId={activeBranchId}
          branchName={activeBranchName}
          initialSlots={selectedSlots}
          onConfirm={(slots) => setSelectedSlots(slots)}
        />
      )}

      {/* MODAL THÊM DỊCH VỤ (MODE CREATE) */}
      {activeBranchId && (
        <AddServiceModal
          open={isAddServiceOpen}
          onOpenChange={setIsAddServiceOpen}
          mode="create"
          branchId={activeBranchId}
          currentServices={selectedServices}
          onConfirm={(items) => setSelectedServices(items)}
        />
      )}
    </>
  );
}
