import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Clock,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Trash2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  useSubmitPaymentProofMutation,
  useCancelOrderOnlineMutation,
  type CreateOrderOnlineResponse,
} from '@/api/orders';
import { useUploadImageMutation, getImageUrl } from '@/api/storage';
import { formatCurrency } from '@/lib/utils';
import { toUtcDate } from '@/lib/format';
import { getApiErrorMessage } from '@/types/api';

interface BranchPaymentModalProps {
  isOpen: boolean;
  orderData: CreateOrderOnlineResponse | null;
  branchId: string;
  bankName?: string;
  onSuccess: () => void;
}

export function BranchPaymentModal({
  isOpen,
  orderData,
  branchId,
  bankName = 'Vietcombank',
  onSuccess,
}: BranchPaymentModalProps) {
  const navigate = useNavigate();

  // Mutations
  const uploadImageMutation = useUploadImageMutation();
  const submitProofMutation = useSubmitPaymentProofMutation();
  const cancelOrderMutation = useCancelOrderOnlineMutation();

  // State upload ảnh minh chứng
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofImageId, setProofImageId] = useState<string | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);

  // State popup xác nhận hủy đơn khi bấm thoát
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Countdown timer tính từ holdExpiresAt
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderData?.holdExpiresAt) {
      setRemainingSeconds(0);
      setIsExpired(false);
      return;
    }

    const calculateRemaining = () => {
      const expiresDate = toUtcDate(orderData.holdExpiresAt);
      const expiresAtMs = expiresDate ? expiresDate.getTime() : 0;
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        setIsExpired(true);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [isOpen, orderData?.holdExpiresAt]);

  // Reset state khi mở lại
  useEffect(() => {
    if (isOpen) {
      setProofImageId(null);
      setProofImagePreview(null);
      setShowCancelConfirm(false);
      setIsExpired(false);
    }
  }, [isOpen]);

  // Format MM:SS
  const formattedCountdown = React.useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  // Sao chép vào clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  // Chọn và upload ảnh biên lai
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    try {
      // Hiển thị preview tức thì bằng blob
      const localUrl = URL.createObjectURL(file);
      setProofImagePreview(localUrl);

      const res = await uploadImageMutation.mutateAsync(file);
      if (res?.id) {
        setProofImageId(res.id);
        toast.success('Tải ảnh biên lai thành công!');
      } else {
        toast.error('Không lấy được mã định danh ảnh sau khi tải lên!');
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tải ảnh biên lai!'));
      setProofImagePreview(null);
      setProofImageId(null);
    }
  };

  // Xóa ảnh biên lai
  const handleRemoveImage = () => {
    setProofImageId(null);
    setProofImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Nộp chứng nhận thanh toán
  const handleSubmitProof = async () => {
    if (!orderData?.orderId) return;

    if (!proofImageId) {
      toast.error('Vui lòng chọn ảnh chụp màn hình chuyển khoản!');
      return;
    }

    if (isExpired) {
      toast.error('Thời gian thanh toán đã hết hạn! Vui lòng đặt lại.');
      return;
    }

    try {
      await submitProofMutation.mutateAsync({
        orderId: orderData.orderId,
        imageId: proofImageId,
      });

      toast.success('Đã gửi thông tin thanh toán! Đơn đặt sân đang chờ chủ sân xác nhận.');
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi nộp xác nhận thanh toán!'));
    }
  };

  // Người dùng muốn đóng popup thanh toán -> hiện modal xác nhận hủy
  const handleRequestClose = () => {
    setShowCancelConfirm(true);
  };

  // Xác nhận hủy đơn hàng và trả về trang đơn hàng của tôi
  const handleConfirmCancel = async () => {
    if (!orderData?.orderId) {
      setShowCancelConfirm(false);
      navigate('/account?tab=orders');
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync({
        orderId: orderData.orderId,
        reason: 'Khách hàng hủy thanh toán trực tuyến',
      });
      toast.info('Đã hủy đơn đặt sân thành công.');
    } catch (err: unknown) {
      console.warn('Lỗi khi hủy đơn đặt:', err);
    } finally {
      setShowCancelConfirm(false);
      navigate('/account?tab=orders');
    }
  };

  if (!isOpen || !orderData) return null;

  // Xác định QR Image URL
  const qrUrl = orderData.qrCodeImageKey
    ? orderData.qrCodeImageKey.startsWith('http')
      ? orderData.qrCodeImageKey
      : getImageUrl(orderData.qrCodeImageKey)
    : `https://img.vietqr.io/image/${bankName}-${orderData.accountNumber || ''}-compact2.png?amount=${orderData.totalAmount}&addInfo=${encodeURIComponent(orderData.orderCode)}&accountName=${encodeURIComponent(orderData.accountName || '')}`;

  return (
    <>
      {/* Modal Thanh toán chính */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-3xl my-6 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header với Step 03 & Countdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border/60 bg-secondary/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center size-7 rounded-full bg-[#7CFF01] text-black font-heading font-black text-xs">
                03
              </span>
              <div>
                <h3 className="font-heading font-black text-lg text-foreground tracking-tight">
                  Thanh toán cho chủ sân
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quét mã QR bên dưới và chuyển đúng số tiền cùng nội dung đã ghi.
                </p>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                  isExpired
                    ? 'bg-destructive/20 border-destructive/40 text-destructive'
                    : remainingSeconds < 180
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 animate-pulse'
                    : 'bg-[#183424]/40 border-[#7CFF01]/40 text-[#7CFF01]'
                }`}
              >
                <Clock className="size-3.5" />
                <span>
                  {isExpired ? 'Hết giờ giữ chỗ' : `Thời gian giữ chỗ: ${formattedCountdown}`}
                </span>
              </div>

              {/* Nút đóng (kích hoạt hỏi hủy) */}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Đóng và hủy đơn"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Body nội dung thanh toán */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            {isExpired && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center gap-3 text-destructive">
                <AlertTriangle className="size-5 shrink-0" />
                <div className="text-xs font-semibold">
                  Thời hạn thanh toán cho đơn hàng đã hết. Vui lòng bấm hủy hoặc đặt lại khung giờ mới.
                </div>
              </div>
            )}

            {/* Khối QR và Thông tin chuyển khoản */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* QR Code Container (5 Cột) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-black shadow-inner border border-border/40 text-center space-y-3">
                <div className="relative size-52 sm:size-56 p-2 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <img
                    src={qrUrl}
                    alt="Mã QR Chuyển khoản"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="font-heading font-black text-xs uppercase tracking-wider text-neutral-800">
                  Quét để chuyển khoản
                </div>
                <div className="text-[11px] text-neutral-500">
                  Hỗ trợ toàn bộ app ngân hàng & ví điện tử
                </div>
              </div>

              {/* Chi tiết tài khoản (7 Cột) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-heading font-bold text-base text-[#7CFF01]">
                    Thanh toán trực tiếp
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tiền được chuyển thẳng đến tài khoản của chủ sân.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Ngân hàng */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-muted-foreground font-medium">Ngân hàng</span>
                    <span className="font-bold text-foreground">{bankName}</span>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-muted-foreground font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-foreground uppercase">
                      {orderData.accountName || 'CHỦ SÂN'}
                    </span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-muted-foreground font-medium">Số tài khoản</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {orderData.accountNumber || '1026688999'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(orderData.accountNumber || '1026688999', 'Số tài khoản')
                        }
                        className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] font-bold text-foreground flex items-center gap-1 border border-border/50 transition-colors"
                      >
                        <Copy className="size-2.5" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>

                  {/* Số tiền */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-muted-foreground font-medium">Số tiền</span>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-[#7CFF01]">
                        {formatCurrency(orderData.totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(String(orderData.totalAmount), 'Số tiền')
                        }
                        className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] font-bold text-foreground flex items-center gap-1 border border-border/50 transition-colors"
                      >
                        <Copy className="size-2.5" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/40">
                    <span className="text-muted-foreground font-medium">Nội dung CK</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-foreground">
                        {orderData.orderCode}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(orderData.orderCode, 'Nội dung chuyển khoản')
                        }
                        className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] font-bold text-foreground flex items-center gap-1 border border-border/50 transition-colors"
                      >
                        <Copy className="size-2.5" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thông báo Matchday */}
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
                  <span className="font-bold text-foreground shrink-0">ⓘ MATCHDAY</span>
                  <span>
                    không thu hoặc giữ tiền. Khoản thanh toán được chuyển trực tiếp đến chủ sân.
                  </span>
                </div>
              </div>
            </div>

            {/* Khối tải ảnh chụp màn hình thanh toán (BẮT BUỘC) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground">
                    Ảnh chụp màn hình thanh toán
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Bắt buộc · JPG, PNG hoặc WebP · Tối đa 5 MB
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!proofImagePreview ? (
                    <button
                      type="button"
                      disabled={uploadImageMutation.isPending || isExpired}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-[#7CFF01] hover:bg-[#6ee400] text-black font-heading font-bold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-sm shadow-[#7CFF01]/20 disabled:opacity-50"
                    >
                      {uploadImageMutation.isPending ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Đang tải ảnh...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          <span>Chọn ảnh biên lai</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors"
                    >
                      Đổi ảnh khác
                    </button>
                  )}
                </div>
              </div>

              {/* Preview ảnh minh chứng nếu đã chọn */}
              {proofImagePreview && (
                <div className="relative inline-block mt-2 rounded-xl overflow-hidden border border-border/80 shadow-md">
                  <img
                    src={proofImagePreview}
                    alt="Biên lai thanh toán"
                    className="max-h-48 max-w-full rounded-xl object-contain bg-background"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-destructive text-white transition-colors"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  {proofImageId && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#183424]/90 text-[#7CFF01] text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                      <CheckCircle2 className="size-3" />
                      <span>Đã tải lên</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-secondary/30">
            <button
              type="button"
              onClick={handleRequestClose}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Hủy thanh toán
            </button>

            <button
              type="button"
              disabled={
                !proofImageId ||
                isExpired ||
                submitProofMutation.isPending ||
                uploadImageMutation.isPending
              }
              onClick={handleSubmitProof}
              className="px-6 py-3 rounded-xl bg-[#7CFF01] hover:bg-[#6ee400] text-black font-heading font-black text-xs transition-all active:scale-95 shadow-lg shadow-[#7CFF01]/25 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
            >
              {submitProofMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang gửi xác nhận...</span>
                </>
              ) : (
                <span>Xác nhận đã chuyển khoản</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Popup hỏi bạn có chắc muốn hủy thanh toán không */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-xl bg-destructive/15">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <h4 className="font-heading font-black text-base text-foreground">
                  Bạn có chắc muốn hủy thanh toán?
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đơn giữ chỗ sẽ bị hủy và các khung giờ đã chọn sẽ được mở lại cho người khác.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-xs text-muted-foreground">
              Mã đơn: <span className="font-mono font-bold text-foreground">{orderData.orderCode}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors"
              >
                Tiếp tục thanh toán
              </button>
              <button
                type="button"
                disabled={cancelOrderMutation.isPending}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-heading font-black text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
              >
                {cancelOrderMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  <span>Có, hủy đơn hàng</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
