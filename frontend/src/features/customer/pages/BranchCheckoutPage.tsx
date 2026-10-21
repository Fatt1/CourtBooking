import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  MapPin,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePublicBranchDetailQuery } from '@/api/branches';
import { useCreateOrderOnlineMutation, type CreateOrderOnlineResponse } from '@/api/orders';
import {
  type SelectedCourtSlot,
  mergeAdjacentSlots,
} from '@/features/court-owners/components/orders/timeline/pricingCalculator';
import { formatCurrency } from '@/lib/utils';
import { getImageUrl } from '@/api/storage';
import { useBranchPricingConfigQuery } from '@/api/pricing';
import {
  SelectBranchServicesModal,
  type SelectedServiceMapItem,
} from '../components/checkout/SelectBranchServicesModal';
import { BranchPaymentModal } from '../components/checkout/BranchPaymentModal';

export interface GroupedBookingItem {
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courtTypeName: string;
  priceTableId: string;
  priceTableName: string;
  date: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  slots: SelectedCourtSlot[];
}

interface CheckoutLocationState {
  branchId: string;
  branchName?: string;
  branchAddress?: string;
  branchBanner?: string;
  selectedDate: string;
  groupedBookings: GroupedBookingItem[];
  selectedSlots?: SelectedCourtSlot[];
  selectedPriceTableIds?: Record<string, string>;
  pricingConfigs?: import('@/api/pricing').CourtTypePricingConfigDto[];
  totalCourtPrice: number;
}

