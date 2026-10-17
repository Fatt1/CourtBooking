import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  usePublicEventDetailQuery,
  useBookEventTicketMutation,
} from '../api/publicEventsApi';
import { EventPaymentQrModal } from '../components/EventPaymentQrModal';
import type { BookEventTicketResponse } from '../types';
import {
  formatEventPrice,
  getFullDateText,
  getTimeRangeText,
} from '../utils/dateUtils';

export function EventCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const initialQty = parseInt(searchParams.get('quantity') || '1', 10);
  const [quantity, setQuantity] = useState<number>(isNaN(initialQty) ? 1 : initialQty);
  const [ticketResponse, setTicketResponse] = useState<BookEventTicketResponse | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      const currentUrl = `/events/${id}/checkout?quantity=${quantity}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [isAuthenticated, id, quantity, navigate]);

  const { data: event, isLoading, isError } = usePublicEventDetailQuery(id);
  const bookMutation = useBookEventTicketMutation(id || '');

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-3 bg-[#080e1c] text-white">
        <Loader2 className="size-8 animate-spin text-[#a3e635]" />
        <p className="text-xs text-slate-400">Đang tải thông tin đơn vé...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center bg-[#080e1c] px-4 text-center text-white">
        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-8 max-w-md">
          <p className="font-semibold text-red-400">Không tìm thấy sự kiện cần thanh toán.</p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại sự kiện</span>
          </Link>
        </div>
      </div>
    );
  }

  const maxAvailable = Math.max(0, event.availableSlot);
  const fullDateText = getFullDateText(event.startDate, 'Thứ Bảy, 10/10/2026');
  const timeRangeText = getTimeRangeText(event.startDate, event.endDate, '08:00 - 12:00');
  const totalAmount = event.ticketPrice * quantity;

  const handleConfirmTicket = async () => {
    if (quantity < 1 || quantity > maxAvailable) {
      toast.error('Số lượng vé không hợp lệ.');
      return;
    }

    try {
      // 1: BankTransfer / VietQR
      const res = await bookMutation.mutateAsync({
        quantity,
        paymentMethod: 1,
      });

      setTicketResponse(res);
      setIsQrModalOpen(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Đặt vé thất bại. Vui lòng thử lại!';
      toast.error(msg);
    }
  };

  const handlePaymentQrSuccess = () => {
    setIsQrModalOpen(false);
    navigate(`/events/${event.id}/success?quantity=${quantity}&total=${totalAmount}`, {
      state: {
        eventTitle: event.title,
        quantity,
        totalAmount,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#080e1c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white mb-6"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại sự kiện</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-black tracking-widest text-[#a3e635] uppercase">
            MATCHDAY EVENTS
          </span>
          <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-white uppercase sm:text-5xl">
            VÉ SỰ KIỆN
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Kiểm tra thông tin sự kiện và số lượng vé trước khi tiếp tục.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Event Info & Buyer Details (lg:col-span-8) */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Step 01: THÔNG TIN SỰ KIỆN */}
              <div className="flex items-start gap-4">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#a3e635] text-xs font-black text-slate-950">
                  01
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    THÔNG TIN SỰ KIỆN
                  </div>
                  <h3 className="mt-1 font-heading text-xl font-bold text-white">
                    {event.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block">
                        THỜI GIAN
                      </span>
                      <span className="text-slate-200 mt-0.5 block">
                        {fullDateText} · {timeRangeText}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block">
                        ĐỊA ĐIỂM
                      </span>
                      <span className="text-slate-200 mt-0.5 block">
                        {event.branch.branchName}, {event.branch.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80" />

              {/* Step 02: NGƯỜI MUA VÉ */}
              <div className="flex items-start gap-4">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#a3e635] text-xs font-black text-slate-950">
                  02
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    NGƯỜI MUA VÉ
                  </div>
                  <h3 className="mt-1 font-heading text-lg font-bold text-white">
                    {user?.name || 'Vua Bá Khí'}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {user?.email || 'vuabakhi@gmail.com'}
                  </p>
                </div>
              </div>

              {/* Info Note Callout */}
              <div className="rounded-xl border border-slate-800/80 bg-[#080e1c] p-4 text-xs text-slate-400 flex items-center gap-3">
                <Info className="size-4 text-slate-400 shrink-0" />
                <span>
                  Thông tin vé sẽ được gửi đến email của bạn sau khi đơn được xác nhận.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Confirm Button (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-2xl space-y-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-[#a3e635] uppercase">
                  ĐƠN VÉ CỦA BẠN
                </span>
                <h3 className="mt-1 font-heading text-2xl font-black text-white">
                  Tóm tắt
                </h3>
              </div>

              {/* Ticket Price */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Giá vé</span>
                <span className="font-bold text-white text-sm">
                  {formatEventPrice(event.ticketPrice)}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">
                  Số lượng
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#080e1c] p-1.5">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex size-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="font-heading text-base font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAvailable}
                    onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                    className="flex size-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="mt-1.5 text-right text-[11px] text-slate-400">
                  {event.availableSlot} vé còn lại
                </div>
              </div>

              {/* Total Price */}
              <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-4">
                <span className="text-xs font-medium text-slate-400">Tổng cộng</span>
                <span className="font-heading text-2xl font-black text-white">
                  {formatEventPrice(totalAmount)}
                </span>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                disabled={bookMutation.isPending || maxAvailable === 0}
                onClick={handleConfirmTicket}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a3e635] py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-[#a3e635]/20 transition-all hover:bg-[#bef264] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {bookMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang giữ chỗ vé...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận vé</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VietQR Payment Modal with Countdown Timer */}
      <EventPaymentQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        ticketData={ticketResponse}
        onConfirmSuccess={handlePaymentQrSuccess}
      />
    </div>
  );
}
