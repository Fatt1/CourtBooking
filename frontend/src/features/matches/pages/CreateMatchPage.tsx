import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyOrdersQuery, OrderStatus, type MyOrderDto } from '@/api/orders';
import { useCreateMatchMutation } from '@/api/matches';
import { createMatchSchema, type CreateMatchFormValues } from '../schemas/matchSchema';
import { SelectOrderModal } from '../components/SelectOrderModal';
import { toast } from 'sonner';

const SKILL_LEVELS = [
  'Cơ bản',
  'Trung bình',
  'Khá',
  'Nâng cao',
  'Phong trào / Giao lưu vui vẻ',
];

export function CreateMatchPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [isSelectOrderOpen, setIsSelectOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MyOrderDto | null>(null);

  // Lấy danh sách đơn đặt sân đã xác nhận đủ điều kiện mở kèo
  const { data: rawOrders = [] } = useMyOrdersQuery(OrderStatus.Confirmed);
  const myOrders = useMemo(() => rawOrders.filter((o) => o.canCreateMatch), [rawOrders]);

  // Đơn fallback mẫu theo đúng thiết kế nếu người dùng chưa có đơn trong DB
  const defaultFallbackOrder: MyOrderDto = {
    id: 'a1b2c3d4-1111-2222-3333-444444444444',
    orderCode: 'MD-PB-1042',
    branchId: 'b1b2c3d4-1111-2222-3333-444444444444',
    branchName: 'Victory Pickleball',
    branchAddress: '123 Võ Văn Ngân, Thủ Đức',
    district: 'Thủ Đức',
    province: 'TP.HCM',
    courtName: 'Pickleball 1',
    sportTypeId: 's-pickleball',
    sportTypeName: 'Pickleball',
    date: '24/09/2026',
    startTime: '19:00:00',
    endTime: '21:00:00',
    totalAmount: 280000,
    status: 2,
    hasSocialMatch: false,
    canCreateMatch: true,
  };

  useEffect(() => {
    if (!selectedOrder) {
      if (myOrders.length > 0) {
        setSelectedOrder(myOrders[0]);
      } else {
        setSelectedOrder(defaultFallbackOrder);
      }
    }
  }, [myOrders]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMatchFormValues>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      orderId: defaultFallbackOrder.id,
      missingPlayers: 2,
      skillLevel: 'Trung bình',
      feePerPlayer: 70000,
      description: 'Trận giao lưu nhẹ nhàng sau giờ làm. Ưu tiên vui vẻ, đúng giờ và tôn trọng mọi người.',
      approvalMode: 1, // Chủ phòng duyệt
    },
  });

  const selectedApprovalMode = watch('approvalMode');
  const missingPlayers = watch('missingPlayers');

  // Cập nhật orderId vào form khi chọn đơn
  useEffect(() => {
    if (selectedOrder) {
      setValue('orderId', selectedOrder.id);
      // Gợi ý tính nhẩm chi phí mỗi người: Tổng tiền / (số người tuyển + 1 host)
      if (selectedOrder.totalAmount > 0 && missingPlayers > 0) {
        const suggestedFee = Math.round(selectedOrder.totalAmount / (missingPlayers + 1) / 1000) * 1000;
        setValue('feePerPlayer', suggestedFee);
      }
    }
  }, [selectedOrder, missingPlayers, setValue]);

  const createMatchMutation = useCreateMatchMutation();

  const onSubmit = async (values: CreateMatchFormValues) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mở kèo giao lưu');
      navigate('/login');
      return;
    }

    try {
      const res = await createMatchMutation.mutateAsync({
        orderId: values.orderId,
        skillLevel: values.skillLevel,
        missingPlayers: values.missingPlayers,
        feePerPlayer: values.feePerPlayer,
        approvalMode: values.approvalMode,
        description: values.description,
      });

      toast.success('Mở kèo giao lưu thành công!');
      navigate(res?.matchId ? `/matches/${res.matchId}` : '/matches');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể tạo kèo giao lưu lúc này');
    }
  };

  const currentOrder = selectedOrder || defaultFallbackOrder;

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        {/* Nút quay lại */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Kèo giao lưu</span>
          </button>
        </div>

        {/* Tiêu đề trang */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#235338] dark:text-emerald-400">
            TÌM THÊM NGƯỜI CÙNG CHƠI
          </span>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-foreground tracking-tight uppercase">
            MỞ KÈO MỚI
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Chọn một lịch đặt đã thanh toán và cho cộng đồng biết bạn đang cần thêm ai.
          </p>
        </div>

        {/* Bố cục 2 Cột */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Cột Trái: Lịch đặt đã chọn (4 Cột) */}
            <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  LỊCH ĐẶT ĐÃ CHỌN
                </span>
                <span className="text-[11px] font-bold text-[#235338] bg-[#235338]/10 px-2 py-0.5 rounded-full border border-[#235338]/20">
                  Đã thanh toán
                </span>
              </div>

              {/* Thông tin sân */}
              <div className="space-y-1">
                <h3 className="font-heading font-black text-2xl text-foreground tracking-tight">
                  {currentOrder.branchName}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {currentOrder.courtName} · {currentOrder.district}
                </p>
              </div>

              {/* Grid thông số lịch đặt */}
              <div className="space-y-2.5 text-xs border-t border-border/60 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ngày chơi</span>
                  <span className="font-bold text-foreground font-mono">{currentOrder.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-bold text-foreground font-mono">
                    {currentOrder.startTime.slice(0, 5)}–{currentOrder.endTime.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tổng thanh toán</span>
                  <span className="font-bold text-foreground font-mono">
                    {formatVND(currentOrder.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mã lịch đặt</span>
                  <span className="font-bold text-foreground font-mono">{currentOrder.orderCode}</span>
                </div>
              </div>

              {/* Link chọn lịch đặt khác */}
              <div className="border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSelectOrderOpen(true)}
                  className="font-bold text-xs text-foreground underline underline-offset-4 hover:text-[#235338] transition-colors cursor-pointer"
                >
                  Chọn lịch đặt khác
                </button>
              </div>
            </div>

            {/* Cột Phải: Form thông tin kèo (8 Cột) */}
            <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                    THÔNG TIN KÈO
                  </span>
                  <h3 className="font-heading font-black text-2xl text-foreground tracking-tight">
                    Bạn đang thiếu bao nhiêu người?
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground italic sm:text-right">
                  Các thành viên sẽ tự chia phí tại sân.
                </span>
              </div>

              {/* Form Controls */}
              <div className="space-y-5">
                {/* 2 Select: Số người cần tuyển & Trình độ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                      SỐ NGƯỜI CẦN TUYỂN
                    </label>
                    <select
                      {...register('missingPlayers')}
                      className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[#235338]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} người
                        </option>
                      ))}
                    </select>
                    {errors.missingPlayers && (
                      <p className="text-[11px] font-semibold text-red-500">
                        {errors.missingPlayers.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                      TRÌNH ĐỘ MONG MUỐN
                    </label>
                    <select
                      {...register('skillLevel')}
                      className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[#235338]"
                    >
                      {SKILL_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                    {errors.skillLevel && (
                      <p className="text-[11px] font-semibold text-red-500">
                        {errors.skillLevel.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phí mỗi người */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                    PHÍ MỖI NGƯỜI (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    {...register('feePerPlayer')}
                    placeholder="70000"
                    className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[#235338]"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Đơn vị: đồng/người (Nhập 0 nếu bạn muốn bao sân miễn phí)
                  </span>
                  {errors.feePerPlayer && (
                    <p className="text-[11px] font-semibold text-red-500">
                      {errors.feePerPlayer.message}
                    </p>
                  )}
                </div>

                {/* Mô tả trận đấu */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                    MÔ TẢ TRẬN ĐẤU
                  </label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Trận giao lưu nhẹ nhàng sau giờ làm. Ưu tiên vui vẻ, đúng giờ và tôn trọng mọi người."
                    className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#235338] resize-none"
                  />
                  {errors.description && (
                    <p className="text-[11px] font-semibold text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Chế độ duyệt người tham gia */}
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                    CHẾ ĐỘ DUYỆT NGƯỜI THAM GIA
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 1: Tự động nhận */}
                    <div
                      onClick={() => setValue('approvalMode', 0)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedApprovalMode === 0
                          ? 'border-[#235338] bg-[#235338]/5 ring-1 ring-[#235338]'
                          : 'border-border/80 bg-card hover:border-[#235338]/40'
                      }`}
                    >
                      <div
                        className={`size-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                          selectedApprovalMode === 0
                            ? 'border-[#235338] bg-[#235338] text-white'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {selectedApprovalMode === 0 && <Check className="size-2.5 stroke-[3]" />}
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-foreground block">
                          Tự động nhận
                        </span>
                        <span className="text-[11px] text-muted-foreground block leading-relaxed">
                          Người chơi phù hợp được vào kèo ngay khi còn chỗ.
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Chủ phòng duyệt */}
                    <div
                      onClick={() => setValue('approvalMode', 1)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedApprovalMode === 1
                          ? 'border-[#235338] bg-[#235338]/5 ring-1 ring-[#235338]'
                          : 'border-border/80 bg-card hover:border-[#235338]/40'
                      }`}
                    >
                      <div
                        className={`size-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                          selectedApprovalMode === 1
                            ? 'border-[#235338] bg-[#235338] text-white'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {selectedApprovalMode === 1 && <Check className="size-2.5 stroke-[3]" />}
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-foreground block">
                          Chủ phòng duyệt
                        </span>
                        <span className="text-[11px] text-muted-foreground block leading-relaxed">
                          Bạn xem lời nhắn trước khi chấp nhận vào kèo.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/matches')}
                  className="font-bold text-xs px-5 rounded-xl hover:bg-muted"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createMatchMutation.isPending}
                  className="bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-xs px-7 py-5 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {isSubmitting || createMatchMutation.isPending ? 'Đang tạo...' : 'Mở kèo'}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Chọn lịch đặt khác */}
        <SelectOrderModal
          isOpen={isSelectOrderOpen}
          onClose={() => setIsSelectOrderOpen(false)}
          selectedOrderId={currentOrder.id}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      </div>
    </div>
  );
}
