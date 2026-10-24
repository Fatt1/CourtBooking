import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Clock,
  Copy,
  Check,
  QrCode,
  AlertTriangle,
  ArrowRight,
  XCircle,
  Loader2,
  Upload,
  CheckCircle2,
  Trash2,
  Building2,
  CreditCard,
  User,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl, useUploadImageMutation } from '@/api/storage';
import { formatEventPrice } from '../utils/dateUtils';
import { formatDateTime, toUtcDate } from '@/lib/format';
import {
  useCancelEventTicketMutation,
  useSubmitEventTicketProofMutation,
} from '../api/publicEventsApi';

export interface EventPaymentData {
  ticketId: string;
  eventId: string;
  eventTitle?: string;
  branchName?: string;
  totalAmount: number;
  createdAt?: string;
  expiresAt?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  qrImage?: { storageKey?: string; key?: string; id?: string } | null;
}

interface EventPaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: EventPaymentData | null;
  onConfirmSuccess: () => void;
}

interface VietQrDisplayProps {
  src: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  amount: number;
  transferNote: string;
}

function VietQrDisplay({ src, bankName }: VietQrDisplayProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-5 shadow-lg text-slate-900 w-full max-w-[320px] mx-auto">
        <div className="flex items-center justify-between w-full border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-blue-800 text-sm tracking-wider">VIET</span>
            <span className="font-heading font-black text-red-600 text-sm tracking-wider">QR</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{bankName || 'Napas 247'}</span>
        </div>

        <div className="relative p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
          <svg viewBox="0 0 160 160" className="size-44">
            <rect x="10" y="10" width="40" height="40" rx="6" fill="#000" />
            <rect x="16" y="16" width="28" height="28" rx="3" fill="#fff" />
            <rect x="22" y="22" width="16" height="16" rx="2" fill="#000" />

            <rect x="110" y="10" width="40" height="40" rx="6" fill="#000" />
            <rect x="116" y="16" width="28" height="28" rx="3" fill="#fff" />
            <rect x="122" y="22" width="16" height="16" rx="2" fill="#000" />

            <rect x="10" y="110" width="40" height="40" rx="6" fill="#000" />
            <rect x="16" y="116" width="28" height="28" rx="3" fill="#fff" />
            <rect x="22" y="122" width="16" height="16" rx="2" fill="#000" />

            <rect x="60" y="14" width="8" height="8" rx="1" fill="#000" />
            <rect x="74" y="14" width="8" height="8" rx="1" fill="#000" />
            <rect x="88" y="14" width="8" height="8" rx="1" fill="#000" />
            <rect x="60" y="28" width="8" height="8" rx="1" fill="#000" />
            <rect x="88" y="28" width="8" height="8" rx="1" fill="#000" />
            <rect x="60" y="42" width="8" height="8" rx="1" fill="#000" />
            <rect x="74" y="42" width="8" height="8" rx="1" fill="#000" />

            <rect x="14" y="60" width="8" height="8" rx="1" fill="#000" />
            <rect x="28" y="60" width="8" height="8" rx="1" fill="#000" />
            <rect x="42" y="60" width="8" height="8" rx="1" fill="#000" />
            <rect x="110" y="60" width="8" height="8" rx="1" fill="#000" />
            <rect x="124" y="60" width="8" height="8" rx="1" fill="#000" />
            <rect x="138" y="60" width="8" height="8" rx="1" fill="#000" />

            <rect x="58" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="76" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="58" y="76" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="76" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="58" y="94" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="76" y="94" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="94" width="10" height="10" rx="1.5" fill="#000" />

            <rect x="112" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="126" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="112" y="126" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="126" width="8" height="8" rx="1" fill="#000" />
            <rect x="112" y="140" width="8" height="8" rx="1" fill="#000" />
            <rect x="126" y="140" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="140" width="8" height="8" rx="1" fill="#000" />

            <circle cx="80" cy="80" r="14" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="80" cy="80" r="10" fill="#397B48" />
            <path d="M76 80 L79 83 L85 77" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-2 text-center text-xs font-semibold text-slate-800">
          Quét mã VietQR bằng ứng dụng Ngân hàng
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-lg w-full max-w-[320px] mx-auto">
      <img
        src={src}
        alt="Mã QR thanh toán vé"
        onError={() => setHasError(true)}
        className="h-56 w-56 object-contain"
      />
      <p className="mt-2 text-center text-xs font-semibold text-slate-800">
        Quét mã VietQR bằng ứng dụng Ngân hàng
      </p>
    </div>
  );
}

