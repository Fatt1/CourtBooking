import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { getImageUrl } from '@/api/storage';
import { usePublicEventDetailQuery } from '../api/publicEventsApi';
import {
  formatEventPrice,
  getFullDateText,
  getTimeRangeText,
} from '../utils/dateUtils';

function ParticipantAvatar({ p }: { p: any }) {
  const [hasError, setHasError] = useState(false);
  const initials = (p.fullName || '')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div
      title={p.fullName}
      className="flex size-9 items-center justify-center rounded-full border-2 border-[#0d1629] bg-slate-800 text-[11px] font-bold text-white overflow-hidden shrink-0"
    >
      {p.avatar?.key && !hasError ? (
        <img
          src={getImageUrl(p.avatar.key)}
          alt={p.fullName}
          onError={() => setHasError(true)}
          className="size-full object-cover"
        />
      ) : (
        initials || 'CB'
      )}
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const { data: event, isLoading, isError } = usePublicEventDetailQuery(id);
  const [quantity, setQuantity] = useState<number>(1);

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-3 bg-[#080e1c] text-white">
        <Loader2 className="size-8 animate-spin text-[#a3e635]" />
        <p className="text-xs text-slate-400">Đang tải chi tiết sự kiện...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center bg-[#080e1c] px-4 text-center text-white">
        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-8 max-w-md">
          <p className="font-semibold text-red-400">Không tìm thấy thông tin sự kiện.</p>
          <p className="mt-1 text-xs text-slate-400">Sự kiện có thể đã kết thúc hoặc bị hủy.</p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.availableSlot <= 0 || event.status === 1;
  const maxAvailable = Math.max(0, event.availableSlot);

  // Chọn ảnh banner từ branch images hoặc cover
  const bannerImage = event.branch.images?.[0]?.key
    ? getImageUrl(event.branch.images[0].key)
    : 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80';

  const fullDateText = getFullDateText(event.startDate, 'Thứ Bảy, 10/10/2026');
  const timeRangeText = getTimeRangeText(event.startDate, event.endDate, '08:00 - 12:00');

  // Xử lý chuyển sang trang thanh toán / xác nhận vé
  const handleProceedToCheckout = () => {
    if (isFull) return;

    const checkoutUrl = `/events/${event.id}/checkout?quantity=${quantity}`;
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, lưu redirect kèm số lượng vé đã chọn
      navigate(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
    } else {
      navigate(checkoutUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white mb-6"
        >
          <ArrowLeft className="size-3.5" />
          <span>Tất cả sự kiện</span>
        </Link>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Hero Image Banner */}
            <div className="relative aspect-16/9 sm:h-[400px] w-full overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
              <img
                src={bannerImage}
                alt={event.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80';
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080e1c]/80 via-transparent to-black/20" />

              {/* Floating Bottom-Left Badge */}
              <div className="absolute bottom-4 left-4 rounded-lg bg-[#a3e635] px-3.5 py-1.5 text-xs font-black tracking-wider text-slate-950 uppercase shadow-lg">
                MATCHDAY EVENTS
              </div>
            </div>

            {/* 2. Category, Title & Status */}
            <div>
              <div className="text-xs font-bold tracking-widest text-[#a3e635] uppercase">
                {event.skillLevelFrom
                  ? `GIẢI PHONG TRÀO · ${event.sportTypeName}`
                  : `GIAO LƯU CỘNG ĐỒNG · ${event.sportTypeName}`}
              </div>
              <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
                {event.title}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                {isFull ? (
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="size-2 rounded-full bg-red-400" />
                    Đã hết vé đăng ký
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#a3e635]">
                    <span className="size-2 rounded-full bg-[#a3e635] animate-pulse" />
                    Đang mở đăng ký
                  </span>
                )}
              </div>
            </div>

            {/* 3. Card: VỀ SỰ KIỆN */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-xl">
              <span className="text-[11px] font-bold tracking-wider text-[#a3e635] uppercase">
                VỀ SỰ KIỆN
              </span>
              <h3 className="mt-1 font-heading text-xl font-bold text-white">
                Một ngày chơi thật đã
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {event.description ||
                  `Một buổi sáng dành cho tất cả người yêu ${event.sportTypeName}. Bạn sẽ được ghép trận theo trình độ, thử sức với nhiều người chơi mới và cùng nhau tận hưởng không khí thể thao sôi động.`}
              </p>
            </div>

            {/* 4. Side-by-side Cards: Lịch trình & Lưu ý */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Lịch trình */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-xl">
                <span className="text-[11px] font-bold tracking-wider text-[#a3e635] uppercase">
                  CHƯƠNG TRÌNH
                </span>
                <h3 className="mt-1 font-heading text-xl font-bold text-white">
                  Lịch trình
                </h3>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span><strong>08:00</strong> · Đón khách và nhận vòng tay thi đấu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span><strong>08:30</strong> · Khởi động, chia nhóm giao lưu theo trình độ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span><strong>09:00</strong> · Thi đấu xoay vòng giao lưu tính điểm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span><strong>11:30</strong> · Trao kỷ niệm chương, tổng kết và chụp ảnh</span>
                  </li>
                </ul>
              </div>

              {/* Lưu ý & quy định */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-xl">
                <span className="text-[11px] font-bold tracking-wider text-[#a3e635] uppercase">
                  THAM GIA CÙNG NHAU
                </span>
                <h3 className="mt-1 font-heading text-xl font-bold text-white">
                  Lưu ý & quy định
                </h3>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span>Có mặt trước giờ bắt đầu ít nhất 15 phút để làm thủ tục nhận vé.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span>Mang giày thể thao chuyên dụng; có thể mang theo vợt cá nhân.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-[#a3e635] shrink-0" />
                    <span>Tôn trọng tinh thần fair-play và tuân thủ hướng dẫn của ban tổ chức.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. Card: Người sẽ cùng tham gia */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#a3e635] uppercase">
                  CỘNG ĐỒNG MATCHDAY
                </span>
                <h3 className="mt-1 font-heading text-xl font-bold text-white">
                  Người sẽ cùng tham gia
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Gặp thêm bạn chơi mới ở sự kiện này.
                </p>
              </div>

              {/* Avatars */}
              <div className="flex items-center -space-x-2 overflow-hidden py-1">
                {event.participants && event.participants.length > 0 ? (
                  event.participants.slice(0, 5).map((p, idx) => (
                    <ParticipantAvatar key={p.playerId + idx} p={p} />
                  ))
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#0d1629] bg-[#a3e635] text-[11px] font-bold text-slate-950">
                    +0
                  </div>
                )}

                {event.participants && event.participants.length > 5 && (
                  <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#0d1629] bg-[#a3e635] text-[11px] font-black text-slate-950">
                    +{event.participants.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-4) - Sticky Booking Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Ticket Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1629] p-6 shadow-2xl text-white">
                {/* Price Header */}
                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  VÉ THAM GIA
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-heading text-3xl font-black text-white">
                    {formatEventPrice(event.ticketPrice)}
                  </span>
                  <span className="text-xs text-slate-400">/ người</span>
                </div>

                <div className="my-4 border-t border-slate-800/80" />

                {/* Event Schedule Info */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      NGÀY DIỄN RA
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-200">
                      {fullDateText}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      THỜI GIAN
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-200">
                      {timeRangeText}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      ĐỊA ĐIỂM
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-200">
                      {event.branch.branchName}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {event.branch.address}
                    </div>
                  </div>
                </div>

                <div className="my-4 border-t border-slate-800/80" />

                {/* Participant Count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Người tham gia</span>
                  <span className="font-bold text-white">
                    {event.bookedSlots} / {event.slots} người
                  </span>
                </div>

                <div className="my-4 border-t border-slate-800/80" />

                {/* Quantity Stepper */}
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    Số lượng vé
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#080e1c] p-1.5">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isFull}
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
                      disabled={quantity >= maxAvailable || isFull}
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

                {/* Subtotal */}
                <div className="mt-4 flex items-baseline justify-between border-t border-slate-800/80 pt-4">
                  <span className="text-xs font-medium text-slate-400">Tạm tính</span>
                  <span className="font-heading text-xl font-black text-white">
                    {formatEventPrice(event.ticketPrice * quantity)}
                  </span>
                </div>

                {/* Purchase Button */}
                <button
                  type="button"
                  disabled={isFull}
                  onClick={handleProceedToCheckout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a3e635] py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-[#a3e635]/20 transition-all hover:bg-[#bef264] active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <span>{isFull ? 'Đã hết vé' : 'Mua vé'}</span>
                  {!isFull && <ArrowRight className="size-4" />}
                </button>

                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Bạn có thể điều chỉnh số lượng vé trước khi tiếp tục.
                </p>
              </div>

              {/* Callout Card Below */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1629]/70 p-4 flex items-start gap-3 text-slate-300 shadow-md">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#a3e635]/15 text-[#a3e635] shrink-0 mt-0.5">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Cùng cộng đồng ra sân
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Gặp người chơi mới, tận hưởng một ngày thể thao đáng nhớ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
