import { useState, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CircleDollarSign,
  Store,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores/useBranchStore';
import { useOwnerBranchesQuery } from '@/api/branches';
import {
  useCreateFixedOrderByOwnerMutation,
  PaymentMethod,
  type CreateFixedOrderByOwnerPayload,
  type FixedCycleInputPayload,
} from '@/api/orders';
import { AddServiceModal, type SelectedServiceItem } from './AddServiceModal';
import { FixedVisualBookingModal, type FixedCycleConfig } from './FixedVisualBookingModal';
import { getApiErrorMessage } from '@/types/api';

export interface CreateFixedOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  branchName?: string;
  onSuccess?: () => void;
}

export function CreateFixedOrderModal({
  open,
  onOpenChange,
  branchId: propBranchId,
  branchName: propBranchName,
  onSuccess,
}: CreateFixedOrderModalProps) {
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

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);

  // Danh sách các chu kỳ đã tạo
  const [cycles, setCycles] = useState<FixedCycleConfig[]>([]);

  // Danh sách dịch vụ đính kèm
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);

  // Sub-modal: Thêm chu kỳ trực quan
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Sub-modal: Thêm dịch vụ
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  const { mutateAsync: createFixedOrder, isPending } = useCreateFixedOrderByOwnerMutation();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setNote('');
      setDiscountAmount(0);
      setCycles([]);
      setSelectedServices([]);
      setPaymentMethod(PaymentMethod.Cash);
    }
    onOpenChange(newOpen);
  };

  // Thêm chu kỳ từ FixedVisualBookingModal
  const handleSaveCycle = (cycle: FixedCycleConfig) => {
    setCycles((prev) => [...prev, cycle]);
  };

  // Xóa chu kỳ
  const handleRemoveCycle = (index: number) => {
    setCycles((prev) => prev.filter((_, i) => i !== index));
  };

  // Tính tiền dịch vụ
  const totalServiceAmount = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [selectedServices]);

  // Xóa dịch vụ
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  // Xử lý submit tạo đơn cố định
  const handleSubmit = async () => {
    if (!activeBranchId) {
      toast.error('Không tìm thấy thông tin chi nhánh');
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName) {
      toast.error('Vui lòng nhập họ tên khách hàng');
      return;
    }

    if (!trimmedPhone) {
      toast.error('Vui lòng nhập số điện thoại khách hàng');
      return;
    }

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error('Số điện thoại không đúng định dạng');
      return;
    }

    if (cycles.length === 0) {
      toast.error('Vui lòng thêm ít nhất một chu kỳ đặt sân cố định');
      return;
    }

    // Chuyển đổi FixedCycleConfig sang FixedCycleInputPayload cho API
    const cyclesPayload: FixedCycleInputPayload[] = cycles.map((c) => ({
      courtTypeId: c.courtTypeId,
      priceTableId: c.priceTableId,
      startDate: c.startDate,
      endDate: c.endDate,
      daysOfWeekMask: c.daysOfWeekMask,
      startTime: c.startTime,
      endTime: c.endTime,
      courtIds: c.courtIds,
      exceptionDates: c.exceptionDates.length > 0 ? c.exceptionDates : undefined,
    }));

    const servicesPayload =
      selectedServices.length > 0
        ? selectedServices.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
        }))
        : undefined;

    const payload: CreateFixedOrderByOwnerPayload = {
      branchId: activeBranchId,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      note: note.trim() || undefined,
      discountAmount: Number(discountAmount) || 0,
      paymentMethod,
      cycles: cyclesPayload,
      services: servicesPayload,
    };

    try {
      await createFixedOrder(payload);
      toast.success('Tạo đơn đặt sân cố định thành công!');
      handleOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, 'Tạo đơn đặt cố định thất bại. Vui lòng thử lại.');
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-[#070D1A] border-border/80 text-foreground p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                <Repeat className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Đặt Lịch Cố Định Tại Quầy
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Store className="size-3 text-[#a3e635]" />
                  <span>Chi nhánh:</span>
                  <span className="font-semibold text-foreground">
                    {activeBranchName || 'Chưa chọn'}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/60 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Thông tin khách hàng
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    placeholder="VD: Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-[#0b1324] border-border/70 text-xs h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Số điện thoại <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    placeholder="VD: 0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#0b1324] border-border/70 text-xs h-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Ghi chú</label>
                  <Input
                    placeholder="Ghi chú thêm về đơn cố định..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-[#0b1324] border-border/70 text-xs h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Số tiền giảm giá (VNĐ)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    className="bg-[#0b1324] border-border/70 text-xs h-9 rounded-lg"
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.Cash)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${paymentMethod === PaymentMethod.Cash
                        ? 'border-[#a3e635] bg-[#a3e635]/10 text-foreground'
                        : 'border-border/60 bg-[#0b1324] text-muted-foreground hover:border-slate-500'
                      }`}
                  >
                    <Banknote
                      className={`size-4 ${paymentMethod === PaymentMethod.Cash ? 'text-[#a3e635]' : ''
                        }`}
                    />
                    <span>Tiền mặt tại quầy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.QrTransfer)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${paymentMethod === PaymentMethod.QrTransfer
                        ? 'border-[#a3e635] bg-[#a3e635]/10 text-foreground'
                        : 'border-border/60 bg-[#0b1324] text-muted-foreground hover:border-slate-500'
                      }`}
                  >
                    <QrCode
                      className={`size-4 ${paymentMethod === PaymentMethod.QrTransfer ? 'text-[#a3e635]' : ''
                        }`}
                    />
                    <span>Chuyển khoản QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KHỐI 2: DANH SÁCH CHU KỲ ĐẶT CỐ ĐỊNH */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Chu kỳ đặt sân ({cycles.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Thêm các chu kỳ lặp lại theo tuần hoặc tháng
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsCycleModalOpen(true)}
                  className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs h-8.5 rounded-xl cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Thêm chu kỳ</span>
                </Button>
              </div>

              {cycles.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border/50 rounded-xl bg-[#090f1e]/50">
                  <Repeat className="size-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-300">Chưa có chu kỳ nào được thêm</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Bấm &quot;Thêm chu kỳ&quot; để thiết lập khoảng ngày, thứ trong tuần và khung giờ
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cycles.map((cycle, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0b1324] border border-border/70 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 text-[11px] font-bold">
                            Chu kỳ #{idx + 1}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {cycle.courtTypeName} ({cycle.priceTableName})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-[#a3e635]" />
                            <span>
                              {cycle.startDate} đến {cycle.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-[#a3e635]" />
                            <span>
                              {cycle.startTime.slice(0, 5)} - {cycle.endTime.slice(0, 5)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground font-semibold">Thứ:</span>
                            <span>{cycle.daysOfWeekLabels.join(', ')}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground font-semibold">Sân:</span>
                            <span>{cycle.courtNames.join(', ')}</span>
                          </div>
                        </div>

                        {cycle.exceptionDates.length > 0 && (
                          <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                            <span>Loại trừ:</span>
                            <span>{cycle.exceptionDates.join(', ')}</span>
                          </div>
                        )}

                        <div className="text-xs text-[#a3e635] font-semibold">
                          Dự kiến: {cycle.totalSessions} buổi
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCycle(idx)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 size-8 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KHỐI 3: DỊCH VỤ ĐÍNH KÈM */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Dịch vụ đính kèm ({selectedServices.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Nước uống, thuê vợt, cầu lông đi kèm
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddServiceOpen(true)}
                  className="gap-1.5 text-xs h-8.5 rounded-xl border-border/70 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Thêm dịch vụ</span>
                </Button>
              </div>

              {selectedServices.length > 0 ? (
                <div className="divide-y divide-border/40 rounded-xl bg-[#0b1324] border border-border/70 overflow-hidden">
                  {selectedServices.map((service) => (
                    <div
                      key={service.serviceId}
                      className="p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="size-4 text-sky-400" />
                        <div>
                          <div className="font-semibold text-foreground">{service.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {service.unitPrice.toLocaleString('vi-VN')} đ / {service.unit}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-foreground">SL: {service.quantity}</span>
                        <span className="font-bold text-[#a3e635]">
                          {(service.unitPrice * service.quantity).toLocaleString('vi-VN')} đ
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(service.serviceId)}
                          className="size-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-border/50 rounded-xl bg-[#090f1e]/50 text-xs text-muted-foreground">
                  Chưa chọn dịch vụ nào
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tổng số chu kỳ:</span>
              <span className="font-bold text-foreground">{cycles.length}</span>
              {totalServiceAmount > 0 && (
                <>
                  <span>•</span>
                  <span>Dịch vụ:</span>
                  <span className="font-semibold text-[#a3e635]">
                    +{totalServiceAmount.toLocaleString('vi-VN')} đ
                  </span>
                </>
              )}
              {discountAmount > 0 && (
                <>
                  <span>•</span>
                  <span>Giảm giá:</span>
                  <span className="font-semibold text-rose-400">
                    -{discountAmount.toLocaleString('vi-VN')} đ
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="text-xs h-9 rounded-xl border-border/70 cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs h-9 rounded-xl cursor-pointer"
              >
                {isPending ? 'Đang tạo đơn...' : 'Xác nhận tạo đơn cố định'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal phụ cấu hình chu kỳ */}
      {isCycleModalOpen && (
        <FixedVisualBookingModal
          open={isCycleModalOpen}
          onOpenChange={setIsCycleModalOpen}
          branchId={activeBranchId}
          branchName={activeBranchName}
          existingCycles={cycles}
          onSaveCycle={handleSaveCycle}
        />
      )}

      {/* Modal phụ thêm dịch vụ */}
      <AddServiceModal
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        branchId={activeBranchId}
        currentServices={selectedServices}
        onConfirm={(services) => setSelectedServices(services)}
      />
    </>
  );
}
