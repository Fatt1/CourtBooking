import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Copy, Check, QrCode, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/api/storage';
import type { BookEventTicketResponse } from '../types';
import { formatEventPrice } from '../utils/dateUtils';

interface EventPaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: BookEventTicketResponse | null;
  onConfirmSuccess: () => void;
}

interface VietQrDisplayProps {
  src: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferNote: string;
}

function VietQrDisplay({ src }: VietQrDisplayProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-xl text-slate-900 w-full max-w-[320px] mx-auto">
        {/* VietQR Header */}
        <div className="flex items-center justify-between w-full border-b pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-blue-800 text-sm tracking-wider">VIET</span>
            <span className="font-heading font-black text-red-600 text-sm tracking-wider">QR</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Napas 247</span>
        </div>

        {/* Realistic SVG QR Pattern */}
        <div className="relative p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
          <svg viewBox="0 0 160 160" className="size-44">
            {/* Top-Left Finder */}
            <rect x="10" y="10" width="40" height="40" rx="6" fill="#000" />
            <rect x="16" y="16" width="28" height="28" rx="3" fill="#fff" />
            <rect x="22" y="22" width="16" height="16" rx="2" fill="#000" />

            {/* Top-Right Finder */}
            <rect x="110" y="10" width="40" height="40" rx="6" fill="#000" />
            <rect x="116" y="16" width="28" height="28" rx="3" fill="#fff" />
            <rect x="122" y="22" width="16" height="16" rx="2" fill="#000" />

            {/* Bottom-Left Finder */}
            <rect x="10" y="110" width="40" height="40" rx="6" fill="#000" />
            <rect x="16" y="116" width="28" height="28" rx="3" fill="#fff" />
            <rect x="22" y="122" width="16" height="16" rx="2" fill="#000" />

            {/* Data matrix dots */}
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

            {/* Center Grid Dots */}
            <rect x="58" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="76" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="58" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="58" y="76" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="76" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="58" y="94" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="76" y="94" width="10" height="10" rx="1.5" fill="#000" />
            <rect x="94" y="94" width="10" height="10" rx="1.5" fill="#000" />

            {/* Bottom Right Data Grid */}
            <rect x="112" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="126" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="112" width="8" height="8" rx="1" fill="#000" />
            <rect x="112" y="126" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="126" width="8" height="8" rx="1" fill="#000" />
            <rect x="112" y="140" width="8" height="8" rx="1" fill="#000" />
            <rect x="126" y="140" width="8" height="8" rx="1" fill="#000" />
            <rect x="140" y="140" width="8" height="8" rx="1" fill="#000" />

            {/* Center Logo Pin */}
            <circle cx="80" cy="80" r="14" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="80" cy="80" r="10" fill="#a3e635" />
            <path d="M76 80 L79 83 L85 77" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-2 text-center text-xs font-semibold text-slate-800">
          Quét mã VietQR bằng ứng dụng Ngân hàng của bạn
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-white p-4 shadow-xl w-full max-w-[320px] mx-auto">
      <img
        src={src}
        alt="Mã QR thanh toán vé"
        onError={() => setHasError(true)}
        className="h-56 w-56 object-contain"
      />
      <p className="mt-2 text-center text-xs font-semibold text-slate-800">
        Quét mã VietQR bằng ứng dụng Ngân hàng của bạn
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
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 phút mặc định

  // 1. Tính toán đồng hồ đếm ngược từ ExpiresAt trả về từ Backend
  useEffect(() => {
    if (!isOpen || !ticketData) return;

    const calculateRemaining = () => {
      if (ticketData.expiresAt) {
        const expiresTime = new Date(ticketData.expiresAt).getTime();
        const now = Date.now();
        const diffInSeconds = Math.max(0, Math.floor((expiresTime - now) / 1000));
        return diffInSeconds;
      }
      return 15 * 60;
    };

    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, ticketData]);

  if (!ticketData) return null;

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const isExpired = timeLeft <= 0;

  const transferNote = `VE ${ticketData.ticketId.slice(0, 8).toUpperCase()}`;

  // Sinh QR Code VietQR chuẩn hoặc dùng ảnh QR chi nhánh đã cấu hình
  const qrImageUrl = ticketData.qrImage?.key || ticketData.qrImage?.storageKey
    ? getImageUrl(ticketData.qrImage.key || ticketData.qrImage.storageKey)
    : `https://img.vietqr.io/image/970422-${ticketData.accountNumber || '1903678912345'}-compact.png?amount=${ticketData.totalAmount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(ticketData.accountName || 'CHU SAN')}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirm = () => {
    toast.success('Yêu cầu đặt vé đã được gửi thành công!');
    onConfirmSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1629] text-white p-6 sm:p-7 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3e635]">
            <QrCode className="size-4" />
            <span>Thanh toán chuyển khoản VietQR</span>
          </div>
          <DialogTitle className="mt-1 font-heading text-xl font-black text-white uppercase">
            {ticketData.eventTitle}
          </DialogTitle>
        </DialogHeader>

        {/* 1. Countdown Timer Box */}
        <div
          className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 text-xs ${
            isExpired
              ? 'border-red-800/80 bg-red-950/40 text-red-300'
              : 'border-[#a3e635]/40 bg-[#a3e635]/10 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className={`size-4 ${isExpired ? 'text-red-400' : 'text-[#a3e635] animate-pulse'}`}
            />
            <span className="font-medium">
              {isExpired ? 'Thời gian giữ vé đã hết hạn' : 'Thời gian giữ vé còn lại:'}
            </span>
          </div>
          <span className="font-heading text-lg font-black tracking-widest text-[#a3e635]">
            {isExpired ? '00:00' : `${minutes}:${seconds}`}
          </span>
        </div>

        {isExpired && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-900/30 p-2.5 text-xs text-red-300">
            <AlertTriangle className="size-4 shrink-0 text-red-400" />
            <span>Vui lòng không chuyển khoản cho đơn vé đã hết hạn giữ chỗ.</span>
          </div>
        )}

        {/* 2. QR Code Image with SVG Fallback */}
        <div className="mt-4">
          <VietQrDisplay
            src={qrImageUrl}
            accountNumber={ticketData.accountNumber || '1903678912345'}
            accountName={ticketData.accountName || 'CHỦ SÂN'}
            amount={ticketData.totalAmount}
            transferNote={transferNote}
          />
        </div>

        {/* 3. Account Details Info */}
        <div className="mt-4 space-y-2.5 rounded-xl border border-slate-800/80 bg-[#080e1c] p-4 text-xs">
          {/* Chủ tài khoản */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Chủ tài khoản:</span>
            <span className="font-bold text-white uppercase">
              {ticketData.accountName || 'NGUYỄN VĂN CHỦ SÂN'}
            </span>
          </div>

          {/* Số tài khoản */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">
                {ticketData.accountNumber || '1903678912345'}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    ticketData.accountNumber || '1903678912345',
                    'Số tài khoản'
                  )
                }
                className="rounded-md bg-slate-800 p-1 text-slate-300 hover:text-white"
                title="Sao chép"
              >
                {copiedField === 'Số tài khoản' ? (
                  <Check className="size-3 text-[#a3e635]" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>

          {/* Số tiền */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span className="text-slate-400">Số tiền:</span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-[#a3e635] text-base">
                {formatEventPrice(ticketData.totalAmount)}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(ticketData.totalAmount.toString(), 'Số tiền')
                }
                className="rounded-md bg-slate-800 p-1 text-slate-300 hover:text-white"
                title="Sao chép"
              >
                {copiedField === 'Số tiền' ? (
                  <Check className="size-3 text-[#a3e635]" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>

          {/* Nội dung chuyển khoản */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span className="text-slate-400">Nội dung chuyển khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded">
                {transferNote}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(transferNote, 'Nội dung chuyển khoản')
                }
                className="rounded-md bg-slate-800 p-1 text-slate-300 hover:text-white"
                title="Sao chép"
              >
                {copiedField === 'Nội dung chuyển khoản' ? (
                  <Check className="size-3 text-[#a3e635]" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Action Button */}
        <div className="mt-5">
          <button
            type="button"
            disabled={isExpired}
            onClick={handleConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a3e635] py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-[#a3e635]/20 transition-all hover:bg-[#bef264] active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <span>Tôi đã chuyển khoản / Gửi yêu cầu xác nhận</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