export function BranchCheckoutPage() {
  const { id: routeBranchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const state = (location.state as CheckoutLocationState) || null;
  const branchId = state?.branchId || routeBranchId || '';

  // Lấy thêm thông tin chi nhánh nếu thiếu
  const { data: branchDetail } = usePublicBranchDetailQuery(branchId);
  const { data: pricingConfigs = [] } = useBranchPricingConfigQuery(branchId);

  const branchName =
    state?.branchName || branchDetail?.name || 'Chi nhánh sân thể thao';
  const branchAddress =
    state?.branchAddress ||
    (branchDetail
      ? `${branchDetail.street}, ${branchDetail.district}, ${branchDetail.province}`
      : 'Đang cập nhật địa chỉ');
  const branchBanner =
    state?.branchBanner ||
    (branchDetail?.images && branchDetail.images.length > 0
      ? getImageUrl(branchDetail.images[0].key || branchDetail.images[0].url)
      : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80');

  const selectedDate = state?.selectedDate || '';
  const groupedBookings = state?.groupedBookings || [];

  // 1. Form thông tin người đặt
  const [customerName, setCustomerName] = useState(user?.fullName || user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerNote, setCustomerNote] = useState('');

  // Tự động điền thông tin nếu user đăng nhập
  useEffect(() => {
    if (user) {
      if (!customerName && (user.fullName || user.name)) {
        setCustomerName(user.fullName || user.name || '');
      }
      if (!customerPhone && user.phoneNumber) {
        setCustomerPhone(user.phoneNumber);
      }
      if (!customerEmail && user.email) {
        setCustomerEmail(user.email);
      }
    }
  }, [user]);

  // 2. Dịch vụ đi kèm
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedServiceMapItem>>({});
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  // 3. Chính sách & Checkbox
  const [isPolicyAgreed, setIsPolicyAgreed] = useState(true);

  // 4. Modal thanh toán
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderCreatedResponse, setOrderCreatedResponse] = useState<CreateOrderOnlineResponse | null>(null);

  // Mutation tạo đơn online
  const createOrderMutation = useCreateOrderOnlineMutation();

  // Tính tiền sân
  const totalCourtPrice = useMemo(() => {
    return groupedBookings.reduce((sum, g) => sum + g.totalPrice, 0);
  }, [groupedBookings]);

  // Tính tiền dịch vụ
  const totalServicesPrice = useMemo(() => {
    return Object.values(selectedServices).reduce(
      (sum, item) => sum + item.service.price * item.quantity,
      0
    );
  }, [selectedServices]);

  // Tổng tạm tính
  const grandTotal = totalCourtPrice + totalServicesPrice;

  // Format ngày DD/MM/YYYY
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length < 3) return selectedDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }, [selectedDate]);

  // Tăng/giảm nhanh số lượng dịch vụ từ danh sách đã chọn
  const handleUpdateServiceQty = (serviceId: string, delta: number) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (!next[serviceId]) return prev;
      const newQty = next[serviceId].quantity + delta;
      if (newQty <= 0) {
        delete next[serviceId];
      } else {
        next[serviceId] = {
          ...next[serviceId],
          quantity: newQty,
        };
      }
      return next;
    });
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  // Nhấn nút "Thanh toán"
  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Vui lòng nhập họ và tên người đặt sân!');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    // Làm sạch và chuẩn hóa số điện thoại
    let formattedPhone = customerPhone.replace(/[\s.-]/g, '');
    if (formattedPhone.startsWith('+84')) {
      // Giữ nguyên +84
    } else if (formattedPhone.startsWith('84') && formattedPhone.length >= 11) {
      formattedPhone = '0' + formattedPhone.slice(2);
    } else if (/^[1-9][0-9]{8,9}$/.test(formattedPhone)) {
      formattedPhone = '0' + formattedPhone;
    }

    if (!/^(0|\+84)[0-9]{9,10}$/.test(formattedPhone)) {
      toast.error('Số điện thoại không đúng định dạng hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)!');
      return;
    }

    if (!isPolicyAgreed) {
      toast.error('Vui lòng đồng ý với chính sách của chi nhánh trước khi thanh toán!');
      return;
    }

    // Lấy toàn bộ danh sách slot sân cụ thể
    const rawSlots: SelectedCourtSlot[] =
      state?.selectedSlots && state.selectedSlots.length > 0
        ? state.selectedSlots
        : groupedBookings.flatMap((g) => g.slots || []);

    if (rawSlots.length === 0) {
      toast.error('Chưa có sân nào được chọn! Vui lòng quay lại chọn giờ.');
      return;
    }

    try {
      // 1. Gộp các slot liền kề cùng sân
      const mergedSlots = mergeAdjacentSlots(rawSlots);

      // 2. Gom nhóm CourtBookingSlot theo (CourtTypeId + PriceTableId) theo đúng format backend
      const courtSlotsMap: Record<
        string,
        {
          courtTypeId: string;
          priceTableId: string;
          slots: Array<{ courtId: string; date: string; startTime: string; endTime: string }>;
        }
      > = {};

      mergedSlots.forEach((slot) => {
        const ctId = slot.courtTypeId;
        // Ưu tiên bảng giá người dùng đã chọn cho loại sân đó từ state
        let ptId = state?.selectedPriceTableIds?.[ctId] || slot.priceTableId || '';

        // 2. Tìm trong state.pricingConfigs hoặc pricingConfigs từ query
        if (!ptId || ptId.trim() === '') {
          const allConfigs =
            state?.pricingConfigs && state.pricingConfigs.length > 0
              ? state.pricingConfigs
              : pricingConfigs;
          const ct = allConfigs.find((c) => (c.courtTypeId || (c as any).id) === ctId);
          if (ct?.priceTables && ct.priceTables.length > 0) {
            const walkIn = ct.priceTables.find(
              (p) =>
                p.name.toLowerCase().includes('vãng lai') ||
                p.name.toLowerCase().includes('vang lai')
            );
            const chosen = walkIn || ct.priceTables[0];
            ptId = chosen.id || (chosen as any).Id || (chosen as any).priceTableId || '';
          }
        }

        // 3. Fallback an toàn: nếu vẫn trống, tìm bảng giá bất kỳ trong pricingConfigs
        if (!ptId || ptId.trim() === '') {
          for (const c of pricingConfigs) {
            if (c.priceTables && c.priceTables.length > 0) {
              const first = c.priceTables[0];
              ptId = first.id || (first as any).Id || (first as any).priceTableId || '';
              if (ptId) break;
            }
          }
        }

        const key = `${ctId}__${ptId || 'default'}`;
        if (!courtSlotsMap[key]) {
          courtSlotsMap[key] = {
            courtTypeId: ctId,
            priceTableId: ptId,
            slots: [],
          };
        }

        const formatTime = (t: string) => {
          if (!t) return '00:00:00';
          return t.length === 5 ? `${t}:00` : t;
        };

        courtSlotsMap[key].slots.push({
          courtId: slot.courtId,
          date: slot.date,
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
        });
      });

      const courtSlotsPayload = Object.values(courtSlotsMap);

      // Kiểm tra lần cuối trước khi gọi backend
      const invalidSlotGroup = courtSlotsPayload.find((g) => !g.priceTableId || g.priceTableId.trim() === '');
      if (invalidSlotGroup) {
        toast.error('Bảng giá (PriceTableId) không được để trống. Vui lòng chọn bảng giá trước khi thanh toán!');
        return;
      }

      // 3. Gom danh sách dịch vụ đính kèm
      const servicesPayload = Object.values(selectedServices)
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          serviceId: item.service.id,
          quantity: item.quantity,
        }));

      const fullNote = customerEmail
        ? `[Email: ${customerEmail}] ${customerNote}`.trim()
        : customerNote;

      const response = await createOrderMutation.mutateAsync({
        branchId,
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        note: fullNote || undefined,
        courtSlots: Object.values(courtSlotsMap),
        services: servicesPayload.length > 0 ? servicesPayload : undefined,
        playerId: user?.id || null,
      });

      setOrderCreatedResponse(response);
      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; title?: string } }; message?: string };
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.title ||
        error.message ||
        'Không thể khởi tạo đơn đặt sân. Vui lòng thử lại!';
      toast.error(msg);
    }
  };

  // Nếu không có thông tin đặt sân (người dùng truy cập trực tiếp url)
  if (groupedBookings.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-xl mx-auto text-center space-y-6 p-8 rounded-2xl bg-card border border-border shadow-xl">
          <div className="size-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading font-black text-2xl text-foreground">
              Chưa có thông tin đặt sân
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bạn chưa chọn khung giờ hoặc phiên làm việc đã được hoàn thành. Vui lòng quay lại trang
              chi nhánh để chọn sân trước khi thanh toán.
            </p>
          </div>
          <button
            onClick={() => navigate(`/branches/${branchId || ''}`)}
            className="px-6 py-3 rounded-xl bg-[#183424] hover:bg-[#132A1C] text-[#7CFF01] font-heading font-bold text-xs transition-all shadow-md inline-flex items-center gap-2"
          >
            <ChevronLeft className="size-4" />
            <span>Quay lại trang chi nhánh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Container chính */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Nút quay lại */}
        <div>
          <button
            type="button"
            onClick={() => navigate(`/branches/${branchId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>Quay lại chọn giờ</span>
          </button>
        </div>

        {/* Tiêu đề trang */}
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-widest text-[#7CFF01]">
            HOÀN TẤT ĐẶT SÂN
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight">
            KIỂM TRA VÀ THANH TOÁN
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Không cần tạo tài khoản. Hãy kiểm tra lịch chơi, chuyển khoản trực tiếp cho chủ sân và
            tải ảnh biên lai.
          </p>
        </div>

        {/* Layout 2 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM & CÁC BƯỚC (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bước 01: Thông tin người đặt */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-lg space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-7 rounded-full bg-[#7CFF01] text-black font-heading font-black text-xs">
                  01
                </span>
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    Thông tin người đặt
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Điền thông tin liên hệ để nhận thông báo xác nhận từ chủ sân.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Họ và tên <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Minh Anh"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-secondary/50 border border-border/70 focus:outline-none focus:ring-2 focus:ring-[#7CFF01]/60 text-foreground"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Số điện thoại <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-secondary/50 border border-border/70 focus:outline-none focus:ring-2 focus:ring-[#7CFF01]/60 text-foreground"
                    />
                  </div>
                </div>

                {/* Email liên hệ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email liên hệ</label>
                  <input
                    type="email"
                    placeholder="minhanh@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-secondary/50 border border-border/70 focus:outline-none focus:ring-2 focus:ring-[#7CFF01]/60 text-foreground"
                  />
                </div>

                {/* Lời nhắn cho sân */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Lời nhắn cho sân (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhóm đến sớm 10 phút để khởi động"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-secondary/50 border border-border/70 focus:outline-none focus:ring-2 focus:ring-[#7CFF01]/60 text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Bước 02: Dịch vụ đi kèm */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-lg space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-7 rounded-full bg-[#7CFF01] text-black font-heading font-black text-xs">
                  02
                </span>
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    Dịch vụ đi kèm
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mua hoặc thuê thêm theo danh mục của chủ sân.
                  </p>
                </div>
              </div>

              {/* Nút thêm dịch vụ */}
              <button
                type="button"
                onClick={() => setIsServicesModalOpen(true)}
                className="w-full py-3 rounded-xl border border-[#7CFF01]/40 bg-[#183424]/30 hover:bg-[#183424]/60 text-[#7CFF01] font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
              >
                <Plus className="size-4" />
                <span>+ Thêm dịch vụ</span>
              </button>

              {/* Danh sách dịch vụ đã chọn */}
              {Object.keys(selectedServices).length === 0 ? (
                <div className="text-xs text-muted-foreground py-2 text-center">
                  Chưa thêm dịch vụ nào
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  {Object.values(selectedServices).map((item) => (
                    <div
                      key={item.service.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getImageUrl(
                            item.service.image?.url || item.service.image?.key,
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'
                          )}
                          alt={item.service.name}
                          className="size-10 rounded-lg object-cover bg-background shrink-0 border border-border/40"
                        />
                        <div className="truncate">
                          <h4 className="font-bold text-foreground truncate">
                            {item.service.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            {formatCurrency(item.service.price)} /{item.service.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-lg border border-border/40">
                          <button
                            type="button"
                            onClick={() => handleUpdateServiceQty(item.service.id, -1)}
                            className="size-5 rounded flex items-center justify-center hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateServiceQty(item.service.id, 1)}
                            className="size-5 rounded flex items-center justify-center hover:bg-card text-[#7CFF01]"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Tổng giá dịch vụ này */}
                        <span className="font-bold text-foreground min-w-[70px] text-right">
                          {formatCurrency(item.service.price * item.quantity)}
                        </span>

                        {/* Nút xóa */}
                        <button
                          type="button"
                          onClick={() => handleRemoveService(item.service.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox điều khoản & NÚT THANH TOÁN */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-lg space-y-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPolicyAgreed}
                  onChange={(e) => setIsPolicyAgreed(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-[#7CFF01] focus:ring-[#7CFF01] accent-[#7CFF01]"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Tôi đã đọc{' '}
                  <span className="text-foreground font-semibold underline underline-offset-2">
                    chính sách của chi nhánh
                  </span>{' '}
                  và xác nhận thông tin phía trên là chính xác.
                </span>
              </label>

              {/* Nút thanh toán nổi bật */}
              <button
                type="button"
                disabled={!isPolicyAgreed || createOrderMutation.isPending}
                onClick={handleCheckout}
                className="w-full py-4 rounded-xl bg-[#7CFF01] hover:bg-[#6ee400] text-black font-heading font-black text-sm tracking-wide transition-all shadow-xl shadow-[#7CFF01]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang khởi tạo đơn hàng...</span>
                  </>
                ) : (
                  <span>Thanh toán</span>
                )}
              </button>

              <p className="text-[11px] text-center text-muted-foreground font-medium">
                Sau khi gửi, lịch đặt sẽ ở trạng thái{' '}
                <span className="text-foreground font-bold">Chờ chủ sân xác nhận thanh toán</span>.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: LỊCH CỦA BẠN (5 Cột) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="rounded-2xl bg-card border border-border/70 shadow-xl overflow-hidden space-y-5 p-5 sm:p-6">
              {/* Tiêu đề LỊCH CỦA BẠN */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7CFF01]">
                  LỊCH CỦA BẠN
                </span>
              </div>

              {/* Hình ảnh và Thông tin chi nhánh */}
              <div className="space-y-3">
                <div className="h-40 sm:h-44 rounded-xl overflow-hidden border border-border/50 relative">
                  <img
                    src={branchBanner}
                    alt={branchName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-heading font-black text-base drop-shadow-md">
                      {branchName}
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1 flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 shrink-0" />
                      <span>{branchAddress}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh sách các sân đã chọn */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {groupedBookings.map((group) => (
                  <div
                    key={group.courtId}
                    className="p-3 rounded-xl bg-secondary/50 border border-border/40 space-y-1"
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {group.courtTypeName.toUpperCase()} · {group.priceTableName.toUpperCase()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-xs text-foreground">
                        {group.courtName}
                      </div>
                      <div className="font-heading font-black text-xs text-foreground">
                        {formatCurrency(group.totalPrice)}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Clock className="size-3 text-[#7CFF01]" />
                      <span>
                        {group.timeRange} · {group.durationMinutes} phút
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thông tin ngày & thời lượng */}
              <div className="pt-2 border-t border-border/50 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Ngày chơi</span>
                  <span className="font-bold text-foreground">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tổng thời lượng</span>
                  <span className="font-bold text-foreground">
                    {groupedBookings.reduce((acc, g) => acc + g.durationMinutes, 0)} phút
                  </span>
                </div>
              </div>

              {/* Chi tiết chi phí */}
              <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground font-semibold">
                  <span>Tiền sân</span>
                  <span className="text-foreground">{formatCurrency(totalCourtPrice)}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground font-semibold">
                  <span>Dịch vụ đi kèm</span>
                  <span className="text-foreground">{formatCurrency(totalServicesPrice)}</span>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="font-heading font-black text-sm text-foreground uppercase tracking-tight">
                    Tạm tính
                  </span>
                  <span className="font-heading font-black text-2xl text-foreground">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Chú thích giữ chỗ thực tế */}
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
                <span className="font-bold text-foreground shrink-0">ⓘ Lưu ý:</span>
                <span>
                  Chưa giữ chỗ thực tế. Khi bấm <strong>Thanh toán</strong>, hệ thống sẽ bắt đầu
                  đếm ngược thời hạn giữ chỗ của sân.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chọn Dịch Vụ */}
      <SelectBranchServicesModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        branchId={branchId}
        currentServices={selectedServices}
        onApply={(newServices) => setSelectedServices(newServices)}
      />

      {/* Modal Thanh Toán Trực Tuyến & Minh Chứng */}
      <BranchPaymentModal
        isOpen={isPaymentModalOpen}
        orderData={orderCreatedResponse}
        branchId={branchId}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          navigate(`/branches/${branchId}`);
        }}
      />
    </div>
  );
}
