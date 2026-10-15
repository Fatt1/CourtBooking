import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CircleDollarSign, Calendar, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OwnerModal } from '../shared/OwnerModal';
import { useCancelOrderSlotMutation, PaymentMethod, type FixedOrderSlotDto } from '@/api/orders';
import { getApiErrorMessage } from '@/types/api';

interface CancelOrderSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  slot: FixedOrderSlotDto | null;
  totalPaid?: number;
  onSuccess?: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {}
  return dateStr;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '00h00';
  const clean = timeStr.substring(0, 5);
  return clean.replace(':', 'h');
}

export function CancelOrderSlotModal({
  open,
  onOpenChange,
  orderId,
  slot,
  totalPaid = 0,
  onSuccess,
}: CancelOrderSlotModalProps) {
  const [reason, setReason] = useState('Khách báo bận / Hủy buổi chơi này');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>(PaymentMethod.QrTransfer);

  const { mutateAsync: cancelSlot, isPending } = useCancelOrderSlotMutation();

  useEffect(() => {
    if (slot) {
      // Mặc định hoàn lại giá tiền của ca sân này nếu tổng tiền đã trả đủ
      const initialRefund = Math.min(slot.price || 0, Math.max(0, totalPaid));
      setRefundAmount(initialRefund);
      setReason('Khách báo bận / Hủy buổi chơi này');
    }
  }, [slot, totalPaid]);

  if (!slot) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy ca sân');
      return;
    }

    try {
      await cancelSlot({
        orderId,
        orderDetailId: slot.orderDetailId,
        cancelReason: reason.trim(),
        refundAmount: refundAmount > 0 ? refundAmount : null,
        refundMethod: refundAmount > 0 ? refundMethod : null,
      });

      toast.success(
        `Đã hủy buổi chơi ngày ${formatDate(slot.date)} (${slot.courtName}) thành công!`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể hủy ca sân này'));
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Xác nhận hủy buổi chơi"
      description="Hành động này sẽ giải phóng ca sân trên lịch và hoàn tiền cho khách (nếu có)."
      icon={<AlertTriangle className="size-5 text-rose-400" />}
      maxWidth="max-w-md"
      onSubmit={handleConfirm}
      submitText={isPending ? 'Đang xử lý...' : 'Xác nhận hủy & Hoàn tiền'}
      cancelText="Đóng"
      isSubmitting={isPending}
    >
      <div className="space-y-4 py-2 text-slate-200">
        {/* Thông tin tóm tắt ca sân bị hủy */}
        <div className="rounded-xl bg-[#131d31] border border-border/60 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Calendar className="size-3.5 text-[#a3e635]" />
              Ngày chơi: {formatDate(slot.date)}
            </span>
            <span className="font-mono font-bold text-[#a3e635] text-sm">
              {(slot.price || 0).toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-slate-400" />
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-200 font-medium">
              <MapPin className="size-3 text-slate-400" />
              {slot.courtName}
              {slot.courtTypeName && ` (${slot.courtTypeName})`}
            </span>
          </div>
        </div>

        {/* Lý do hủy */}
        <div className="space-y-1.5">
          <label htmlFor="slot-cancel-reason" className="text-xs font-semibold text-slate-200">
            Lý do hủy buổi chơi <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="slot-cancel-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do khách báo nghỉ, trời mưa, đổi lịch..."
            className="w-full rounded-xl bg-[#131d31] border border-border/60 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
            required
          />
        </div>

        {/* Số tiền hoàn lại */}
        <div className="space-y-1.5">
          <label
            htmlFor="slot-refund-amount"
            className="text-xs font-semibold text-slate-200 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <CircleDollarSign className="size-3.5 text-amber-300" />
              Số tiền hoàn lại cho khách (VNĐ)
            </span>
            {totalPaid > 0 && (
              <span className="text-[11px] text-slate-400 font-normal">
                Đã trả: {totalPaid.toLocaleString('vi-VN')}đ
              </span>
            )}
          </label>
          <Input
            id="slot-refund-amount"
            type="number"
            min={0}
            step={10000}
            value={refundAmount}
            onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value) || 0))}
            className="bg-[#131d31] border-border/60 text-white focus-visible:ring-rose-400 h-9 text-xs font-mono"
          />
          <p className="text-[11px] text-slate-400">
            Điền 0 nếu không hoàn tiền (hoặc khách đã chơi/không được hoàn theo chính sách).
          </p>
        </div>

        {/* Phương thức hoàn tiền */}
        {refundAmount > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-200">
              Hình thức hoàn tiền <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefundMethod(PaymentMethod.QrTransfer)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
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
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
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
