import { useMemo } from 'react';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
import {
  type OwnerEventItemDto,
  EventStatus,
} from '@/api/events';
import { cn } from '@/lib/utils';

interface OwnerEventTableProps {
  data: OwnerEventItemDto[];
  isLoading?: boolean;
  onViewDetail: (event: OwnerEventItemDto) => void;
  onViewParticipants?: (event: OwnerEventItemDto) => void;
}

/**
 * Format ngày hiển thị kèm nhận diện "Hôm nay"
 */
function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const today = new Date();
      const eventDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const isToday =
        today.getFullYear() === eventDate.getFullYear() &&
        today.getMonth() === eventDate.getMonth() &&
        today.getDate() === eventDate.getDate();

      return isToday ? `${formatted} (Hôm nay)` : formatted;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Tính trạng thái sự kiện hiển thị thực tế
 */
function getEventDisplayStatus(item: OwnerEventItemDto): {
  label: string;
  className: string;
} {
  if (item.status === EventStatus.Cancelled) {
    return {
      label: 'Đã hủy',
      className: 'text-rose-600 dark:text-rose-400 font-bold text-xs',
    };
  }

  // Kiểm tra thời gian thực tế xem có đang diễn ra hay đã kết thúc
  try {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    if (end < now || item.status === EventStatus.Closed) {
      return {
        label: 'Đã kết thúc',
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/90 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium',
      };
    }

    if (now >= start && now <= end) {
      return {
        label: 'Đang diễn ra',
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse',
      };
    }
  } catch {
    // fallback
  }

  if (item.status === EventStatus.Full || item.availableSlot <= 0) {
    return {
      label: 'Đóng đăng ký',
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium',
    };
  }

  return {
    label: 'Đang mở đăng ký',
    className: 'text-emerald-700 dark:text-[#a3e635] font-bold text-xs',
  };
}

export function OwnerEventTable({
  data,
  isLoading,
  onViewDetail,
  onViewParticipants,
}: OwnerEventTableProps) {
  const columns: ColumnDef<OwnerEventItemDto>[] = useMemo(
    () => [
      // 1. MÃ SK
      {
        header: 'MÃ SK',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[110px]',
        className: 'min-w-[110px] whitespace-nowrap',
        cell: (item) => (
          <span className="font-bold tracking-tight text-foreground text-sm font-mono whitespace-nowrap select-all hover:text-emerald-700 dark:hover:text-[#a3e635] transition-colors">
            {item.eventCode?.startsWith('#')
              ? item.eventCode
              : `#${item.eventCode || item.id.slice(0, 8).toUpperCase()}`}
          </span>
        ),
      },

      // 2. TÊN SỰ KIỆN
      {
        header: 'TÊN SỰ KIỆN',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[220px]',
        cell: (item) => {
          const skillText =
            item.skillLevelFrom || item.skillLevelTo
              ? `${item.skillLevelFrom || ''} ${item.skillLevelTo ? `- ${item.skillLevelTo}` : ''}`.trim()
              : 'Tất cả mọi người';

          const courtNames =
            item.courts && item.courts.length > 0
              ? item.courts.map((c) => c.courtName).join(', ')
              : null;

          return (
            <div className="space-y-0.5 max-w-[300px]">
              <div className="font-bold text-foreground text-sm truncate" title={item.title}>
                {item.title}
              </div>
              <div className="text-[11px] text-muted-foreground">{skillText}</div>
              {courtNames && (
                <div className="text-[10px] text-emerald-700 dark:text-[#a3e635] font-medium truncate">
                  Sân: {courtNames}
                </div>
              )}
            </div>
          );
        },
      },

      // 3. THỜI GIAN TỔ CHỨC
      {
        header: 'THỜI GIAN TỔ CHỨC',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[170px]',
        cell: (item) => {
          const s = new Date(item.startDate);
          const e = new Date(item.endDate);
          const sDate = s.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const sTime = s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
          const eDate = e.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const eTime = e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

          const isSameDay = sDate === eDate;

          return (
            <div className="space-y-0.5 whitespace-nowrap">
              <div className="font-semibold text-foreground text-xs">
                {isSameDay ? sDate : `${sDate} - ${eDate}`}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {sTime} - {eTime}
              </div>
            </div>
          );
        },
      },

      // 4. GIÁ VÉ (Thêm cột theo yêu cầu user)
      {
        header: 'GIÁ TIỀN',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[110px] text-right',
        className: 'text-right whitespace-nowrap',
        cell: (item) => (
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs font-mono">
              {Number(item.ticketPrice).toLocaleString('vi-VN')} đ
            </span>
            <div className="text-[10px] text-muted-foreground">/ vé</div>
          </div>
        ),
      },

      // 5. ĐÃ THAM GIA
      {
        header: 'ĐÃ THAM GIA',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[120px] text-center',
        className: 'text-center whitespace-nowrap',
        cell: (item) => {
          const isFull = item.soldTickets >= item.slots || item.availableSlot <= 0;
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">
                <span className="text-emerald-700 dark:text-[#a3e635]">{item.soldTickets}</span>
                <span className="text-muted-foreground font-normal">/{item.slots}</span>
              </div>
              <div
                className={cn(
                  'text-[11px]',
                  isFull ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-muted-foreground'
                )}
              >
                {isFull ? 'Đã đầy' : `Còn ${item.availableSlot} chỗ`}
              </div>
            </div>
          );
        },
      },

      // 6. TỔNG DOANH THU (Thêm cột theo yêu cầu user)
      {
        header: 'TỔNG DOANH THU',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[130px] text-right',
        className: 'text-right whitespace-nowrap',
        cell: (item) => {
          const revenue =
            (item.soldTickets || 0) * (item.ticketPrice || 0) ||
            item.estimatedRevenue ||
            0;
          return (
            <div className="space-y-0.5">
              <span className="font-bold text-amber-700 dark:text-amber-300 text-xs font-mono">
                {Number(revenue).toLocaleString('vi-VN')} đ
              </span>
              <div className="text-[10px] text-muted-foreground">tạm tính</div>
            </div>
          );
        },
      },

      // 7. TRẠNG THÁI
      {
        header: 'TRẠNG THÁI',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[140px] text-center',
        className: 'text-center whitespace-nowrap',
        cell: (item) => {
          const status = getEventDisplayStatus(item);
          return (
            <div className="flex justify-center">
              <span className={status.className}>{status.label}</span>
            </div>
          );
        },
      },

      // 8. THAO TÁC (Chi tiết & Người tham gia)
      {
        header: 'THAO TÁC',
        headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[190px] text-right',
        className: 'text-right whitespace-nowrap',
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(item);
              }}
              className="h-8 px-3 text-xs font-semibold bg-card border-border hover:bg-accent text-foreground hover:text-accent-foreground rounded-lg cursor-pointer"
            >
              Chi tiết
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewParticipants) {
                  onViewParticipants(item);
                }
              }}
              className="h-8 px-3 text-xs font-semibold border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg cursor-pointer"
            >
              Người tham gia
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetail, onViewParticipants]
  );

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm dark:shadow-xl">
      <CommonTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        skeletonRows={5}
        emptyTitle="Chưa có sự kiện thể thao nào"
        emptyDescription="Hiện chưa có sự kiện nào được tổ chức tại chi nhánh này. Hãy nhấn '+ Đặt sân > Lịch sự kiện' để tạo giải đấu hoặc sự kiện giao lưu!"
        onRowClick={onViewDetail}
        getRowKey={(item) => item.id}
      />
    </div>
  );
}
