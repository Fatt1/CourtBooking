import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { SocialMatchStatus, type MatchDto } from '@/api/matches';

interface MatchCardProps {
  match: MatchDto;
}

export function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isHost = user?.id === match.hostId;
  const isClosed =
    match.status === SocialMatchStatus.Closed ||
    match.status === SocialMatchStatus.Cancelled;

  // Trích xuất quận/huyện từ địa chỉ chi nhánh
  const district =
    match.branchAddress.split(',').slice(-2, -1)[0]?.trim() || match.branchName;

  // Tên tiêu đề thiết yếu: Thể thao + Chi nhánh hoặc mô tả
  const displayTitle =
    match.description?.trim().split('\n')[0]?.slice(0, 50) ||
    `Giao lưu ${match.sportTypeName} · ${match.skillLevel || 'Mọi trình độ'}`;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-[#235338]/50 hover:shadow-md flex flex-col justify-between gap-5">
      <div className="space-y-4">
        {/* Header card: Sport tag & Trạng thái */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#235338] dark:text-emerald-400">
            {match.sportTypeName || 'GIAO LƯU'}
          </span>
          {isClosed ? (
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
              Đã kết thúc
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[#235338] bg-[#235338]/10 dark:text-emerald-300 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-[#235338]/20">
              Đang mở
            </span>
          )}
        </div>

        {/* Chủ kèo */}
        <p className="text-xs font-semibold text-muted-foreground">
          Chủ kèo: <span className="text-foreground font-bold">{isHost ? 'Bản thân' : match.hostName}</span>
        </p>

        {/* Tiêu đề & Sân */}
        <div className="space-y-1">
          <h3 className="font-heading font-black text-xl sm:text-2xl text-foreground tracking-tight line-clamp-1">
            {displayTitle}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            {match.branchName} · {district}
          </p>
        </div>

        <div className="border-t border-border/60" />

        {/* 4 Chỉ số: Thời gian, Còn thiếu, Trình độ, Phí mỗi người */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Thời gian</span>
            <span className="text-xs font-bold text-foreground block font-mono">
              {match.startTime.slice(0, 5)} · {match.date}
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

      {/* Footer: Chế độ duyệt & Nút hành động */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground font-medium">
          Chế độ duyệt:{' '}
          <span className="font-semibold text-foreground">
            {match.approvalMode === 0 ? 'Tự động nhận' : 'Chủ phòng duyệt'}
          </span>
        </span>

        <Button
          type="button"
          onClick={() => navigate(`/matches/${match.id}`)}
          className="bg-[#18231A] hover:bg-black text-white dark:bg-emerald-900/80 dark:hover:bg-emerald-800 font-bold text-xs px-5 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          {isHost ? 'Quản lý kèo' : 'Xem kèo'}
        </Button>
      </div>
    </div>
  );
}
