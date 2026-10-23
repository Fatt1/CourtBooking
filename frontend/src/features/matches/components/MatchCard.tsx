import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Eye, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { ParticipantStatus, type MatchDto } from '@/api/matches';

interface MatchCardProps {
  match: MatchDto;
  onJoin?: (match: MatchDto) => void;
  onViewDetail?: (match: MatchDto) => void;
}

export function MatchCard({ match, onJoin, onViewDetail }: MatchCardProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isHost = user?.id === match.hostId;

  // Trích xuất quận/huyện từ địa chỉ chi nhánh
  const district =
    match.branchAddress.split(',').slice(-2, -1)[0]?.trim() || match.branchName;

  // Tên tiêu đề thiết yếu: Thể thao + Chi nhánh hoặc mô tả
  const displayTitle =
    match.description?.trim().split('\n')[0]?.slice(0, 50) ||
    `Giao lưu ${match.sportTypeName} · ${match.skillLevel || 'Mọi trình độ'}`;

  const isConfirmed = match.myParticipantStatus === ParticipantStatus.Confirmed;
  const isPending = match.myParticipantStatus === ParticipantStatus.PendingApproval;
  const isFull = match.availableSlots <= 0;

  const handleOpenDetail = () => {
    if (onViewDetail) {
      onViewDetail(match);
    } else {
      navigate(`/matches/${match.id}`);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-[#235338]/50 hover:shadow-md flex flex-col justify-between gap-5 font-sans">
      <div className="space-y-4">
        {/* Header card: Sport tag, Distance & Trạng thái */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#235338] dark:text-emerald-400 bg-[#235338]/10 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
              {match.sportTypeName || 'GIAO LƯU'}
            </span>
            {match.distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <MapPin className="size-3" />
                ~{match.distanceKm} km
              </span>
            )}
          </div>

          {isFull ? (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Đã đủ người
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[#235338] bg-[#235338]/10 dark:text-emerald-300 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
              Đang mở
            </span>
          )}
        </div>

        {/* Chủ kèo: hiển thị tên chủ kèo */}
        <p className="text-xs font-semibold text-muted-foreground">
          Chủ kèo: <span className="text-foreground font-bold">{match.hostName}</span>
        </p>

        {/* Tiêu đề & Sân (Font Inter chuẩn, không dùng Barlow Condensed) */}
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-lg sm:text-xl text-foreground tracking-tight line-clamp-1">
            {displayTitle}
          </h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <MapPin className="size-3.5 text-[#235338] shrink-0" />
            <span>
              {match.branchName} · {district}
            </span>
          </p>
        </div>

        <div className="border-t border-border/60" />

        {/* 4 Chỉ số: Thời gian, Còn thiếu, Trình độ, Phí mỗi người */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Thời gian</span>
            <span className="text-xs font-bold text-foreground block font-mono">
              {match.startTime?.slice(0, 5)} · {match.date}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Còn thiếu</span>
            <span className="text-xs font-bold text-foreground block">
              {match.availableSlots > 0 ? `${match.availableSlots} người` : '0 người'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Trình độ</span>
            <span className="text-xs font-bold text-foreground block">
              {match.skillLevel || 'Phong trào'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Phí mỗi người</span>
            <span className="text-xs font-bold text-foreground block font-mono">
              {match.feePerPlayer > 0 ? formatVND(match.feePerPlayer) : 'Miễn phí'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Chế độ duyệt & Cụm nút hành động */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">
          Chế độ duyệt:{' '}
          <span className="font-semibold text-foreground">
            {match.approvalMode === 0 ? 'Tự động nhận' : 'Chủ phòng duyệt'}
          </span>
        </span>

        <div className="flex items-center gap-2">
          {/* Nút Xem chi tiết (Mở popup trực tiếp) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenDetail}
            className="rounded-xl text-xs font-bold border-border/80 hover:bg-muted px-3 py-1.5 gap-1 cursor-pointer"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            <span>Chi tiết</span>
          </Button>

          {/* Nút hành động chính tùy theo vai trò và trạng thái */}
          {isHost ? (
            <Button
              type="button"
              size="sm"
              onClick={() => navigate('/account?tab=orders')}
              className="bg-[#18231A] hover:bg-black text-white dark:bg-emerald-900/80 dark:hover:bg-emerald-800 font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Quản lý kèo
            </Button>
          ) : isConfirmed ? (
            /* Đã tham gia: Hiển thị Đã tham gia thay vì Tham gia */
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenDetail}
              className="border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer gap-1.5 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đã tham gia</span>
            </Button>
          ) : isPending ? (
            /* Đang chờ duyệt: Hiển thị Đang chờ duyệt thay vì Tham gia */
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenDetail}
              className="border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer gap-1.5 hover:bg-amber-100 transition-colors"
            >
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Đang chờ duyệt</span>
            </Button>
          ) : isFull ? (
            /* Kèo đã đầy */
            <Button
              type="button"
              size="sm"
              disabled
              className="bg-muted text-muted-foreground font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-not-allowed opacity-80"
            >
              Đã đủ người
            </Button>
          ) : (
            /* Khách chưa tham gia: Nút Tham gia */
            <Button
              type="button"
              size="sm"
              onClick={() => (onJoin ? onJoin(match) : handleOpenDetail())}
              className="bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs cursor-pointer transition-colors gap-1.5"
            >
              <Users className="size-3.5" />
              <span>Tham gia</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
