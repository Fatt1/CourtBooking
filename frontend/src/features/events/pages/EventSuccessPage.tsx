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

        {/* Centered Success Card */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1629] p-8 sm:p-12 text-center shadow-2xl">
          {/* Green Checkmark Circle */}
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#a3e635] text-slate-950 shadow-lg shadow-[#a3e635]/25">
            <Check className="size-8 stroke-[3]" />
          </div>

          <div className="mt-5 text-xs font-bold tracking-widest text-[#a3e635] uppercase">
            XÁC NHẬN THÀNH CÔNG
          </div>

          <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
            VÉ CỦA BẠN ĐÃ SẴN SÀNG
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-300">
            Cảm ơn bạn đã tham gia cùng MATCHDAY. Hẹn gặp bạn tại sự kiện!
          </p>

          {/* Ticket Information Box */}
          <div className="mt-6 rounded-xl border border-slate-800/80 bg-[#080e1c] p-5">
            <h3 className="font-heading text-base font-bold text-white sm:text-lg">
              {eventTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {quantity} vé · {formatEventPrice(totalAmount)}
            </p>
          </div>

          {/* Return Button */}
          <div className="mt-8">
            <Link
              to="/events"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-slate-200 active:scale-95"
            >
              Xem các sự kiện khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
