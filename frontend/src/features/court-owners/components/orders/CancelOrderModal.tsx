import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OwnerModal } from '../shared/OwnerModal';
import {
  useCancelOrderByOwnerMutation,
  useRejectOrderCancellationMutation,
  PaymentMethod,
} from '@/api/orders';
import { getApiErrorMessage } from '@/types/api';

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode?: string;
  totalPaid?: number;
  customerNote?: string;
  onSuccess?: () => void;
}

export function CancelOrderModal({
  open,
  onOpenChange,
  orderId,
  orderCode,
  totalPaid = 0,
  customerNote,
  onSuccess,
}: CancelOrderModalProps) {
  // Quyết định: 'approve' = Đồng ý duyệt hủy, 'reject' = Từ chối yêu cầu hủy
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('Đồng ý yêu cầu hủy đơn của khách');
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(totalPaid > 0 ? totalPaid : 0);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>(PaymentMethod.QrTransfer);

  const { mutateAsync: cancelOrder, isPending: isCancelling } = useCancelOrderByOwnerMutation();
  const { mutateAsync: rejectCancellation, isPending: isRejecting } =
    useRejectOrderCancellationMutation();

  const isSubmitting = isCancelling || isRejecting;

  const handleSubmit = async () => {
    if (decision === 'approve') {
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

        toast.success(`Đã đồng ý hủy đơn #${orderCode || ''} thành công!`);
        onOpenChange(false);
        onSuccess?.();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Không thể hủy đơn đặt sân'));
      }
    } else {
      try {
        await rejectCancellation({
          orderId,
          rejectionReason: rejectReason.trim() || undefined,
        });

        toast.success(
          `Đã từ chối duyệt hủy đơn #${orderCode || ''}. Trạng thái đơn đã chuyển sang Đã nhận!`
        );
        onOpenChange(false);
        onSuccess?.();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Không thể từ chối yêu cầu hủy đơn'));
      }
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Xử lý yêu cầu hủy đơn #${orderCode || ''}`}
      description="Xem xét yêu cầu hủy của khách hàng: Đồng ý hủy hoặc Từ chối để giữ nguyên đơn đặt."
      icon={
        decision === 'approve' ? (
          <AlertTriangle className="size-5 text-rose-500" />
        ) : (
          <ShieldCheck className="size-5 text-[#a3e635]" />
        )
      }
      maxWidth="max-w-md"
      hideFooter={true}
    >
      <div className="space-y-4 py-1">
        {/* LỰA CHỌN QUYẾT ĐỊNH: ĐỒNG Ý HỦY HOẶC TỪ CHỐI */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Lựa chọn duyệt đơn <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDecision('approve')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                decision === 'approve'
                  ? 'border-rose-500/80 bg-rose-500/10 text-rose-400 shadow-sm'
                  : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                <CheckCircle2 className="size-4 text-rose-500 shrink-0" />
                <span>Đồng ý hủy</span>
              </div>
              <p className="text-[11px] mt-1 text-muted-foreground line-clamp-1">
                Giải phóng slot & hoàn tiền
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDecision('reject')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                decision === 'reject'
                  ? 'border-lime-500/80 bg-lime-500/10 text-lime-400 shadow-sm'
                  : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                <XCircle className="size-4 text-[#a3e635] shrink-0" />
                <span>Từ chối hủy</span>
              </div>
              <p className="text-[11px] mt-1 text-muted-foreground line-clamp-1">
                Giữ đơn & chuyển sang Đã nhận
              </p>
            </button>
          </div>
        </div>

        {/* THÔNG TIN KHÁCH XIN HỦY (NẾU CÓ) */}
        {customerNote && (
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
            <span className="font-semibold text-muted-foreground">Ghi chú từ khách:</span>
            <p className="text-foreground italic">{customerNote}</p>
          </div>
        )}

        {/* ================================================================= */}
        {/* TRƯỜNG HỢP 1: ĐỒNG Ý HỦY */}
        {/* ================================================================= */}
        {decision === 'approve' && (
          <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Khi đồng ý hủy, hệ thống sẽ chuyển trạng thái đơn sang <strong>Đã hủy</strong> và{' '}
                <strong>giải phóng các slot sân</strong> để khách hàng khác có thể đặt.
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cancel-reason" className="text-xs font-semibold text-foreground">
                Lý do duyệt hủy <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="cancel-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do đồng ý hủy..."
                className="w-full rounded-xl bg-card border border-border/60 p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="refund-amount"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <CircleDollarSign className="size-3.5 text-amber-500" />
                Số tiền hoàn lại cho khách (VNĐ)
              </label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                step={10000}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value) || 0)}
                className="bg-card border-border/60 text-foreground focus-visible:ring-rose-400"
              />
              <p className="text-[11px] text-muted-foreground">
                Tổng tiền khách đã trả: {totalPaid.toLocaleString('vi-VN')} đ.
              </p>
            </div>

            {refundAmount > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Hình thức hoàn tiền <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod(PaymentMethod.QrTransfer)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      refundMethod === PaymentMethod.QrTransfer
                        ? 'border-lime-500/80 bg-lime-500/10 text-lime-400 shadow-sm'
                        : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Chuyển khoản QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod(PaymentMethod.Cash)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      refundMethod === PaymentMethod.Cash
                        ? 'border-lime-500/80 bg-lime-500/10 text-lime-400 shadow-sm'
                        : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tiền mặt
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TRƯỜNG HỢP 2: TỪ CHỐI HỦY */}
        {/* ================================================================= */}
        {decision === 'reject' && (
          <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/20 text-xs text-lime-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-[#a3e635] mt-0.5" />
              <span>
                Khi từ chối yêu cầu hủy, trạng thái đơn hàng sẽ chuyển sang{' '}
                <strong className="text-white">Đã nhận (Đã xác nhận)</strong> theo quy trình sân.
                Lịch sân vẫn được giữ nguyên và không giải phóng slot.
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
                Lý do từ chối (tùy chọn)
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (ví dụ: đã quá thời gian hủy theo quy định, sân đã chuẩn bị hoàn tất...)"
                className="w-full rounded-xl bg-card border border-border/60 p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>
          </div>
        )}

        {/* CỤM NÚT HÀNH ĐỘNG FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10.5 rounded-xl border border-border/60 bg-muted/40 px-5 text-sm font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
          >
            Đóng
          </button>

          {decision === 'approve' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Đang hủy...' : 'Đồng ý hủy & Giải phóng slot'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10.5 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] px-5 text-sm font-bold text-black shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRejecting ? 'Đang xử lý...' : 'Xác nhận từ chối (Chuyển sang Đã nhận)'}
            </button>
          )}
        </div>
      </div>
    </OwnerModal>
  );
}
