import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Minus,
  Plus,
  Loader2,
  Trophy,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { getImageUrl } from '@/api/storage';
import { usePublicEventDetailQuery } from '../api/publicEventsApi';
import {
  formatEventPrice,
  getFullDateText,
  getTimeRangeText,
  isEventBookingExpired,
  formatSkillLevel,
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
      className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-bold text-foreground overflow-hidden shrink-0 shadow-xs"
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
  const { isAuthenticated } = useAuthStore();

  const { data: event, isLoading, isError } = usePublicEventDetailQuery(id);
  const [quantity, setQuantity] = useState<number>(1);

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-[#397B48] dark:text-[#a3e635]" />
        <p className="text-xs text-muted-foreground">Đang tải chi tiết sự kiện...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 max-w-md">
          <p className="font-semibold text-red-600 dark:text-red-400">Không tìm thấy thông tin sự kiện.</p>
          <p className="mt-1 text-xs text-muted-foreground">Sự kiện có thể đã kết thúc hoặc bị hủy.</p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.availableSlot <= 0 || event.status === 1;
  // Kiểm tra thời gian: Chỉ có thể mua vé khi thời gian hiện tại bé hơn thời gian giờ bắt đầu trận đấu
  const isExpired = isEventBookingExpired(event.date, event.startTime);
  const canBuy = !isFull && !isExpired && event.status === 0;
  const maxAvailable = Math.max(0, event.availableSlot);

  // Chọn ảnh banner từ branch images hoặc cover
  const bannerImage = event.branch.images?.[0]?.key
    ? getImageUrl(event.branch.images[0].key)
    : 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80';

  const fullDateText = getFullDateText(event.date, 'Thứ Bảy, 25/10/2026');
  // Hiển thị giờ bắt đầu và giờ kết thúc của trận đấu
  const timeRangeText = getTimeRangeText(event.startTime, event.endTime, '08:00 - 12:00');
  const skillLevelText = formatSkillLevel(event.skillLevelFrom, event.skillLevelTo);

  // Xử lý chuyển sang trang thanh toán / xác nhận vé
  const handleProceedToCheckout = () => {
    if (!canBuy) return;

    const checkoutUrl = `/events/${event.id}/checkout?quantity=${quantity}`;
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, lưu redirect kèm số lượng vé đã chọn
      navigate(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
    } else {
      navigate(checkoutUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-3.5" />
          <span>Tất cả sự kiện</span>
        </Link>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Hero Image Banner */}
            <div className="relative aspect-16/9 sm:h-[400px] w-full overflow-hidden rounded-2xl bg-muted shadow-2xl">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Floating Bottom-Left Badge */}
              <div className="absolute bottom-4 left-4 rounded-lg bg-[#397B48] dark:bg-[#a3e635] px-3.5 py-1.5 text-xs font-black tracking-wider text-white dark:text-slate-950 uppercase shadow-lg">
                MATCHDAY EVENTS
              </div>
            </div>

            {/* 2. Category, Title & Status */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black tracking-widest text-[#397B48] dark:text-[#a3e635] uppercase">
                  MÔN {event.sportTypeName}
                </span>
                <span className="text-muted-foreground">·</span>
                {/* Bổ sung hiển thị trình độ trong trang chi tiết event theo Yêu cầu 4 */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">
                  <Trophy className="size-3 text-[#397B48] dark:text-[#a3e635]" />
                  <span>Trình độ: {skillLevelText}</span>
                </div>
              </div>

              <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-foreground uppercase sm:text-5xl">
                {event.title}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                {isExpired ? (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Đã hết thời gian mua vé (trận đấu đã diễn ra)
                  </span>
                ) : isFull ? (
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <span className="size-2 rounded-full bg-red-500" />
                    Đã hết vé đăng ký
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#397B48] dark:text-[#a3e635]">
                    <span className="size-2 rounded-full bg-[#397B48] dark:bg-[#a3e635] animate-pulse" />
                    Đang mở đăng ký mua vé
                  </span>
                )}
              </div>
            </div>

            {/* 3. Card: VỀ SỰ KIỆN */}
            <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-sm">
              <span className="text-[11px] font-bold tracking-wider text-[#397B48] dark:text-[#a3e635] uppercase">
                VỀ SỰ KIỆN
              </span>
              <h3 className="mt-1 font-heading text-xl font-bold text-foreground">
                Một ngày chơi thật đã
              </h3>
              {event.description && event.description.trim() ? (
                <div
                  className="tiptap-rendered-content max-w-none mt-3 text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Một buổi thi đấu và giao lưu dành cho tất cả người yêu {event.sportTypeName}. Bạn sẽ được ghép trận theo trình độ ({skillLevelText}), thử sức với nhiều người chơi mới và cùng nhau tận hưởng không khí thể thao sôi động.
                </p>
              )}
            </div>

            {/* 5. Card: Người sẽ cùng tham gia */}
            <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#397B48] dark:text-[#a3e635] uppercase">
                  CỘNG ĐỒNG MATCHDAY
                </span>
                <h3 className="mt-1 font-heading text-xl font-bold text-foreground">
                  Người sẽ cùng tham gia
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
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
                  <div className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-[#397B48] dark:bg-[#a3e635] text-[11px] font-bold text-white dark:text-slate-950">
                    +0
                  </div>
                )}

                {event.participants && event.participants.length > 5 && (
                  <div className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-[#397B48] dark:bg-[#a3e635] text-[11px] font-black text-white dark:text-slate-950">
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
              <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-xl">
                {/* Price Header */}
                <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  VÉ THAM GIA
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-heading text-3xl font-black text-foreground">
                    {formatEventPrice(event.ticketPrice)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ người</span>
                </div>

                <div className="my-4 border-t border-border/60" />

                {/* Event Schedule Info (Hiển thị ngày diễn ra + giờ bắt đầu & giờ kết thúc) */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      NGÀY DIỄN RA
                    </div>
                    <div className="mt-0.5 font-semibold text-foreground">
                      {fullDateText}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      THỜI GIAN TRẬN ĐẤU (BẮT ĐẦU - KẾT THÚC)
                    </div>
                    <div className="mt-0.5 font-semibold text-foreground">
                      {timeRangeText}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      TRÌNH ĐỘ YÊU CẦU
                    </div>
                    <div className="mt-0.5 font-semibold text-[#397B48] dark:text-[#a3e635]">
                      {skillLevelText}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      ĐỊA ĐIỂM
                    </div>
                    <div className="mt-0.5 font-semibold text-foreground">
                      {event.branch.branchName}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {event.branch.address}
                    </div>
                  </div>
                </div>

                <div className="my-4 border-t border-border/60" />

                {/* Participant Count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Người tham gia</span>
                  <span className="font-bold text-foreground">
                    {event.bookedSlots} / {event.slots} người
                  </span>
                </div>

                <div className="my-4 border-t border-border/60" />

                {/* Quantity Stepper */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Số lượng vé
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted p-1.5">
                    <button
                      type="button"
                      disabled={quantity <= 1 || !canBuy}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex size-9 items-center justify-center rounded-lg bg-card text-foreground hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="font-heading text-base font-bold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= maxAvailable || !canBuy}
                      onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                      className="flex size-9 items-center justify-center rounded-lg bg-card text-foreground hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 text-right text-[11px] text-muted-foreground">
                    {event.availableSlot} vé còn lại
                  </div>
                </div>

                {/* Subtotal */}
                <div className="mt-4 flex items-baseline justify-between border-t border-border/60 pt-4">
                  <span className="text-xs font-medium text-muted-foreground">Tạm tính</span>
                  <span className="font-heading text-xl font-black text-foreground">
                    {formatEventPrice(event.ticketPrice * quantity)}
                  </span>
                </div>

                {/* Purchase Button */}
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={handleProceedToCheckout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#397B48] text-white hover:bg-[#2e633a] dark:bg-[#a3e635] dark:text-slate-950 dark:hover:bg-[#bef264] py-3.5 text-sm font-bold shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <span>
                    {isExpired
                      ? 'Đã hết thời gian mua vé'
                      : isFull
                      ? 'Đã hết vé'
                      : 'Mua vé'}
                  </span>
                  {canBuy && <ArrowRight className="size-4" />}
                </button>

                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {isExpired
                    ? 'Trận đấu đã bắt đầu hoặc kết thúc, không thể đặt vé thêm.'
                    : 'Bạn có thể điều chỉnh số lượng vé trước khi tiếp tục.'}
                </p>
              </div>

              {/* Callout Card Below */}
              <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-4 flex items-start gap-3 shadow-sm">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#397B48]/15 dark:bg-[#a3e635]/15 text-[#397B48] dark:text-[#a3e635] shrink-0 mt-0.5">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    Cùng cộng đồng ra sân
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
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
