import { useLocation, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { formatEventPrice } from '../utils/dateUtils';
import { usePublicEventDetailQuery } from '../api/publicEventsApi';

export function EventSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const { data: event } = usePublicEventDetailQuery(id);

  // Lấy dữ liệu từ state hoặc query parameters
  const state = location.state as { eventTitle?: string; quantity?: number; totalAmount?: number } | null;
  const eventTitle = state?.eventTitle || event?.title || 'Sự kiện thể thao';
  const quantity = state?.quantity || parseInt(searchParams.get('quantity') || '1', 10);
  const totalAmount = state?.totalAmount || (event ? event.ticketPrice * quantity : parseInt(searchParams.get('total') || '0', 10));

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
            Thông tin xác nhận đơn đặt vé sự kiện của bạn.
          </p>
        </div>

        {/* Centered Success Card */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-border/80 bg-card text-card-foreground p-8 sm:p-12 text-center shadow-xs">
          {/* Green Checkmark Circle */}
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#397B48] text-white dark:bg-[#a3e635] dark:text-slate-950 shadow-md">
            <Check className="size-8 stroke-[3]" />
          </div>

          <div className="mt-5 text-xs font-bold tracking-widest text-[#397B48] dark:text-[#a3e635] uppercase">
            XÁC NHẬN THÀNH CÔNG
          </div>

          <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-foreground uppercase sm:text-4xl">
            VÉ CỦA BẠN ĐÃ ĐƯỢC TIẾP NHẬN
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
            Cảm ơn bạn đã tham gia cùng MATCHDAY. Yêu cầu của bạn đã được chuyển tới ban tổ chức để đối soát chuyển khoản. Hẹn gặp bạn tại sự kiện!
          </p>

          {/* Ticket Information Box */}
          <div className="mt-6 rounded-xl border border-border/70 bg-muted/40 p-5 text-center">
            <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
              {eventTitle}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {quantity} vé · {formatEventPrice(totalAmount)}
            </p>
          </div>

          {/* Return Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/events"
              className="inline-flex items-center justify-center rounded-xl bg-[#397B48] hover:bg-[#2d6239] text-white dark:bg-[#a3e635] dark:hover:bg-[#bef264] dark:text-slate-950 px-8 py-3 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              Xem các sự kiện khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
