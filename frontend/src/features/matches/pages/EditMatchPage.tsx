import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useMatchDetailQuery,
  useUpdateMatchMutation,
  type MatchDetailDto,
} from '@/api/matches';
import { updateMatchSchema, type UpdateMatchFormValues } from '../schemas/matchSchema';
import { toast } from 'sonner';

const SKILL_LEVELS = [
  'Cơ bản',
  'Trung bình',
  'Khá',
  'Nâng cao',
  'Phong trào / Giao lưu vui vẻ',
];

export function EditMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: serverMatch, isLoading } = useMatchDetailQuery(id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMatchFormValues>({
    resolver: zodResolver(updateMatchSchema),
    defaultValues: {
      missingPlayers: 2,
      skillLevel: 'Trung bình',
      feePerPlayer: 70000,
      description: '',
      approvalMode: 1,
    },
  });

  useEffect(() => {
    if (serverMatch) {
      reset({
        missingPlayers: serverMatch.missingPlayers,
        skillLevel: serverMatch.skillLevel || 'Trung bình',
        feePerPlayer: serverMatch.feePerPlayer,
        description: serverMatch.description || '',
        approvalMode: serverMatch.approvalMode,
      });
    }
  }, [serverMatch, reset]);

  const selectedApprovalMode = watch('approvalMode');
  const updateMatchMutation = useUpdateMatchMutation();

  const onSubmit = async (values: UpdateMatchFormValues) => {
    if (!serverMatch) return;
    try {
      await updateMatchMutation.mutateAsync({
        id: serverMatch.id,
        skillLevel: values.skillLevel,
        missingPlayers: values.missingPlayers,
        feePerPlayer: values.feePerPlayer,
        approvalMode: values.approvalMode,
        description: values.description,
      });

      toast.success('Cập nhật kèo giao lưu thành công!');
      navigate(`/matches/${serverMatch.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể cập nhật kèo lúc này');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-20 text-center">
        <RefreshCw className="size-6 animate-spin text-[#235338] mx-auto mb-2" />
        <span className="text-sm text-muted-foreground">Đang tải thông tin kèo...</span>
      </div>
    );
  }

  if (!serverMatch) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-20 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy thông tin kèo giao lưu</h2>
        <p className="text-sm text-muted-foreground">Kèo này có thể không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate('/events')} variant="outline" className="font-semibold mt-2">
          Quay lại danh sách kèo
        </Button>
      </div>
    );
  }

  const match = serverMatch;

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        {/* Nút quay lại */}
        <div>
          <button
            type="button"
            onClick={() => navigate(`/matches/${match.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại kèo của tôi</span>
          </button>
        </div>

        {/* Tiêu đề trang */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#235338] dark:text-emerald-400 font-mono">
            KÈO GIAO LƯU · {match.orderCode || match.id.slice(0, 8).toUpperCase()}
          </span>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-foreground tracking-tight uppercase">
            SỬA KÈO
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Cập nhật thông tin tuyển người và cách duyệt thành viên của kèo.
          </p>
        </div>

        {/* Bố cục 2 Cột */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Cột Trái: Lịch đặt sân - Giữ nguyên (4 Cột) */}
            <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  LỊCH ĐẶT SÂN
                </span>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                  Giữ nguyên
                </span>
              </div>

              {/* Thông tin sân */}
              <div className="space-y-1">
                <h3 className="font-heading font-black text-2xl text-foreground tracking-tight">
                  {match.branchName}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {match.branchAddress}
                </p>
              </div>

              {/* Grid thông số lịch đặt cố định */}
              <div className="space-y-2.5 text-xs border-t border-border/60 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ngày chơi</span>
                  <span className="font-bold text-foreground font-mono">{match.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-bold text-foreground font-mono">
                    {match.startTime.slice(0, 5)}–{match.endTime.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mã lịch đặt</span>
                  <span className="font-bold text-foreground font-mono">{match.orderCode}</span>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sân, ngày và giờ chơi lấy từ lịch đặt đã chọn, không thay đổi khi sửa kèo.
                </p>
              </div>
            </div>

            {/* Cột Phải: Form thông tin có thể sửa (8 Cột) */}
            <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                    THÔNG TIN CÓ THỂ SỬA
                  </span>
                  <h3 className="font-heading font-black text-2xl text-foreground tracking-tight">
                    Nội dung kèo
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground italic sm:text-right">
                  Chỉnh những thông tin người tham gia sẽ nhìn thấy.
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
                    Đơn vị: đồng/người
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
                          Người chơi được vào kèo ngay khi còn chỗ.
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
                          Bạn xem lời nhắn trước khi chấp nhận.
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
                  onClick={() => navigate(`/matches/${match.id}`)}
                  className="font-bold text-xs px-5 rounded-xl hover:bg-muted"
                >
                  Hủy thay đổi
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || updateMatchMutation.isPending}
                  className="bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-xs px-7 py-5 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {isSubmitting || updateMatchMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
