import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Loader2,
  Info,
  Calendar,
  Clock,
  MapPin,
  Trophy,
} from 'lucide-react';
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
  isEventBookingExpired,
  formatSkillLevel,
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
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-[#397B48] dark:text-[#a3e635]" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin đơn vé...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 max-w-md">
          <p className="font-semibold text-red-600 dark:text-red-400">
            Không tìm thấy sự kiện cần thanh toán.
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại sự kiện</span>
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = isEventBookingExpired(event.date, event.startTime);
  const maxAvailable = Math.max(0, event.availableSlot);
  const fullDateText = getFullDateText(event.date, 'Thứ Bảy, 25/10/2026');
  // Hiển thị giờ bắt đầu và giờ kết thúc của trận đấu
  const timeRangeText = getTimeRangeText(event.startTime, event.endTime, '08:00 - 12:00');
  const skillLevelText = formatSkillLevel(event.skillLevelFrom, event.skillLevelTo);
  const totalAmount = event.ticketPrice * quantity;

  const handleConfirmTicket = async () => {
    if (isExpired) {
      toast.error('Sự kiện đã bắt đầu hoặc đã quá thời hạn mua vé.');
      return;
    }

    if (quantity < 1 || quantity > maxAvailable) {
      toast.error('Số lượng vé không hợp lệ.');
      return;
    }

    try {
      const res = await bookMutation.mutateAsync({
        quantity,
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
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại sự kiện</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-black tracking-widest text-[#397B48] dark:text-[#a3e635] uppercase">
            MATCHDAY EVENTS
          </span>
          <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-foreground uppercase sm:text-5xl">
            VÉ SỰ KIỆN
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kiểm tra thông tin sự kiện và số lượng vé trước khi tiếp tục.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Event Info & Buyer Details (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xs space-y-6">
              {/* Step 01: THÔNG TIN SỰ KIỆN */}
              <div className="flex items-start gap-4">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#397B48] text-white dark:bg-[#a3e635] dark:text-slate-950 text-xs font-black">
                  01
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    THÔNG TIN SỰ KIỆN
                  </div>
                  <h3 className="mt-1 font-heading text-xl font-bold text-foreground">
                    {event.title}
                  </h3>

                  {/* Hiển thị chi tiết thời gian trận đấu & địa điểm */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                      <Calendar className="size-4 text-[#397B48] dark:text-[#a3e635] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                          NGÀY DIỄN RA
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {fullDateText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                      <Clock className="size-4 text-[#397B48] dark:text-[#a3e635] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                          GIỜ THI ĐẤU
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {timeRangeText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                      <MapPin className="size-4 text-[#397B48] dark:text-[#a3e635] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                          ĐỊA ĐIỂM
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {event.branch.branchName}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {event.branch.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                      <Trophy className="size-4 text-[#397B48] dark:text-[#a3e635] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                          MÔN & TRÌNH ĐỘ
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {event.sportTypeName} · {skillLevelText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Step 02: NGƯỜI MUA VÉ */}
              <div className="flex items-start gap-4">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#397B48] text-white dark:bg-[#a3e635] dark:text-slate-950 text-xs font-black">
                  02
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    NGƯỜI MUA VÉ
                  </div>
                  <h3 className="mt-1 font-heading text-lg font-bold text-foreground">
                    {user?.name || 'Khách hàng'}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {user?.email || 'Chưa cung cấp email'}
                  </p>
                </div>
              </div>

              {/* Info Note Callout */}
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground flex items-center gap-3">
                <Info className="size-4 text-[#397B48] dark:text-[#a3e635] shrink-0" />
                <span>
                  Thông tin vé sẽ được gửi đến email của bạn sau khi thanh toán được xác nhận.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Confirm Button (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-xs space-y-5 sticky top-24">
              <div>
                <span className="text-xs font-bold tracking-wider text-[#397B48] dark:text-[#a3e635] uppercase">
                  ĐƠN VÉ CỦA BẠN
                </span>
                <h3 className="mt-1 font-heading text-2xl font-black text-foreground">
                  Tóm tắt
                </h3>
              </div>

              {/* Tóm tắt thông tin trận đấu */}
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày diễn ra:</span>
                  <span className="font-semibold text-foreground">{fullDateText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giờ trận đấu:</span>
                  <span className="font-semibold text-foreground">{timeRangeText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cơ sở:</span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[180px]" title={event.branch.branchName}>
                    {event.branch.branchName}
                  </span>
                </div>
              </div>

              {/* Ticket Price */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Giá vé</span>
                <span className="font-bold text-foreground text-sm">
                  {formatEventPrice(event.ticketPrice)}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Số lượng vé
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-1.5">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isExpired}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="font-heading text-base font-bold text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxAvailable || isExpired}
                    onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{event.availableSlot} vé còn lại</span>
                  {isExpired && (
                    <span className="text-red-500 font-semibold">Đã quá giờ đặt</span>
                  )}
                </div>
              </div>

              {/* Total Price */}
              <div className="flex items-baseline justify-between border-t border-border/80 pt-4">
                <span className="text-xs font-medium text-muted-foreground">Tổng cộng</span>
                <span className="font-heading text-2xl font-black text-foreground">
                  {formatEventPrice(totalAmount)}
                </span>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                disabled={bookMutation.isPending || maxAvailable === 0 || isExpired}
                onClick={handleConfirmTicket}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#397B48] hover:bg-[#2d6239] text-white dark:bg-[#a3e635] dark:hover:bg-[#bef264] dark:text-slate-950 py-3.5 text-sm font-bold shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {bookMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang giữ chỗ vé...</span>
                  </>
                ) : (
                  <>
                    <span>{isExpired ? 'Hết thời hạn đặt vé' : 'Xác nhận vé'}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VietQR Payment Modal with Countdown Timer & Cancel Confirmation */}
      <EventPaymentQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        ticketData={ticketResponse}
        onConfirmSuccess={handlePaymentQrSuccess}
      />
    </div>
  );
}
