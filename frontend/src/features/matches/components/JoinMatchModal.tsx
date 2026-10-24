import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
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
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { useJoinMatchMutation, type MatchDto } from '@/api/matches';
import { getApiErrorMessage } from '@/types/api';
import { toast } from 'sonner';

interface JoinMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchDto | null;
  onSuccess?: () => void;
}

export function JoinMatchModal({
  isOpen,
  onClose,
  match,
  onSuccess,
}: JoinMatchModalProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const joinMutation = useJoinMatchMutation();

  if (!match) return null;

  const isHost = user?.id === match.hostId;
  const isAutoApproval = match.approvalMode === 0;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia kèo giao lưu.');
      navigate('/login');
      return;
    }

    try {
      await joinMutation.mutateAsync(match.id);
      toast.success(
        isAutoApproval
          ? 'Đã tham gia kèo giao lưu thành công!'
          : 'Đã gửi yêu cầu tham gia! Vui lòng chờ chủ phòng phê duyệt.'
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể tham gia kèo giao lưu.'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#235338] dark:text-emerald-400 bg-[#235338]/10 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
              {match.sportTypeName || 'GIAO LƯU'}
            </span>
            {match.distanceKm != null && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
                <MapPin className="size-3" />
                ~{match.distanceKm} km
              </span>
            )}
          </div>
          <DialogTitle className="font-sans font-bold text-xl text-foreground pt-1">
            Xác nhận tham gia kèo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thông tin chi tiết kèo giao lưu và điều kiện tham gia
          </DialogDescription>
        </DialogHeader>

        {/* THÔNG TIN CHI TIẾT KÈO */}
        <div className="space-y-4 py-2">
          {/* Box Chi nhánh & Địa chỉ */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-1.5">
            <h4 className="font-sans font-bold text-sm text-foreground">
              {match.branchName}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#235338] shrink-0" />
              <span>{match.branchAddress}</span>
            </p>
          </div>

          {/* Lưới 4 thông số: Thời gian, Chủ kèo, Còn trống, Phí */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="size-3 text-[#235338]" />
                Thời gian
              </span>
              <p className="font-bold text-foreground font-mono">
                {match.startTime?.slice(0, 5)} - {match.endTime?.slice(0, 5)}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {match.date}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Users className="size-3 text-[#235338]" />
                Chủ phòng
              </span>
              <p className="font-bold text-foreground truncate">
                {match.hostName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Trình độ: <strong className="text-foreground">{match.skillLevel || 'Mọi trình độ'}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Users className="size-3 text-[#235338]" />
                Chỗ trống
              </span>
              <p className="font-black text-sm text-[#235338] dark:text-emerald-400">
                {match.availableSlots > 0 ? `Còn ${match.availableSlots} chỗ` : 'Đã đủ người'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cần tuyển {match.missingPlayers} người
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <ShieldCheck className="size-3 text-[#235338]" />
                Phí tham gia
              </span>
              <p className="font-black text-sm text-foreground font-mono">
                {match.feePerPlayer > 0 ? formatVND(match.feePerPlayer) : 'Miễn phí'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                / mỗi người chơi
              </p>
            </div>
          </div>

          {/* Chế độ duyệt */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs">
            <CheckCircle2 className="size-4 text-[#235338] shrink-0" />
            <span className="text-muted-foreground">
              Chế độ duyệt:{' '}
              <strong className="text-foreground">
                {isAutoApproval
                  ? 'Tự động vào kèo ngay sau khi bấm tham gia'
                  : 'Yêu cầu chờ chủ phòng phê duyệt'}
              </strong>
            </span>
          </div>

          {/* Mô tả / Ghi chú */}
          {match.description && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-muted-foreground">Ghi chú từ chủ phòng:</span>
              <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60 whitespace-pre-line leading-relaxed">
                {match.description}
              </p>
            </div>
          )}

          {/* Cảnh báo nếu chưa đăng nhập */}
          {!isAuthenticated && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>Bạn cần đăng nhập để tham gia kèo giao lưu này.</span>
            </div>
          )}

          {/* Cảnh báo nếu là chủ phòng */}
          {isHost && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>Bạn là chủ phòng của kèo này.</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Đóng
          </Button>

          {!isAuthenticated ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="bg-[#235338] hover:bg-[#1b432d] text-white rounded-xl text-xs font-bold gap-1.5"
            >
              <LogIn className="size-3.5" />
              <span>Đăng nhập ngay</span>
            </Button>
          ) : isHost ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/account?tab=orders');
              }}
              className="bg-[#235338] hover:bg-[#1b432d] text-white rounded-xl text-xs font-bold"
            >
              Quản lý trong đơn hàng
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={joinMutation.isPending || match.availableSlots <= 0}
              onClick={handleJoin}
              className="bg-[#235338] hover:bg-[#1b432d] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Users className="size-3.5" />
                  <span>Xác nhận tham gia kèo</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
