import { Button } from '@/components/ui/button';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared';
import {
  type FixedOrderDto,
  type FixedOrderCycleSummaryDto,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusVariant,
} from '@/api/orders';
import { OrderPaymentSummaryCell } from './OrderPaymentSummaryCell';

interface FixedOrderTableProps {
  data: FixedOrderDto[];
  isLoading?: boolean;
  onViewDetail: (order: FixedOrderDto) => void;
  onApproveCancel?: (order: FixedOrderDto) => void;
}

/**
 * Format chuỗi ngày ngắn gọn DD/MM
 */
function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
  } catch {}
  return dateStr;
}

/**
 * Lấy danh sách thứ trong tuần từ DTO hoặc giải mã bitmask
 */
function getDaysOfWeekText(cycle: FixedOrderCycleSummaryDto): string {
  if (cycle.daysOfWeek && cycle.daysOfWeek.length > 0) {
    return cycle.daysOfWeek.join(', ');
  }
  if (cycle.daysOfWeekMask) {
    const days: string[] = [];
    if ((cycle.daysOfWeekMask & (1 << 1)) !== 0) days.push('Thứ 2');
    if ((cycle.daysOfWeekMask & (1 << 2)) !== 0) days.push('Thứ 3');
    if ((cycle.daysOfWeekMask & (1 << 3)) !== 0) days.push('Thứ 4');
    if ((cycle.daysOfWeekMask & (1 << 4)) !== 0) days.push('Thứ 5');
    if ((cycle.daysOfWeekMask & (1 << 5)) !== 0) days.push('Thứ 6');
    if ((cycle.daysOfWeekMask & (1 << 6)) !== 0) days.push('Thứ 7');
    if ((cycle.daysOfWeekMask & (1 << 0)) !== 0) days.push('Chủ nhật');
    if (days.length > 0) return days.join(', ');
  }
  return 'Hàng tuần';
}

/**
 * Bảng hiển thị danh sách đơn đặt sân cố định (chu kỳ):
 * - Mã đơn
 * - Khách hàng
 * - Chi tiết lịch (các chu kỳ với thanh xanh Matchday bên trái)
 * - Tổng tiền & Trạng thái thanh toán
 * - Trạng thái đơn (Badge chuẩn hệ thống, hiển thị "Đang sử dụng" cho đơn Confirmed)
 * - Thao tác: Chỉ có nút [Chi tiết], ĐÃ XÓA nút "Sửa" theo đúng yêu cầu
 */
export function FixedOrderTable({
  data,
  isLoading,
  onViewDetail,
  onApproveCancel,
}: FixedOrderTableProps) {
  const columns: ColumnDef<FixedOrderDto>[] = [
    // 1. MÃ ĐƠN
    {
      header: 'MÃ ĐƠN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[200px]',
      className: 'min-w-[200px] whitespace-nowrap',
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
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[180px]',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-sm">{item.customerName}</div>
          <div className="text-xs text-muted-foreground font-mono">{item.customerPhone}</div>
        </div>
      ),
    },

    // 3. CHI TIẾT LỊCH (CÁC CHU KỲ) - Layout chuẩn theo ảnh thiết kế
    {
      header: 'CHI TIẾT LỊCH (CÁC CHU KỲ)',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[340px]',
      cell: (item) => {
        if (!item.cycles || item.cycles.length === 0) {
          return <span className="text-xs text-muted-foreground">Chưa có chu kỳ</span>;
        }

        return (
          <div className="space-y-2.5 py-1">
            {item.cycles.map((cycle, idx) => {
              const courtText =
                cycle.courtNames && cycle.courtNames.length > 0
                  ? cycle.courtNames.join(', ')
                  : 'Sân';
              const timeText = `${cycle.startTime.substring(0, 5)} - ${cycle.endTime.substring(0, 5)}`;
              const daysText = getDaysOfWeekText(cycle);
              const dateRangeText = `${formatShortDate(cycle.startDate)} - ${formatShortDate(cycle.endDate)}`;

              return (
                <div
                  key={cycle.cycleId || idx}
                  className="border-l-2 border-[#a3e635] pl-2.5 py-0.5 space-y-0.5"
                >
                  <div className="font-semibold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                    <span className="text-foreground">Chu kỳ {idx + 1}:</span>
                    <span className="text-foreground">{courtText}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    <span className="text-muted-foreground font-medium">{timeText}</span>{' '}
                    <span>({daysText})</span>{' '}
                    <span className="text-muted-foreground">•</span>{' '}
                    <span className="text-muted-foreground">{dateRangeText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
    },

    // 4. TỔNG TIỀN
    {
      header: 'TỔNG TIỀN',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[150px]',
      cell: (item) => (
        <OrderPaymentSummaryCell
          totalAmount={item.totalAmount}
          remainingAmount={item.remainingAmount}
          paidAmount={item.paidAmount}
          refundAmount={item.refundAmount}
          status={item.status}
          isMono={true}
        />
      ),
    },

    // 5. TRẠNG THÁI
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground w-[160px]',
      cell: (item) => {
        // Với đơn cố định, trạng thái Confirmed thường đại diện cho "Đang sử dụng"
        let label = getOrderStatusLabel(item.status);
        let variant = getOrderStatusVariant(item.status);

        if (item.status === OrderStatus.Confirmed) {
          label = 'Đang sử dụng';
          variant = 'success';
        }

        return <OwnerStatusBadge status={label} variant={variant} />;
      },
    },

    // 6. THAO TÁC (CHỈ CÓ NÚT CHI TIẾT, ĐÃ XÓA NÚT SỬA)
    {
      header: 'THAO TÁC',
      headerClassName:
        'text-xs font-semibold tracking-wider text-muted-foreground text-right w-[140px]',
      className: 'text-right',
      cell: (item) => {
        const isCancelPending = item.status === OrderStatus.RequestCancellation;

        return (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
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
      emptyTitle="Không có đơn đặt lịch cố định nào"
      emptyDescription="Không tìm thấy đơn đặt cố định phù hợp với tiêu chí lọc."
      onRowClick={(item) => onViewDetail(item)}
    />
  );
}
