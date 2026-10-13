import { CheckCircle2, Clock } from 'lucide-react';
import { OwnerModal } from '../shared/OwnerModal';
import { useCompleteOrderMutation } from '@/api/orders';
import { toast } from 'sonner';

interface ConfirmCompleteOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode?: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function ConfirmCompleteOrderModal({
  open,
  onOpenChange,
  orderId,
  orderCode,
  customerName,
  onSuccess,
}: ConfirmCompleteOrderModalProps) {
  const { mutateAsync: completeOrder, isPending } = useCompleteOrderMutation();

  const handleConfirm = async () => {
    try {
      await completeOrder(orderId);
      toast.success(`Đơn hàng #${orderCode || ''} đã đánh dấu HOÀN THÀNH (ĐÃ CHƠI XONG)!`, {
        description: 'Sân đã được giải phóng cho ca tiếp theo.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn thành đơn hàng';
      toast.error(msg);
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận hoàn thành giờ chơi"
      description="Xác nhận ca chơi đã kết thúc để hoàn tất đơn hàng và giải phóng slot sân."
      icon={<CheckCircle2 className="size-5 text-[#a3e635]" />}
      maxWidth="max-w-md"
      onSubmit={handleConfirm}
      submitText={isPending ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
      cancelText="Quay lại"
      isSubmitting={isPending}
    >
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-[#131d31] border border-border/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Mã đơn hàng:</span>
            <span className="font-bold text-white font-mono">
              {orderCode?.startsWith('#') ? orderCode : `#${orderCode || ''}`}
            </span>
          </div>
          {customerName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Khách hàng:</span>
              <span className="font-semibold text-white">{customerName}</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-lime-500/10 border border-lime-500/20 text-slate-200">
          <Clock className="size-5 text-[#a3e635] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-medium text-white">
              Bạn có chắc chắn muốn hoàn thành giờ chơi cho đơn này không?
            </p>
            <p className="text-slate-400">
              Trạng thái đơn hàng sẽ chuyển sang <strong className="text-[#a3e635]">Hoàn thành</strong>.
            </p>
          </div>
        </div>
      </div>
    </OwnerModal>
  );
}
