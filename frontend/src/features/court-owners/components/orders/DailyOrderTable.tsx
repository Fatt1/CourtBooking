import { Button } from '@/components/ui/button';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared';
import {
  type DailyOrderDto,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
} from '@/api/orders';

interface DailyOrderTableProps {
  data: DailyOrderDto[];
  isLoading?: boolean;
  onViewDetail: (order: DailyOrderDto) => void;
  onApproveCancel?: (order: DailyOrderDto) => void;
}

/**
 * Format ngày hiển thị: nếu là hôm nay thì có thể kèm chữ Hôm nay
 */
function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const today = new Date();
      const orderDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const isToday =
        today.getFullYear() === orderDate.getFullYear() &&
        today.getMonth() === orderDate.getMonth() &&
        today.getDate() === orderDate.getDate();

      return isToday ? `${formatted} (Hôm nay)` : formatted;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Bảng hiển thị danh sách đơn ngày theo đúng yêu cầu:
 * - Cột Sân và Thời gian gộp chung
 * - Thêm cột Ngày
 * - Đã xóa nút "Sửa"
 */
export function DailyOrderTable({
  data,
  isLoading,
  onViewDetail,
  onApproveCancel,
}: DailyOrderTableProps) {
  const columns: ColumnDef<DailyOrderDto>[] = [
    // 1. MÃ ĐƠN (Tăng nhiều diện tích, chống ngắt dòng theo yêu cầu)
    {
      header: 'MÃ ĐƠN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[280px]',
      className: 'min-w-[280px] whitespace-nowrap',
      cell: (item) => (
        <span
          className="font-bold tracking-tight text-foreground text-sm font-mono whitespace-nowrap select-all hover:text-[#a3e635] transition-colors"
          title={item.orderCode}
        >
          {item.orderCode.startsWith('#') ? item.orderCode : `#${item.orderCode}`}
        </span>
      ),
    },

    // 2. KHÁCH HÀNG
    {
      header: 'KHÁCH HÀNG',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[170px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-sm">{item.customerName}</div>
          <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
        </div>
      ),
    },

    // 3. NGÀY CHƠI (Hiển thị ngày chơi thực tế từ slots)
    {
      header: 'NGÀY CHƠI',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[130px]',
      cell: (item) => {
        if (!item.details || item.details.length === 0) {
          return <span className="text-xs text-muted-foreground">Chưa có ca chơi</span>;
        }

        const uniqueDates = Array.from(
          new Set(item.details.map((d) => d.date?.split('T')[0]).filter(Boolean))
        );

        return (
          <div className="space-y-1">
            {uniqueDates.map((d) => (
              <div key={d} className="text-sm font-medium text-foreground">
                {formatDateLabel(d)}
              </div>
            ))}
          </div>
        );
      },
    },

    // 4. SÂN & THỜI GIAN (Gộp và nhóm theo ngày chơi)
    {
      header: 'SÂN & THỜI GIAN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[240px]',
      cell: (item) => {
        if (!item.details || item.details.length === 0) {
          return <span className="text-xs text-muted-foreground">Chưa có thông tin sân</span>;
        }

        const grouped = item.details.reduce((acc, detail) => {
          const d = detail.date?.split('T')[0] || 'unknown';
          if (!acc[d]) acc[d] = [];
          acc[d].push(detail);
          return acc;
        }, {} as Record<string, typeof item.details>);

        return (
          <div className="space-y-2 py-1">
            {Object.entries(grouped).map(([dateKey, slots]) => (
              <div key={dateKey} className="space-y-1.5">
                {Object.keys(grouped).length > 1 && (
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    {formatDateLabel(dateKey)}:
                  </div>
                )}
                {slots.map((detail, index) => {
                  const timeDisplay = `${detail.startTime.substring(0, 5)} - ${detail.endTime.substring(0, 5)}`;
                  return (
                    <div key={index} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-foreground text-sm">
                        {detail.courtName}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="rounded-md bg-muted/60 px-2 py-0.5 font-medium text-emerald-400">
                        {timeDisplay}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      },
    },

    // 5. TỔNG TIỀN
    {
      header: 'TỔNG TIỀN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[150px]',
      cell: (item) => {
        const isFullyPaid = item.remainingAmount <= 0;
        const isPartiallyPaid = item.remainingAmount > 0 && item.remainingAmount < item.totalAmount;

        return (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-foreground">
              {item.totalAmount.toLocaleString('vi-VN')}đ
            </div>
            {isFullyPaid && (
              <div className="text-xs font-medium text-emerald-400">Đã thanh toán</div>
            )}
            {isPartiallyPaid && (
              <div className="text-xs font-medium text-amber-400">
                Còn thiếu {item.remainingAmount.toLocaleString('vi-VN')}đ
              </div>
            )}
            {!isFullyPaid && !isPartiallyPaid && (
              <div className="text-xs font-medium text-rose-400">Chưa thanh toán</div>
            )}
          </div>
        );
      },
    },

    // 6. TRẠNG THÁI
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground w-[160px]',
      cell: (item) => {
        const label = getOrderStatusLabel(item.status);
        const variant = getOrderStatusVariant(item.status);
        return <OwnerStatusBadge status={label} variant={variant} />;
      },
    },

    // 7. THAO TÁC (ĐÃ XÓA NÚT SỬA THEO YÊU CẦU)
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground text-right w-[150px]',
      className: 'text-right',
      cell: (item) => {
        const isCancelPending = item.status === OrderStatus.RequestCancellation;

        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {isCancelPending && onApproveCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApproveCancel(item)}
                className="h-8 px-3 rounded-lg text-xs font-semibold border-rose-500/40 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
              >
                Duyệt hủy
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(item)}
              className="h-8 px-3 rounded-lg text-xs font-semibold border-border/60 bg-card/60 hover:bg-accent text-foreground cursor-pointer"
            >
              Chi tiết
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <CommonTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="Không có đơn đặt sân nào"
      emptyDescription="Không tìm thấy đơn hàng đặt ngày phù hợp với tiêu chí lọc."
      onRowClick={(item) => onViewDetail(item)}
    />
  );
}
