import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Building2, Calendar, Clock, ArrowRight, ShieldCheck, UserX } from 'lucide-react';
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
} from '@/api/matches';
import { toast } from 'sonner';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const { data: serverMatch, isLoading } = useMatchDetailQuery(id);

  // Mutations
  const joinMutation = useJoinMatchMutation();
  const approveMutation = useApproveParticipantMutation();
  const rejectMutation = useRejectParticipantMutation();
  const leaveMutation = useLeaveMatchMutation();
  const deleteMutation = useDeleteMatchMutation();

  const [guestNote, setGuestNote] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-20 flex flex-col items-center justify-center space-y-4">
        <div className="size-10 rounded-full border-4 border-[#235338] border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Đang tải thông tin kèo giao lưu...</p>
      </div>
    );
  }

  if (!serverMatch) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-20 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy thông tin kèo giao lưu</h2>
        <p className="text-sm text-muted-foreground">Kèo này có thể không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate('/events')} variant="outline" className="font-semibold mt-2">
          Quay lại danh sách kèo
        </Button>
      </div>
    );
  }

  const match = serverMatch;

  // Xác định vai trò của user hiện tại trong kèo
  const currentUserId = user?.id;
  const isHost = currentUserId === match.hostId;
  const myParticipant = match.participants.find((p) => p.playerId === currentUserId);
  const isConfirmedMember = myParticipant?.status === ParticipantStatus.Confirmed;
  const isPendingMember = myParticipant?.status === ParticipantStatus.PendingApproval;

  // Đếm thành viên đã duyệt
  const confirmedCount = match.participants.filter(
    (p) => p.status === ParticipantStatus.Confirmed
  ).length;
  const totalCapacity = match.missingPlayers + 1; // +1 là host

  // Xử lý xin tham gia
  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia kèo giao lưu');
      navigate('/login');
      return;
    }
    try {
      await joinMutation.mutateAsync(match.id);
      toast.success(
        match.approvalMode === 0
          ? 'Bạn đã tham gia kèo thành công!'
          : 'Đã gửi yêu cầu tham gia, vui lòng chờ chủ phòng duyệt!'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể tham gia kèo lúc này');
    }
  };

  // Xử lý duyệt thành viên
  const handleApprove = async (participantId: string, playerName: string) => {
    try {
      await approveMutation.mutateAsync({ matchId: match.id, participantId });
      toast.success(`Đã duyệt thành viên ${playerName} vào kèo!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể duyệt thành viên');
    }
  };

  // Xử lý từ chối thành viên (xóa khỏi danh sách)
  const handleReject = async (participantId: string, playerName: string) => {
    try {
      await rejectMutation.mutateAsync({ matchId: match.id, participantId });
      toast.success(`Đã từ chối và xóa thành viên ${playerName} khỏi danh sách`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể từ chối thành viên');
    }
  };

  // Xử lý rút lui
  const handleLeave = async () => {
    if (!confirm('Bạn có chắc chắn muốn rút lui khỏi kèo này?')) return;
    try {
      await leaveMutation.mutateAsync(match.id);
      toast.success('Bạn đã rút lui khỏi kèo');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể rút lui lúc này');
    }
  };

  // Xử lý xóa kèo
  const handleDeleteMatch = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa kèo giao lưu này? Kèo sẽ bị xóa hoàn toàn khỏi hệ thống.')) return;
    try {
      await deleteMutation.mutateAsync(match.id);
      toast.success('Đã xóa kèo giao lưu thành công');
      navigate('/matches');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể xóa kèo');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* Nút quay lại */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Tất cả kèo giao lưu</span>
          </button>
        </div>

        {/* Bố cục 2 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột Trái: Thông tin chi tiết & Danh sách thành viên (2 Cột) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thẻ 1: Thông tin trận đấu */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              {/* Header: Môn thể thao & Tag trạng thái */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#235338] dark:text-emerald-400">
                  {match.sportTypeName || 'GIAO LƯU THỂ THAO'}
                </span>
                {match.availableSlots <= 0 ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    Đã đủ người
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#235338] bg-[#235338]/10 dark:text-emerald-300 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-[#235338]/20">
                    Đang mở
                  </span>
                )}
              </div>

              {/* Tiêu đề lớn */}
              <div className="space-y-3">
                <h1 className="font-sans font-bold text-3xl sm:text-5xl text-foreground tracking-tight leading-tight uppercase">
                  {match.description?.trim().split('\n')[0]?.slice(0, 50) ||
                    `GIAO LƯU ${match.sportTypeName} ${match.branchName}`}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {match.description ||
                    'Trận giao lưu nhẹ nhàng, ưu tiên vui vẻ và đúng giờ. Đã có sân, mọi người tự chia phí tại sân sau buổi chơi.'}
                </p>
              </div>

              {/* Card nổi bật lịch sân đã đặt */}
              <div className="rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/60 p-4 sm:p-5 space-y-1">
                <h4 className="font-sans font-bold text-lg text-foreground">
                  {match.branchName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {match.branchAddress}
                </p>
                <p className="text-xs font-mono font-semibold text-foreground pt-1">
                  {match.startTime.slice(0, 5)}–{match.endTime.slice(0, 5)} · {match.date}
                </p>
              </div>

              {/* Grid 6 Thông số */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 border-t border-border/60 pt-6">
                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    NGƯỜI TỔ CHỨC
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5">
                    {match.hostName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    TRÌNH ĐỘ
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5">
                    {match.skillLevel || 'Mọi trình độ'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    CÒN THIẾU
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5">
                    {match.availableSlots} người
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    PHÍ MỖI NGƯỜI
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5 font-mono">
                    {match.feePerPlayer > 0 ? formatVND(match.feePerPlayer) : 'Miễn phí'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    CHẾ ĐỘ DUYỆT
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5">
                    {match.approvalMode === 0 ? 'Tự động nhận' : 'Chủ phòng duyệt'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                    MÃ KÈO
                  </span>
                  <span className="text-sm font-black text-foreground block pt-0.5 font-mono">
                    {match.orderCode || match.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Thẻ 2: Danh sách thành viên trong kèo */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                  {confirmedCount}/{totalCapacity} NGƯỜI
                </span>
                <h3 className="font-sans font-bold text-2xl text-foreground tracking-tight">
                  Thành viên trong kèo
                </h3>
              </div>

              {/* Danh sách người tham gia */}
              <div className="space-y-3">
                {match.participants.map((participant) => {
                  const initial = participant.playerName.charAt(0).toUpperCase();
                  const isHostRow = participant.isHost || participant.playerId === match.hostId;
                  const isSelf = user?.id === participant.playerId;

                  return (
                    <div
                      key={participant.id}
                      className="rounded-xl border border-border/70 bg-background/50 p-4 flex items-center justify-between gap-4 transition-all hover:border-[#235338]/30"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar chữ cái tròn */}
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center font-sans font-bold text-base text-foreground shrink-0 border border-border/80">
                          {initial}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {participant.playerName}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold text-white bg-[#235338] px-1.5 py-0.2 rounded-md">
                                Bạn
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground block">
                            {isHostRow ? 'Người tổ chức' : participant.status === ParticipantStatus.PendingApproval ? 'Đã gửi yêu cầu' : 'Thành viên'}
                          </span>
                        </div>
                      </div>

                      {/* Trạng thái thành viên & Nút thao tác của Host */}
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
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cột Phải: Sidebar Hành Động (1 Cột) */}
          <div className="space-y-6">
            {isHost ? (
              /* DÀNH CHO NGƯỜI TỔ CHỨC */
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-6 shadow-xs sticky top-24">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                    DÀNH CHO NGƯỜI TỔ CHỨC
                  </span>
                  <h3 className="font-sans font-bold text-2xl text-foreground tracking-tight">
                    Quản lý kèo
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Cập nhật thông tin tuyển người và cách duyệt thành viên của kèo.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    type="button"
                    onClick={() => navigate(`/matches/${match.id}/edit`)}
                    className="w-full bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-sm py-5 rounded-xl shadow-xs gap-2 cursor-pointer transition-all"
                  >
                    <span>Sửa kèo</span>
                    <ArrowRight className="size-4" />
                  </Button>

                  <div className="border-t border-border/60 pt-4 space-y-2">
                    <h5 className="font-bold text-xs text-foreground">
                      Lịch đặt sân được giữ nguyên
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bạn có thể sửa nội dung kèo; sân và giờ chơi lấy từ lịch đặt đã chọn.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteMatch}
                      disabled={deleteMutation.isPending}
                      className="w-full text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer"
                    >
                      {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa kèo giao lưu'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : isConfirmedMember ? (
              /* ĐÃ THAM GIA KÈO */
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 shadow-xs sticky top-24">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                    THÀNH VIÊN KÈO
                  </span>
                  <h3 className="font-sans font-bold text-2xl text-foreground tracking-tight">
                    Bạn đã vào kèo
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Hãy lưu lại thời gian và đến sân đúng giờ để giao lưu cùng mọi người nhé!
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3 text-xs text-[#235338] dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="size-5 shrink-0 text-[#235338]" />
                  <span>Bạn là thành viên chính thức của kèo này.</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLeave}
                  className="w-full text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                >
                  Rút lui khỏi kèo
                </Button>

                <div className="border-t border-border/60 pt-3">
                  <p className="text-[11px] text-muted-foreground text-center">
                    Không thanh toán trên ứng dụng. Phí tham gia được các thành viên tự chia tại sân.
                  </p>
                </div>
              </div>
            ) : isPendingMember ? (
              /* ĐANG CHỜ DUYỆT */
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 shadow-xs sticky top-24">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    THAM GIA CÙNG MỌI NGƯỜI
                  </span>
                  <h3 className="font-sans font-bold text-2xl text-foreground tracking-tight">
                    Xin một vị trí
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Chủ phòng sẽ xem lời nhắn trước khi chấp nhận bạn vào kèo.
                  </p>
                </div>

                <Button
                  type="button"
                  disabled
                  className="w-full bg-[#397B48]/70 text-white font-bold text-sm py-5 rounded-xl opacity-90 cursor-not-allowed"
                >
                  Đã gửi yêu cầu
                </Button>

                <div className="rounded-xl bg-muted/60 border border-border/60 p-4 flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-[#235338] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground block">Yêu cầu đã được gửi</span>
                    <span className="text-muted-foreground block leading-relaxed">
                      Chờ {match.hostName} duyệt. Bạn sẽ nhận được thông báo khi có kết quả.
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLeave}
                  className="w-full text-xs font-bold text-muted-foreground hover:text-red-600"
                >
                  Hủy yêu cầu tham gia
                </Button>

                <div className="border-t border-border/60 pt-3">
                  <p className="text-[11px] text-muted-foreground text-center">
                    Không thanh toán trên ứng dụng. Phí tham gia được các thành viên tự chia tại sân.
                  </p>
                </div>
              </div>
            ) : (
              /* KHÁCH CHƯA THAM GIA */
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 shadow-xs sticky top-24">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
                    THAM GIA CÙNG MỌI NGƯỜI
                  </span>
                  <h3 className="font-sans font-bold text-2xl text-foreground tracking-tight">
                    Xin một vị trí
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {match.approvalMode === 1
                      ? 'Chủ phòng sẽ xem xét trước khi chấp nhận bạn vào kèo.'
                      : 'Kèo tự động nhận người, bạn sẽ vào danh sách ngay khi còn chỗ.'}
                  </p>
                </div>

                {/* Form xin tham gia */}
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground block">
                      LỜI NHẮN CHO CHỦ PHÒNG (TÙY CHỌN)
                    </label>
                    <textarea
                      rows={3}
                      value={guestNote}
                      onChange={(e) => setGuestNote(e.target.value)}
                      placeholder="Ví dụ: Mình chơi được khoảng 1 năm và sẽ đến đúng giờ."
                      className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#235338] resize-none"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleJoin}
                    disabled={match.availableSlots <= 0 || joinMutation.isPending}
                    className="w-full bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-sm py-5 rounded-xl shadow-xs cursor-pointer transition-all"
                  >
                    {joinMutation.isPending ? 'Đang gửi...' : 'Xin tham gia'}
                  </Button>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-1">
                  <h5 className="font-bold text-xs text-foreground">
                    Không thanh toán trên ứng dụng
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Phí tham gia được các thành viên tự chia tại sân sau buổi chơi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
