import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  CreditCard,
  CircleDollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Upload,
  X,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OwnerModal } from '../shared/OwnerModal';
import {
  useAddPaymentTransactionMutation,
  PaymentMethod,
  PaymentTransactionType,
} from '@/api/orders';
import { uploadImageApi, getImageUrl } from '@/api/storage';
import { getApiErrorMessage } from '@/types/api';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderCode?: string;
  totalAmount?: number;
  totalPaid?: number;
  onSuccess?: () => void;
}

export function AddTransactionModal({
  open,
  onOpenChange,
  orderId,
  orderCode,
  totalAmount = 0,
  totalPaid = 0,
  onSuccess,
}: AddTransactionModalProps) {
  const safeTotal = totalAmount ?? 0;
  const safePaid = totalPaid ?? 0;
  const diff = safeTotal - safePaid;
  // diff > 0: khách còn nợ (cần thu thêm)
  // diff < 0: khách trả dư (cần hoàn lại)

  const [type, setType] = useState<PaymentTransactionType>(
    diff < 0 ? PaymentTransactionType.Refund : PaymentTransactionType.Payment
  );
  const [amount, setAmount] = useState<number>(Math.abs(diff) || 0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.QrTransfer);

  // Ảnh chứng từ chuyển khoản
  const [proofImageId, setProofImageId] = useState<string | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: addTransaction, isPending } = useAddPaymentTransactionMutation();

  // Reset và tự động điền số tiền theo chênh lệch khi modal mở ra
  useEffect(() => {
    if (open) {
      const currentDiff = totalAmount - totalPaid;
      if (currentDiff < 0) {
        setType(PaymentTransactionType.Refund);
        setAmount(Math.abs(currentDiff));
      } else {
        setType(PaymentTransactionType.Payment);
        setAmount(Math.max(0, currentDiff));
      }
      setMethod(PaymentMethod.QrTransfer);
      setProofImageId(null);
      setProofImageUrl(null);
    }
  }, [open, totalAmount, totalPaid]);

  // Xử lý upload ảnh minh chứng
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadImageApi(file);
      setProofImageId(res.id);
      setProofImageUrl(res.url);
      toast.success('Đã tải ảnh biên lai thành công!');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Tải ảnh lên thất bại'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setProofImageId(null);
    setProofImageUrl(null);
  };

  const handleConfirm = async () => {
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền giao dịch hợp lệ lớn hơn 0');
      return;
    }

    try {
      await addTransaction({
        orderId,
        amount,
        method,
        type,
        proofImageId: proofImageId || null,
      });

      const label =
        type === PaymentTransactionType.Refund
          ? `Đã hoàn ${amount.toLocaleString('vi-VN')}đ cho khách!`
          : `Đã thu thêm ${amount.toLocaleString('vi-VN')}đ thành công!`;
      toast.success(label);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể ghi nhận giao dịch'));
    }
  };

  const isRefund = type === PaymentTransactionType.Refund;
  const submitText = isPending
    ? 'Đang xử lý...'
    : isRefund
      ? 'Xác nhận hoàn tiền'
      : 'Xác nhận thu tiền';

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRefund ? 'Hoàn tiền cho khách' : 'Thêm giao dịch thanh toán'}
      description={`Mã đơn hàng: ${orderCode?.startsWith('#') ? orderCode : `#${orderCode || ''}`}`}
      icon={
        isRefund ? (
          <ArrowDownLeft className="size-5 text-rose-400" />
        ) : (
          <CircleDollarSign className="size-5 text-[#a3e635]" />
        )
      }
      maxWidth="max-w-lg"
      onSubmit={handleConfirm}
      submitText={submitText}
      cancelText="Đóng"
      isSubmitting={isPending || isUploading}
    >
      <div className="space-y-4.5 py-1">
        {/* =================================================================== */}
        {/* KHỐI TỔNG QUAN TÀI CHÍNH */}
        {/* =================================================================== */}
        <div className="rounded-xl bg-[#131d31] border border-border/60 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Tổng tiền đơn hàng:</span>
            <span className="font-bold text-white text-sm">
              {safeTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Đã thanh toán thực tế:</span>
            <span className="font-bold text-[#a3e635] text-sm">
              {safePaid.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="font-semibold text-slate-200">
              {diff > 0
                ? 'Số tiền còn thiếu:'
                : diff < 0
                  ? 'Số tiền cần hoàn trả cho khách:'
                  : 'Trạng thái thanh toán:'}
            </span>
            <span
              className={`font-black text-sm sm:text-base ${diff > 0
                  ? 'text-amber-400'
                  : diff < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
            >
              {diff > 0
                ? `+${diff.toLocaleString('vi-VN')}đ`
                : diff < 0
                  ? `${Math.abs(diff).toLocaleString('vi-VN')}đ`
                  : 'Đã thanh toán đủ (0đ)'}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CHỌN LOẠI GIAO DỊCH (THANH TOÁN / HOÀN TIỀN) */}
        {/* =================================================================== */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200">
            Loại giao dịch <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setType(PaymentTransactionType.Payment);
                if (diff > 0) setAmount(diff);
              }}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${type === PaymentTransactionType.Payment
                  ? 'border-[#a3e635] bg-[#a3e635]/15 text-[#a3e635] shadow-sm'
                  : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
            >
              <ArrowUpRight className="size-4" />
              <span>Thu tiền / Thanh toán</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType(PaymentTransactionType.Refund);
                if (diff < 0) setAmount(Math.abs(diff));
              }}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${type === PaymentTransactionType.Refund
                  ? 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-sm'
                  : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
            >
              <ArrowDownLeft className="size-4" />
              <span>Hoàn tiền cho khách</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* NHẬP SỐ TIỀN */}
        {/* =================================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="transaction-amount" className="text-xs font-semibold text-slate-200">
              Số tiền giao dịch (VNĐ) <span className="text-rose-400">*</span>
            </label>
            {Math.abs(diff) > 0 && (
              <button
                type="button"
                onClick={() => setAmount(Math.abs(diff))}
                className="text-[11px] font-semibold text-[#a3e635] hover:underline cursor-pointer"
              >
                Điền khớp số tiền {isRefund ? 'cần hoàn' : 'còn thiếu'} ({Math.abs(diff).toLocaleString('vi-VN')}đ)
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              id="transaction-amount"
              type="number"
              min={1000}
              step={10000}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              placeholder="Nhập số tiền..."
              className="bg-[#131d31] border-border/60 text-white font-bold text-base h-11 pr-12 focus-visible:ring-[#a3e635]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              VNĐ
            </span>
          </div>

          {/* Quick select amount buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[50000, 100000, 200000, 500000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount((prev) => (prev || 0) + val)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1a2742] hover:bg-[#223354] border border-border/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                +{val.toLocaleString('vi-VN')}đ
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(0)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Xóa số
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PHƯƠNG THỨC THANH TOÁN */}
        {/* =================================================================== */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200">
            Phương thức giao dịch <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMethod(PaymentMethod.QrTransfer)}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${method === PaymentMethod.QrTransfer
                  ? 'border-[#a3e635] bg-[#a3e635]/15 text-[#a3e635] shadow-sm'
                  : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
            >
              <CreditCard className="size-4" />
              <span>Chuyển khoản QR</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod(PaymentMethod.Cash)}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${method === PaymentMethod.Cash
                  ? 'border-[#a3e635] bg-[#a3e635]/15 text-[#a3e635] shadow-sm'
                  : 'border-border/60 bg-[#131d31] text-slate-400 hover:text-white'
                }`}
            >
              <CircleDollarSign className="size-4" />
              <span>Tiền mặt</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* ĐÍNH KÈM HÌNH ẢNH BIÊN LAI / CHỨNG TỪ (TÙY CHỌN) */}
        {/* =================================================================== */}
        <div className="space-y-2 pt-1 border-t border-border/50">
          <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-[#a3e635]" />
              Chứng từ / Biên lai giao dịch (Tùy chọn)
            </span>
            {proofImageUrl && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="size-3" /> Đã đính kèm ảnh
              </span>
            )}
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {proofImageUrl ? (
            <div className="relative rounded-xl border border-border/60 bg-[#131d31] p-2.5 flex items-center gap-3">
              <img
                src={proofImageUrl}
                alt="Biên lai giao dịch"
                className="size-14 rounded-lg object-cover border border-border/50"
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-white truncate">Ảnh chứng từ giao dịch</p>
                <p className="text-slate-400 text-[11px]">Đã tải lên hệ thống</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="size-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Xóa ảnh"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl border border-dashed border-border/70 hover:border-[#a3e635]/60 bg-[#131d31]/50 hover:bg-[#131d31] flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="size-4 text-[#a3e635]" />
              <span>{isUploading ? 'Đang tải ảnh lên...' : 'Tải lên ảnh biên lai / sao kê chuyển khoản'}</span>
            </button>
          )}
        </div>
      </div>
    </OwnerModal>
  );
}
