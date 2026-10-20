import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { OwnerModal } from '../shared/OwnerModal';
import { useCompleteOrderMutation } from '@/api/orders';
import { getApiErrorMessage } from '@/types/api';
import { formatVND } from '@/lib/format';
import { toast } from 'sonner';

interface ConfirmCompleteOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode?: string;
  customerName?: string;
  remainingAmount?: number;
  totalAmount?: number;
  onSuccess?: () => void;
}

export function ConfirmCompleteOrderModal({
  open,
  onOpenChange,
  orderId,
  orderCode,
  customerName,
  remainingAmount = 0,
  totalAmount,
  onSuccess,
}: ConfirmCompleteOrderModalProps) {
  const { mutateAsync: completeOrder, isPending } = useCompleteOrderMutation();

  const isDebt = remainingAmount > 0;
  const paidAmount = typeof totalAmount === 'number' ? Math.max(0, totalAmount - remainingAmount) : undefined;

  const handleConfirm = async () => {
    if (isDebt) {
      toast.error(
        `Đơn hàng còn thiếu ${formatVND(remainingAmount)} chưa thanh toán đủ! Vui lòng thu tiền trước khi hoàn thành đơn.`
      );
      return;
    }

    try {
      await completeOrder(orderId);
      toast.success(`Đơn hàng #${orderCode || ''} đã đánh dấu HOÀN THÀNH (ĐÃ CHƠI XONG)!`, {
        description: 'Sân đã được giải phóng cho ca tiếp theo.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể hoàn thành đơn hàng'));
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận hoàn thành giờ chơi"
      description="Xác nhận ca chơi đã kết thúc để hoàn tất đơn hàng và giải phóng slot sân."
      icon={<CheckCircle2 className="size-5 text-emerald-700 dark:text-[#a3e635]" />}
      maxWidth="max-w-md"
      onSubmit={handleConfirm}
      submitText={
        isPending
          ? 'Đang xử lý...'
          : isDebt
          ? 'Còn thiếu tiền (Không thể hoàn thành)'
          : 'Xác nhận hoàn thành'
      }
      submitDisabled={isDebt || isPending}
      cancelText="Quay lại"
      isSubmitting={isPending}
    >
      <div className="space-y-4 py-2">
        {/* Thông tin đơn hàng */}
        <div className="rounded-xl bg-card border border-border/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mã đơn hàng:</span>
            <span className="font-bold text-foreground font-mono">
              {orderCode?.startsWith('#') ? orderCode : `#${orderCode || ''}`}
            </span>
          </div>
          {customerName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Khách hàng:</span>
              <span className="font-semibold text-foreground">{customerName}</span>
            </div>
          )}
          {typeof totalAmount === 'number' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tổng tiền đơn:</span>
              <span className="font-bold text-foreground font-mono">{formatVND(totalAmount)}</span>
            </div>
          )}
          {typeof paidAmount === 'number' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đã thanh toán:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatVND(paidAmount)}
              </span>
            </div>
          )}
          {typeof remainingAmount === 'number' && (
            <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2">
              <span className="text-muted-foreground font-medium">Còn thiếu:</span>
              <span
                className={`font-black font-mono text-sm ${
                  isDebt
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatVND(remainingAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Khối cảnh báo hoặc xác nhận */}
        {isDebt ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-foreground">
            <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-600 dark:text-rose-400">
                Đơn hàng còn thiếu tiền chưa thanh toán đủ!
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Đơn hàng vẫn còn thiếu{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {formatVND(remainingAmount)}
                </strong>
                . Hệ thống yêu cầu phải thanh toán đủ trước khi được phép đánh dấu hoàn thành ca chơi.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-lime-500/10 border border-lime-500/20 text-foreground">
            <Clock className="size-5 text-emerald-700 dark:text-[#a3e635] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-foreground">
                Bạn có chắc chắn muốn hoàn thành giờ chơi cho đơn này không?
              </p>
              <p className="text-muted-foreground">
                Trạng thái đơn hàng sẽ chuyển sang{' '}
                <strong className="text-emerald-700 dark:text-[#a3e635]">Hoàn thành</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </OwnerModal>
  );
}
