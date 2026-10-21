import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  UserX,
  Settings,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useMatchDetailQuery,
  useJoinMatchMutation,
  useApproveParticipantMutation,
  useRejectParticipantMutation,
  useLeaveMatchMutation,
  useDeleteMatchMutation,
  ParticipantStatus,
  type MatchDetailDto,
  type MatchDto,
} from '@/api/matches';
import { toast } from 'sonner';

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | null;
  onSuccess?: () => void;
  onManageMatch?: (match: MatchDetailDto) => void;
}

export function MatchDetailModal({
  isOpen,
  onClose,
  matchId,
  onSuccess,
  onManageMatch,
}: MatchDetailModalProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [guestNote, setGuestNote] = useState('');

  const {
    data: match,
    isLoading,
    refetch,
  } = useMatchDetailQuery(isOpen && matchId ? matchId : undefined);

  const joinMutation = useJoinMatchMutation();
  const approveMutation = useApproveParticipantMutation();
  const rejectMutation = useRejectParticipantMutation();
  const leaveMutation = useLeaveMatchMutation();
  const deleteMutation = useDeleteMatchMutation();

  if (!isOpen) return null;

  const currentUserId = user?.id;
  const isHost = currentUserId != null && match?.hostId === currentUserId;
  const myParticipant = match?.participants.find((p) => p.playerId === currentUserId);
  const isConfirmedMember = myParticipant?.status === ParticipantStatus.Confirmed;
  const isPendingMember = myParticipant?.status === ParticipantStatus.PendingApproval;

  const confirmedCount =
    match?.participants.filter((p) => p.status === ParticipantStatus.Confirmed).length ?? 0;
  const totalCapacity = (match?.missingPlayers ?? 0) + 1; // +1 là host

  // Xử lý xin tham gia
  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia kèo giao lưu');
      navigate('/login');
      return;
    }
    if (!match) return;

    try {
      await joinMutation.mutateAsync(match.id);
      toast.success(
        match.approvalMode === 0
          ? 'Bạn đã tham gia kèo thành công!'
          : 'Đã gửi yêu cầu tham gia, vui lòng chờ chủ phòng duyệt!'
      );
      refetch();
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Không thể tham gia kèo lúc này');
    }
  };

  // Xử lý duyệt thành viên
  const handleApprove = async (participantId: string, playerName: string) => {
    if (!match) return;
    try {
      await approveMutation.mutateAsync({ matchId: match.id, participantId });
      toast.success(`Đã duyệt thành viên ${playerName} vào kèo!`);
      refetch();
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Không thể duyệt thành viên');
    }
  };

  // Xử lý từ chối thành viên (xóa khỏi danh sách)
  const handleReject = async (participantId: string, playerName: string) => {
    if (!match) return;
    try {
      await rejectMutation.mutateAsync({ matchId: match.id, participantId });
      toast.success(`Đã từ chối và xóa thành viên ${playerName} khỏi danh sách`);
      refetch();
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Không thể từ chối thành viên');
    }
  };

  // Xử lý rút lui khỏi kèo
  const handleLeave = async () => {
    if (!match) return;
    if (!confirm('Bạn có chắc chắn muốn rút lui khỏi kèo này?')) return;
    try {
      await leaveMutation.mutateAsync(match.id);
      toast.success('Bạn đã rút lui khỏi kèo');
      refetch();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Không thể rút lui lúc này');
    }
  };

  // Xử lý xóa kèo (dành cho host)
  const handleDeleteMatch = async () => {
    if (!match) return;
    if (!confirm('Bạn có chắc chắn muốn xóa kèo giao lưu này? Kèo sẽ bị xóa hoàn toàn khỏi hệ thống.')) return;
    try {
      await deleteMutation.mutateAsync(match.id);
      toast.success('Đã xóa kèo giao lưu thành công');
      refetch();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Không thể xóa kèo');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 border-border/80 shadow-2xl rounded-2xl flex flex-col font-sans">
        {/* Header Modal Bar */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#235338] dark:text-emerald-400 bg-[#235338]/10 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
              {match?.sportTypeName || 'GIAO LƯU THỂ THAO'}
            </span>
            {(match?.availableSlots ?? 0) <= 0 ? (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Đã đủ người
              </span>
            ) : (
              <span className="text-[11px] font-bold text-[#235338] bg-[#235338]/10 dark:text-emerald-300 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
                Đang mở
              </span>
            )}
          </div>

          <DialogTitle className="sr-only">Chi tiết kèo giao lưu</DialogTitle>
          <DialogDescription className="sr-only">Xem chi tiết và thành viên tham gia</DialogDescription>
        </div>

        {/* Nội dung chi tiết cuộn được */}
        <div className="overflow-y-auto px-6 py-6 space-y-6 flex-1">
          {isLoading || !match ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-[#235338]" />
              <p className="text-sm font-semibold">Đang tải thông tin kèo...</p>
            </div>
          ) : (
            <>
              {/* Tiêu đề & Mô tả kèo */}
              <div className="space-y-2">
                <h2 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
                  {match.description?.trim().split('\n')[0]?.slice(0, 70) ||
                    `Giao lưu ${match.sportTypeName} · ${match.branchName}`}
                </h2>
                {match.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {match.description}
                  </p>
                )}
              </div>

              {/* Box Địa điểm & Thời gian */}
              <div className="rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/70 p-4 space-y-1.5">
                <h4 className="font-sans font-bold text-base text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-[#235338] shrink-0" />
                  <span>{match.branchName}</span>
                </h4>
                <p className="text-xs text-muted-foreground pl-6">
                  {match.branchAddress}
                </p>
                <div className="pl-6 pt-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-[#235338]" />
                  <span className="font-mono">
                    {match.startTime?.slice(0, 5)} – {match.endTime?.slice(0, 5)}
                  </span>
                  <span>·</span>
                  <Calendar className="size-3.5 text-[#235338]" />
                  <span>{match.date}</span>
                </div>
              </div>

              {/* Grid 6 Thông số chi tiết */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 border-y border-border/60 py-5">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Người tổ chức
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5">
                    {match.hostName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Trình độ
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5">
                    {match.skillLevel || 'Mọi trình độ'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Còn thiếu
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5">
                    {match.availableSlots > 0 ? `${match.availableSlots} người` : '0 người'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Phí mỗi người
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5 font-mono">
                    {match.feePerPlayer > 0 ? formatVND(match.feePerPlayer) : 'Miễn phí'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Chế độ duyệt
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5">
                    {match.approvalMode === 0 ? 'Tự động nhận' : 'Chủ phòng duyệt'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    Mã kèo
                  </span>
                  <span className="text-sm font-bold text-foreground block pt-0.5 font-mono">
                    {match.orderCode || match.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Khối danh sách thành viên trong kèo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#235338]">
                      {confirmedCount}/{totalCapacity} NGƯỜI
                    </span>
                    <h3 className="font-sans font-bold text-lg text-foreground">
                      Thành viên trong kèo
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {match.participants?.map((participant) => {
                    const initial = participant.playerName?.charAt(0)?.toUpperCase() || 'U';
                    const isHostRow = participant.isHost || participant.playerId === match.hostId;
                    const isSelf = user?.id === participant.playerId;

                    return (
                      <div
                        key={participant.id}
                        className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center justify-between gap-3 transition-colors hover:border-[#235338]/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-muted flex items-center justify-center font-sans font-bold text-sm text-foreground shrink-0 border border-border/80">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm text-foreground">
                                {participant.playerName}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-white bg-[#235338] px-1.5 py-0.2 rounded-md">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                              {isHostRow
                                ? 'Người tổ chức'
                                : participant.status === ParticipantStatus.PendingApproval
                                ? 'Đã gửi yêu cầu'
                                : 'Thành viên'}
                            </span>
                          </div>
                        </div>

                        {/* Status & Duyệt nếu là host */}
                        <div className="flex items-center gap-2">
                          {participant.status === ParticipantStatus.Confirmed && (
                            <span className="text-xs font-bold text-[#235338] dark:text-emerald-400">
                              Đã tham gia
                            </span>
                          )}

                          {participant.status === ParticipantStatus.PendingApproval && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                Chờ duyệt
                              </span>

                              {isHost && (
                                <div className="flex items-center gap-1.5 ml-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleApprove(participant.id, participant.playerName)}
                                    className="h-7 text-xs font-bold bg-[#235338] hover:bg-[#1b432d] text-white rounded-lg px-2.5"
                                  >
                                    Duyệt
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(participant.id, participant.playerName)}
                                    className="h-7 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg px-2.5"
                                  >
                                    Từ chối
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Participant Row End */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Khối Hành động bên dưới (Tùy theo vai trò của User) */}
              <div className="border-t border-border/60 pt-5 space-y-4">
                {isHost ? (
                  /* Dành cho Host */
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#235338]">
                        Bạn là người tổ chức kèo này
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          if (onManageMatch) {
                            onManageMatch(match);
                          } else {
                            navigate('/account?tab=orders');
                          }
                          onClose();
                        }}
                        className="flex-1 bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-xs py-2 rounded-xl gap-1.5 cursor-pointer"
                      >
                        <Settings className="size-3.5" />
                        <span>Quản lý thông tin kèo</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteMatch}
                        disabled={deleteMutation.isPending}
                        className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 rounded-xl cursor-pointer"
                      >
                        {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa kèo'}
                      </Button>
                    </div>
                  </div>
                ) : isConfirmedMember ? (
                  /* Đã tham gia (Confirmed) */
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#235338] dark:text-emerald-400">
                      <CheckCircle2 className="size-4 shrink-0 text-[#235338]" />
                      <span>Bạn đã là thành viên chính thức của kèo này!</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hãy đến sân đúng giờ nhé. Phí tham gia sẽ do các thành viên tự chia tại sân.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLeave}
                      className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      Rút lui khỏi kèo
                    </Button>
                  </div>
                ) : isPendingMember ? (
                  /* Đang chờ duyệt (Pending) */
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Clock className="size-4 shrink-0 text-amber-600" />
                      <span>Yêu cầu tham gia của bạn đang chờ {match.hostName} phê duyệt.</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bạn sẽ nhận được thông báo ngay khi chủ phòng phản hồi.
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLeave}
                      className="text-xs font-bold text-muted-foreground hover:text-red-600"
                    >
                      Hủy yêu cầu tham gia
                    </Button>
                  </div>
                ) : (
                  /* Khách chưa tham gia */
                  <div className="space-y-3">
                    {match.approvalMode === 1 && (
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                          Lời nhắn cho chủ phòng (Tùy chọn)
                        </label>
                        <textarea
                          rows={2}
                          value={guestNote}
                          onChange={(e) => setGuestNote(e.target.value)}
                          placeholder="Ví dụ: Mình chơi được khoảng 1 năm và sẽ đến đúng giờ."
                          className="w-full rounded-xl border border-border/80 bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#235338] resize-none"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={handleJoin}
                      disabled={match.availableSlots <= 0 || joinMutation.isPending}
                      className="w-full bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-sm py-4 rounded-xl shadow-xs cursor-pointer transition-all gap-1.5"
                    >
                      {joinMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : match.availableSlots <= 0 ? (
                        <span>Kèo đã đủ người</span>
                      ) : (
                        <>
                          <Users className="size-4" />
                          <span>Xin tham gia kèo</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  Không thanh toán trên ứng dụng. Phí tham gia được các thành viên tự chia tại sân sau buổi chơi.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
