import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Save,
  Plus,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';
import {
  useCreateMatchMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
  useMatchDetailQuery,
  useApproveParticipantMutation,
  useRejectParticipantMutation,
  ParticipantStatus,
} from '@/api/matches';
import type { MyOrderDto } from '@/api/orders';
import { getApiErrorMessage } from '@/types/api';
import { toast } from 'sonner';

interface ManageOrderMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: MyOrderDto | null;
  onSuccess?: () => void;
}

const SKILL_LEVELS = ['Cơ bản', 'Phong trào', 'Trung bình', 'Khá', 'Nâng cao'];

export function ManageOrderMatchModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ManageOrderMatchModalProps) {
  const isExistingMatch = Boolean(order?.hasSocialMatch && order?.socialMatchId);

  // Queries & Mutations
  const {
    data: matchDetail,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useMatchDetailQuery(order?.socialMatchId || undefined);

  const createMutation = useCreateMatchMutation();
  const updateMutation = useUpdateMatchMutation();
  const deleteMutation = useDeleteMatchMutation();
  const approveMutation = useApproveParticipantMutation();
  const rejectMutation = useRejectParticipantMutation();

  // Form State
  const [missingPlayers, setMissingPlayers] = useState<number>(2);
  const [feePerPlayer, setFeePerPlayer] = useState<number>(50000);
  const [skillLevel, setSkillLevel] = useState<string>('Phong trào');
  const [approvalMode, setApprovalMode] = useState<number>(0); // 0 = Tự động nhận, 1 = Duyệt tay
  const [description, setDescription] = useState<string>('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Load existing match data when editing
  useEffect(() => {
    if (isExistingMatch && matchDetail) {
      setMissingPlayers(matchDetail.missingPlayers);
      setFeePerPlayer(matchDetail.feePerPlayer);
      setSkillLevel(matchDetail.skillLevel || 'Phong trào');
      setApprovalMode(matchDetail.approvalMode);
      setDescription(matchDetail.description || '');
    } else if (!isExistingMatch) {
      setMissingPlayers(2);
      setFeePerPlayer(50000);
      setSkillLevel('Phong trào');
      setApprovalMode(0);
      setDescription('');
    }
  }, [isExistingMatch, matchDetail]);

  if (!order) return null;

  // Handle Tạo kèo mới
  const handleCreate = async () => {
    if (missingPlayers < 1) {
      toast.error('Số người cần tuyển tối thiểu là 1 người.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        orderId: order.id,
        missingPlayers,
        feePerPlayer: feePerPlayer || 0,
        skillLevel,
        approvalMode,
        description: description.trim() || undefined,
      });

      toast.success('Mở kèo giao lưu thành công! Đã công khai trên hệ thống.');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể mở kèo giao lưu.'));
    }
  };

  // Handle Sửa thông tin kèo
  const handleUpdate = async () => {
    if (!order.socialMatchId) return;

    if (missingPlayers < 1) {
      toast.error('Số người cần tuyển tối thiểu là 1 người.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: order.socialMatchId,
        missingPlayers,
        feePerPlayer: feePerPlayer || 0,
        skillLevel,
        approvalMode,
        description: description.trim() || undefined,
      });

      toast.success('Cập nhật thông tin kèo thành công!');
      refetchDetail();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật kèo giao lưu.'));
    }
  };

  // Handle Xóa kèo
  const handleDeleteMatch = async () => {
    if (!order.socialMatchId) return;

    try {
      await deleteMutation.mutateAsync(order.socialMatchId);
      toast.success('Đã xóa kèo giao lưu thành công!');
      setIsConfirmDeleteOpen(false);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa kèo giao lưu.'));
    }
  };

  // Handle Duyệt thành viên
  const handleApprove = async (participantId: string) => {
    if (!order.socialMatchId) return;
    try {
      await approveMutation.mutateAsync({
        matchId: order.socialMatchId,
        participantId,
      });
      toast.success('Đã duyệt người tham gia vào kèo!');
      refetchDetail();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi duyệt.'));
    }
  };

  // Handle Từ chối thành viên
  const handleReject = async (participantId: string) => {
    if (!order.socialMatchId) return;
    try {
      await rejectMutation.mutateAsync({
        matchId: order.socialMatchId,
        participantId,
      });
      toast.success('Đã từ chối và xóa thành viên khỏi danh sách.');
      refetchDetail();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi từ chối.'));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#397B48] bg-[#397B48]/10 px-2.5 py-0.5 rounded-full border border-[#397B48]/20">
                {isExistingMatch ? 'QUẢN LÝ KÈO GIAO LƯU' : 'MỞ KÈO GIAO LƯU'}
              </span>
              {isExistingMatch && matchDetail && (
                <span
                  className={cn(
                    'text-[11px] font-bold px-2.5 py-0.5 rounded-full border',
                    matchDetail.availableSlots > 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  )}
                >
                  {matchDetail.availableSlots > 0
                    ? `Còn ${matchDetail.availableSlots} chỗ trống`
                    : 'Đã đủ thành viên'}
                </span>
              )}
            </div>
            <DialogTitle className="font-heading font-black text-xl text-foreground pt-1">
              {isExistingMatch ? 'Thông tin & Quản lý kèo của đơn' : 'Mở kèo giao lưu tìm đồng đội'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isExistingMatch
                ? 'Bạn có thể chỉnh sửa số người cần tuyển, chi phí hoặc xóa kèo tại đây.'
                : 'Mở kèo để kết nối những người chơi cùng sở thích tham gia vào ca chơi của bạn.'}
            </DialogDescription>
          </DialogHeader>

          {/* BOX TÓM TẮT THÔNG TIN ĐƠN ĐẶT SÂN */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{order.branchName}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Mã đơn: <strong>{order.orderCode}</strong>
              </span>
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#397B48] shrink-0" />
              <span>{order.branchAddress}</span>
            </p>
            <div className="flex items-center gap-3 pt-1 font-semibold flex-wrap">
              <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-md border border-border/60">
                <Calendar className="size-3 text-[#397B48]" />
                {order.date}
              </span>
              <span className="flex items-center gap-1 bg-card px-2.5 py-1 rounded-md border border-border/60">
                <Clock className="size-3 text-[#397B48]" />
                {order.startTime?.slice(0, 5)} - {order.endTime?.slice(0, 5)}
              </span>
              <span className="bg-card px-2.5 py-1 rounded-md border border-border/60 font-mono">
                {order.courtName}
              </span>
            </div>
          </div>

          {/* NỘI DUNG FORM: TẠO HOẶC SỬA */}
          {isExistingMatch && isLoadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-[#397B48]" />
              <span>Đang tải thông tin kèo...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              {/* 1. Số lượng người cần tuyển & Phí mỗi người */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    Số người cần tuyển thêm <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={missingPlayers}
                    onChange={(e) => setMissingPlayers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="rounded-xl text-xs font-semibold"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Số người bạn muốn mời vào cùng chơi
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    Phí chia sẻ mỗi người (VNĐ)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={feePerPlayer}
                    onChange={(e) => setFeePerPlayer(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-xl text-xs font-semibold font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {feePerPlayer > 0 ? formatVND(feePerPlayer) : 'Miễn phí cho người tham gia'}
                  </span>
                </div>
              </div>

              {/* 2. Trình độ yêu cầu */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Trình độ người chơi mong muốn
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSkillLevel(level)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                        skillLevel === level
                          ? 'bg-[#183424] text-white shadow-xs'
                          : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Chế độ duyệt thành viên */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Chế độ duyệt thành viên
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalMode(0)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                      approvalMode === 0
                        ? 'border-[#397B48] bg-[#397B48]/10 text-foreground'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <CheckCircle2 className="size-3.5 text-[#397B48]" />
                      <span>Tự động nhận (Khuyên dùng)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Thành viên bấm tham gia là vào kèo ngay khi còn chỗ trống.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalMode(1)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                      approvalMode === 1
                        ? 'border-[#397B48] bg-[#397B48]/10 text-foreground'
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                      <ShieldCheck className="size-3.5 text-[#397B48]" />
                      <span>Chủ phòng duyệt</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Bạn sẽ xem danh sách yêu cầu và duyệt từng người chơi.
                    </p>
                  </button>
                </div>
              </div>

              {/* 4. Mô tả / Lời nhắn */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Ghi chú / Lời nhắn cho người tham gia
                </label>
                <Textarea
                  rows={3}
                  placeholder="Ví dụ: Đánh vui vẻ giao lưu, ưu tiên đến đúng giờ, đã bao gồm nước uống..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              {/* 5. DANH SÁCH NGƯỜI THAM GIA NẾU ĐÃ CÓ KÈO */}
              {isExistingMatch && matchDetail && matchDetail.participants.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      Danh sách thành viên ({matchDetail.participants.length} người)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Còn {matchDetail.availableSlots} chỗ trống
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card overflow-hidden">
                    {matchDetail.participants.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>{p.playerName}</span>
                            {p.isHost && (
                              <span className="text-[10px] bg-[#397B48]/15 text-[#397B48] px-1.5 py-0.2 rounded font-black">
                                CHỦ PHÒNG
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {p.status === ParticipantStatus.Confirmed && '✓ Đã tham gia'}
                            {p.status === ParticipantStatus.PendingApproval && '⏳ Chờ bạn duyệt'}
                          </span>
                        </div>

                        {/* Nút hành động duyệt / từ chối nếu đang chờ duyệt */}
                        {!p.isHost && p.status === ParticipantStatus.PendingApproval && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApprove(p.id)}
                              className="size-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              title="Duyệt tham gia"
                            >
                              <UserCheck className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(p.id)}
                              className="size-7 p-0 border-red-500/30 text-red-600 hover:bg-red-500/10 rounded-lg"
                              title="Từ chối"
                            >
                              <UserX className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FOOTER: NÚT HÀNH ĐỘNG */}
          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
            {/* Nút Xóa kèo (chỉ hiện khi đã có kèo) */}
            {isExistingMatch ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="rounded-xl text-xs font-bold border-red-500/30 text-red-600 hover:bg-red-500/10 gap-1.5 mr-auto cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Xóa kèo</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs font-bold"
              >
                Đóng
              </Button>

              {!isExistingMatch ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={createMutation.isPending}
                  onClick={handleCreate}
                  className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Đang tạo kèo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Mở kèo ngay</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={handleUpdate}
                  className="bg-[#183424] hover:bg-[#132A1C] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL XÁC NHẬN XÓA KÈO */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="size-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle className="font-heading font-black text-lg text-foreground">
              Xác nhận xóa kèo giao lưu này?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Khi xóa kèo, bài đăng giao lưu sẽ bị xóa hoàn toàn khỏi hệ thống và các thành viên đã tham gia sẽ bị hủy. Đơn đặt sân của bạn vẫn được giữ nguyên.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Không, giữ lại
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteMatch}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span>Xác nhận xóa kèo</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
