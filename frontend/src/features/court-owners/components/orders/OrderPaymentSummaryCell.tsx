import { OrderStatus } from '@/api/orders';
import { cn } from '@/lib/utils';

interface OrderPaymentSummaryCellProps {
  totalAmount: number;
  remainingAmount: number;
  paidAmount?: number;
  refundAmount?: number;
  status: OrderStatus;
  className?: string;
  isMono?: boolean;
}

/**
 * Component hiển thị thông tin tiền và trạng thái thanh toán trực quan,
 * phân biệt rõ ràng giữa đơn đang hoạt động và đơn đã hủy (hoàn 100%, hoàn 1 phần / phí hủy, hoặc không thu).
 */
export function OrderPaymentSummaryCell({
  totalAmount,
  remainingAmount,
  paidAmount,
  refundAmount,
  status,
  className,
  isMono = false,
}: OrderPaymentSummaryCellProps) {
  const isCancelled = status === OrderStatus.Cancelled;

  // -----------------------------------------------------------------
  // TRƯỜNG HỢP 1: ĐƠN ĐÃ HỦY (CANCELLED)
  // -----------------------------------------------------------------
  if (isCancelled) {
    const paid = paidAmount ?? (totalAmount - remainingAmount);
    const refund = refundAmount ?? 0;
    const netRetained = Math.max(0, paid - refund); // Tiền sân thực thu / giữ lại

    // 1.1 Khách chưa trả đồng nào -> Không thu tiền
    if (paid <= 0) {
      return (
        <div className={cn('space-y-0.5', className)}>
          <div className={cn('text-sm font-semibold text-muted-foreground line-through', isMono && 'font-mono')}>
            {totalAmount.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-xs font-medium text-muted-foreground/80 flex items-center gap-1">
            <span>Đã hủy</span>
            <span className="text-[11px] text-muted-foreground/60">(Không thu)</span>
          </div>
        </div>
      );
    }

    // 1.2 Khách đã trả tiền và được HOÀN 100%
    if (refund >= paid) {
      return (
        <div className={cn('space-y-0.5', className)}>
          <div className={cn('text-sm font-semibold text-muted-foreground line-through', isMono && 'font-mono')}>
            {totalAmount.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1 flex-wrap">
            <span>Đã hoàn 100%</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              ({refund.toLocaleString('vi-VN')}đ)
            </span>
          </div>
        </div>
      );
    }

    // 1.3 Khách đã trả tiền và được HOÀN 1 PHẦN (VD: Hoàn 50%, sân giữ 50% phí hủy)
    if (refund > 0 && netRetained > 0) {
      return (
        <div className={cn('space-y-0.5', className)}>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={cn('text-sm font-bold text-amber-400', isMono && 'font-mono')}>
              {netRetained.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[11px] text-muted-foreground line-through font-mono">
              {totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="text-xs font-medium text-amber-300 flex items-center gap-1 flex-wrap">
            <span>Phí hủy</span>
            <span className="text-[11px] text-muted-foreground">
              (Đã hoàn {refund.toLocaleString('vi-VN')}đ)
            </span>
          </div>
        </div>
      );
    }

    // 1.4 Khách đã trả/cọc nhưng KHÔNG ĐƯỢC HOÀN (Sân giữ 100% cọc)
    return (
      <div className={cn('space-y-0.5', className)}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={cn('text-sm font-bold text-amber-400', isMono && 'font-mono')}>
            {netRetained.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[11px] text-muted-foreground line-through font-mono">
            {totalAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="text-xs font-medium text-amber-400 flex items-center gap-1">
          <span>Giữ cọc</span>
          <span className="text-[11px] text-muted-foreground">(Không hoàn)</span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // TRƯỜNG HỢP 2: ĐƠN ĐANG HOẠT ĐỘNG (Bình thường / Chờ duyệt / Hoàn thành)
  // -----------------------------------------------------------------
  const isFullyPaid = remainingAmount <= 0;
  const isPartiallyPaid = remainingAmount > 0 && remainingAmount < totalAmount;

  return (
    <div className={cn('space-y-0.5', className)}>
      <div className={cn('text-sm font-bold text-foreground', isMono && 'font-mono')}>
        {totalAmount.toLocaleString('vi-VN')}đ
      </div>
      {isFullyPaid && (
        <div className="text-xs font-medium text-emerald-400 dark:text-[#a3e635]">
          Đã thanh toán
        </div>
      )}
      {isPartiallyPaid && (
        <div className="text-xs font-medium text-amber-400">
          Còn thiếu {remainingAmount.toLocaleString('vi-VN')}đ
        </div>
      )}
      {!isFullyPaid && !isPartiallyPaid && (
        <div className="text-xs font-medium text-rose-400">
          Chưa thanh toán
        </div>
      )}
    </div>
  );
}
