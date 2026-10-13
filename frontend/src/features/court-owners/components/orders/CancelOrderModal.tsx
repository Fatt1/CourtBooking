import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CircleDollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OwnerModal } from '../shared/OwnerModal';
import { useCancelOrderByOwnerMutation, PaymentMethod } from '@/api/orders';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode?: string;
  totalPaid?: number;
  onSuccess?: () => void;
}

export function CancelOrderModal({
  open,
  onOpenChange,
  orderId,
  orderCode,
  totalPaid = 0,
  onSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('Khách yêu cầu hủy đơn');
  const [refundAmount, setRefundAmount] = useState<number>(totalPaid > 0 ? totalPaid : 0);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>(PaymentMethod.QrTransfer);
  const { mutateAsync: cancelOrder, isPending } = useCancelOrderByOwnerMutation();

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      await cancelOrder({
        orderId,
        cancelReason: reason.trim(),
        refundAmount: refundAmount > 0 ? refundAmount : null,
        refundMethod: refundAmount > 0 ? refundMethod : null,
      });

      toast.success(`Đã hủy đơn ${orderCode || ''} thành công!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy đơn đặt sân';
      toast.error(msg);
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Xác nhận hủy đơn đặt #${orderCode}`}
      description="Hành động này sẽ giải phóng slot sân trên bảng lịch và hoàn tiền cọc (nếu có)."
      icon={<AlertTriangle className="size-5 text-rose-400" />}
      maxWidth="max-w-md"
      onSubmit={handleConfirm}
      submitText={isPending ? 'Đang xử lý...' : 'Xác nhận hủy & Giải phóng slot'}
      cancelText="Đóng"
      isSubmitting={isPending}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="text-xs font-semibold text-slate-200">
            Lý do hủy đơn <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do khách báo bận, đổi lịch hoặc lý do sân..."
            className="w-full rounded-xl bg-[#131d31] border border-border/60 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="refund-amount" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <CircleDollarSign className="size-3.5 text-amber-300" />
            Số tiền hoàn lại cho khách (VNĐ)
          </label>
          <Input
            id="refund-amount"
            type="number"
            min={0}
            step={10000}
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value) || 0)}
            className="bg-[#131d31] border-border/60 text-white focus-visible:ring-rose-400"
          />
          <p className="text-[11px] text-slate-400">
            Mặc định hoàn lại tiền cọc / đã trả nếu đủ điều kiện chính sách hoàn cọc.
          </p>
        </div>

        {refundAmount > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-200">
              Hình thức hoàn tiền <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefundMethod(PaymentMethod.QrTransfer)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  refundMethod === PaymentMethod.QrTransfer
                    ? 'border-lime-500/80 bg-lime-500/10 text-lime-400 shadow-sm'
                    : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
              >
                Chuyển khoản QR
              </button>
              <button
                type="button"
                onClick={() => setRefundMethod(PaymentMethod.Cash)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  refundMethod === PaymentMethod.Cash
                    ? 'border-lime-500/80 bg-lime-500/10 text-lime-400 shadow-sm'
                    : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
              >
                Tiền mặt
              </button>
            </div>
          </div>
        )}
      </div>
    </OwnerModal>
  );
}