export function EventPaymentQrModal({
  isOpen,
  onClose,
  ticketData,
  onConfirmSuccess,
}: EventPaymentQrModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [showConfirmCancel, setShowConfirmCancel] = useState<boolean>(false);

  // Upload proof image states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofImageId, setProofImageId] = useState<string | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);

  const uploadMutation = useUploadImageMutation();
  const submitProofMutation = useSubmitEventTicketProofMutation(ticketData?.eventId);
  const cancelMutation = useCancelEventTicketMutation(ticketData?.eventId || '');

  // Reset proof image state when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setProofImageId(null);
      setProofImagePreview(null);
    }
  }, [isOpen, ticketData?.ticketId]);

  // Đồng hồ đếm ngược tính chính xác theo thời điểm hết hạn của vé
  useEffect(() => {
    if (!isOpen || !ticketData) return;

    const calculateRemaining = () => {
      if (ticketData.expiresAt) {
        const expiresDate = toUtcDate(ticketData.expiresAt);
        if (expiresDate) {
          const diffInSeconds = Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000));
          return diffInSeconds;
        }
      }
      if (ticketData.createdAt) {
        const createdDate = toUtcDate(ticketData.createdAt);
        if (createdDate) {
          const expiresDate = new Date(createdDate.getTime() + 15 * 60 * 1000);
          const diffInSeconds = Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000));
          return diffInSeconds;
        }
      }
      return 0;
    };

    // Cập nhật ngay khi mở modal
    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, ticketData?.ticketId, ticketData?.expiresAt]);

  if (!ticketData) return null;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const isExpired = timeLeft <= 0;

  const transferNote = `VE ${ticketData.ticketId.slice(0, 8).toUpperCase()}`;

  // Sinh QR Code VietQR hoặc dùng ảnh chi nhánh đã cấu hình
  const bankCode = ticketData.bankCode || '970422'; // 970422 là mã MBBank mặc định
  const accountNumber = ticketData.accountNumber || '1903678912345';
  const accountName = ticketData.accountName || 'CHỦ SÂN';
  const bankName = ticketData.bankName || 'Ngân hàng Quân Đội (MBBank)';

  const qrImageUrl = ticketData.qrImage?.key || ticketData.qrImage?.storageKey
    ? getImageUrl(ticketData.qrImage.key || ticketData.qrImage.storageKey)
    : `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?amount=${ticketData.totalAmount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(accountName)}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Xử lý chọn ảnh bằng chứng
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn kích thước ảnh 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    try {
      // Tạo preview tạm thời
      const previewUrl = URL.createObjectURL(file);
      setProofImagePreview(previewUrl);

      // Upload lên máy chủ
      const res = await uploadMutation.mutateAsync(file);
      const uploadedId = res.id || (res as any).imageId || (res as any).image?.id;
      setProofImageId(uploadedId);
      toast.success('Tải ảnh biên lai lên thành công!');
    } catch (err: any) {
      toast.error('Tải ảnh thất bại. Vui lòng thử lại!');
      setProofImagePreview(null);
      setProofImageId(null);
    }
  };

  const handleRemoveImage = () => {
    setProofImageId(null);
    setProofImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xác nhận gửi bằng chứng thanh toán
  const handleConfirmProof = async () => {
    if (!proofImageId) {
      toast.error('Vui lòng tải lên ảnh chụp màn hình chuyển khoản / biên lai trước khi xác nhận.');
      return;
    }

    try {
      await submitProofMutation.mutateAsync({
        eventId: ticketData.eventId,
        ticketId: ticketData.ticketId,
        proofImageId,
      });

      toast.success('Gửi bằng chứng thanh toán thành công! Vé đang chờ chủ sân duyệt.');
      onConfirmSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi bằng chứng thanh toán.';
      toast.error(msg);
    }
  };

  const handleRequestClose = () => {
    setShowConfirmCancel(true);
  };

  const handleExecuteCancel = async () => {
    try {
      await cancelMutation.mutateAsync(ticketData.ticketId);
      toast.info('Đã hủy đơn đặt vé thành công. Vé giữ chỗ đã được giải phóng.');
      setShowConfirmCancel(false);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Không thể hủy đơn vé. Vui lòng thử lại!';
      toast.error(msg);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleRequestClose();
          }
        }}
      >
        <DialogContent className="max-w-lg border border-border bg-card text-card-foreground p-5 sm:p-6 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-[#397B48] dark:text-[#a3e635] uppercase flex items-center gap-1.5">
                <QrCode className="size-4" />
                THANH TOÁN VÉ SỰ KIỆN
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  isExpired
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                    : timeLeft < 300
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 animate-pulse'
                    : 'bg-muted text-foreground border border-border'
                }`}
              >
                <Clock className="size-3.5" />
                <span>{isExpired ? 'Hết giờ' : `${minutes}:${seconds}`}</span>
              </div>
            </div>
            <DialogTitle className="mt-2 text-xl font-black text-foreground">
              Quét mã QR chuyển khoản
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Chuyển khoản trực tiếp cho chủ sân theo thông tin dưới đây và đính kèm biên lai chuyển khoản.
            </DialogDescription>
          </DialogHeader>

          {/* QR Code Container */}
          <div className="mt-4 flex justify-center">
            <VietQrDisplay
              src={qrImageUrl}
              accountNumber={accountNumber}
              accountName={accountName}
              bankName={bankName}
              amount={ticketData.totalAmount}
              transferNote={transferNote}
            />
          </div>

          {/* Thông tin tài khoản chủ sân */}
          <div className="mt-4 space-y-2.5 rounded-xl border border-border/70 bg-muted/30 p-4 text-xs">
            {/* Tên ngân hàng */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-[#397B48] dark:text-[#a3e635]" />
                Ngân hàng:
              </span>
              <span className="font-bold text-foreground">
                {bankName}
              </span>
            </div>

            {/* Chủ tài khoản */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-[#397B48] dark:text-[#a3e635]" />
                Chủ tài khoản:
              </span>
              <span className="font-bold text-foreground uppercase">
                {accountName}
              </span>
            </div>

            {/* Số tài khoản */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-[#397B48] dark:text-[#a3e635]" />
                Số tài khoản:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground text-sm">
                  {accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(accountNumber, 'Số tài khoản')}
                  className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Sao chép"
                >
                  {copiedField === 'Số tài khoản' ? (
                    <Check className="size-3 text-[#397B48] dark:text-[#a3e635]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Số tiền */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-muted-foreground">Số tiền:</span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-[#397B48] dark:text-[#a3e635] text-base">
                  {formatEventPrice(ticketData.totalAmount)}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ticketData.totalAmount.toString(), 'Số tiền')}
                  className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Sao chép"
                >
                  {copiedField === 'Số tiền' ? (
                    <Check className="size-3 text-[#397B48] dark:text-[#a3e635]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Hạn chót thanh toán */}
            {ticketData.expiresAt && (
              <div className="flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-500" />
                  Hết hạn thanh toán lúc:
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatDateTime(ticketData.expiresAt)}
                </span>
              </div>
            )}

            {/* Nội dung chuyển khoản */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground bg-background border border-border px-2 py-0.5 rounded">
                  {transferNote}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(transferNote, 'Nội dung chuyển khoản')}
                  className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Sao chép"
                >
                  {copiedField === 'Nội dung chuyển khoản' ? (
                    <Check className="size-3 text-[#397B48] dark:text-[#a3e635]" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Khối tải ảnh bằng chứng chuyển khoản (Bắt buộc) */}
          <div className="mt-4 p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-xs text-foreground block">
                  Ảnh biên lai / Màn hình chuyển khoản
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Định dạng JPG, PNG hoặc WebP · Tối đa 5MB
                </span>
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
                    disabled={uploadMutation.isPending || isExpired}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#397B48] text-white hover:bg-[#2d6339] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5" />
                        <span>Tải ảnh lên</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    Đổi ảnh
                  </button>
                )}
              </div>
            </div>

            {/* Preview ảnh bằng chứng nếu đã upload */}
            {proofImagePreview && (
              <div className="relative inline-block mt-1 rounded-xl overflow-hidden border border-border shadow-sm">
                <img
                  src={proofImagePreview}
                  alt="Biên lai thanh toán"
                  className="max-h-40 max-w-full rounded-xl object-contain bg-background"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Xóa ảnh"
                >
                  <Trash2 className="size-3.5" />
                </button>
                {proofImageId && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#183424]/90 text-[#a3e635] text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                    <CheckCircle2 className="size-3" />
                    <span>Đã tải lên</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={
                !proofImageId ||
                isExpired ||
                submitProofMutation.isPending ||
                uploadMutation.isPending
              }
              onClick={handleConfirmProof}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#397B48] hover:bg-[#2d6239] text-white dark:bg-[#a3e635] dark:hover:bg-[#bef264] dark:text-slate-950 py-3 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitProofMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang gửi bằng chứng...</span>
                </>
              ) : (
                <>
                  <span>Tôi đã chuyển khoản & Gửi bằng chứng</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/30 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <XCircle className="size-4" />
              <span>Hủy đơn vé này</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog When Canceling Ticket */}
      <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <DialogContent className="max-w-md border border-border bg-card text-card-foreground p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 font-bold text-destructive text-sm">
              <AlertTriangle className="size-5 shrink-0" />
              <span>XÁC NHẬN HỦY VÉ</span>
            </div>
            <DialogTitle className="mt-2 text-lg font-bold text-foreground">
              Bạn có chắc chắn muốn hủy đơn vé này không?
            </DialogTitle>
            <DialogDescription className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Nếu bạn xác nhận hủy, vị trí giữ vé của bạn sẽ bị hủy ngay lập tức và số lượng slot sẽ được hoàn lại cho sự kiện để người chơi khác có thể đăng ký.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfirmCancel(false)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Tiếp tục thanh toán
            </button>
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={handleExecuteCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang hủy vé...</span>
                </>
              ) : (
                <span>Xác nhận hủy vé</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
