import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { getImageUrl } from '@/api/storage';
import type { EventCardDto } from '../types';
import {
  formatEventPrice,
  getDayNumber,
  getMonthText,
  getCardTimeText,
  formatSkillLevel,
} from '../utils/dateUtils';

// Ảnh mặc định chất lượng cao cho các môn thể thao nếu sự kiện chưa tải ảnh sân
const DEFAULT_SPORT_IMAGES: Record<string, string> = {
  default:
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  badminton:
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  pickleball:
    'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
  football:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
};

interface EventCardProps {
  event: EventCardDto;
}

export function EventCard({ event }: EventCardProps) {
  const isFull = event.availableSlot <= 0 || event.status === 1;

  const sName = (event.sportTypeName || '').toLowerCase();
  let fallbackImage = DEFAULT_SPORT_IMAGES.default;
  if (sName.includes('pickleball')) fallbackImage = DEFAULT_SPORT_IMAGES.pickleball;
  else if (sName.includes('cầu lông') || sName.includes('badminton')) fallbackImage = DEFAULT_SPORT_IMAGES.badminton;
  else if (sName.includes('bóng đá') || sName.includes('football') || sName.includes('futsal')) fallbackImage = DEFAULT_SPORT_IMAGES.football;

  const initialImageUrl = event.coverImage?.key ? getImageUrl(event.coverImage.key) : fallbackImage;

  // Hiển thị trình độ của sự kiện thay thế cho chữ "GIẢI PHONG TRÀO" theo yêu cầu người dùng
  const skillLevelText = formatSkillLevel(event.skillLevelFrom, event.skillLevelTo);

  const dayNumber = getDayNumber(event.date, '25');
  const monthText = getMonthText(event.date, 'THÁNG 10');
  // Hiển thị đủ cả giờ bắt đầu và giờ kết thúc trận đấu cùng ngày diễn ra
  const timeText = getCardTimeText(event.date, event.startTime, event.endTime);

  return (
    <div className="group flex flex-col rounded-2xl border border-border/80 bg-card text-card-foreground overflow-hidden shadow-xs hover:border-[#397B48]/50 dark:hover:border-slate-700 hover:shadow-xl transition-all duration-200">
      {/* 1. Header Image with Date & Status Badges */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={initialImageUrl}
          alt={event.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Floating Top-Left Date Badge */}
        <div className="absolute top-3 left-3 flex min-w-[52px] flex-col items-center justify-center rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-lg backdrop-blur-xs">
          <span className="font-heading text-2xl font-black leading-none text-slate-950">
            {dayNumber}
          </span>
          <span className="mt-0.5 text-[9px] font-bold tracking-wider text-slate-600 uppercase">
            {monthText}
          </span>
        </div>

        {/* Floating Top-Right Status Badge (if full) */}
        {isFull && (
          <div className="absolute top-3 right-3 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-black tracking-wide text-white shadow-md uppercase backdrop-blur-xs">
            HẾT VÉ
          </div>
        )}
      </div>

      {/* 2. Body Details */}
      <div className="flex flex-1 flex-col p-5">
        {/* Skill Level & Status Row (Bỏ chữ 'Giải phong trào', thay bằng Trình độ) */}
        <div className="flex items-center justify-between text-xs font-bold tracking-wider">
          <span className="text-[#397B48] dark:text-[#a3e635] uppercase">
            TRÌNH ĐỘ: {skillLevelText}
          </span>
          <span className={isFull ? 'text-muted-foreground font-medium' : 'text-foreground/80 font-semibold'}>
            {isFull ? 'ĐÃ HẾT VÉ' : 'ĐANG MỞ'}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-[#397B48] dark:group-hover:text-[#a3e635] line-clamp-1">
          {event.title}
        </h3>

        {/* Branch / Sport Note */}
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
          {event.branchName} · Môn {event.sportTypeName} dành cho người chơi yêu thể thao.
        </p>

        {/* Time & Location (Hiển thị đầy đủ giờ bắt đầu - kết thúc) */}
        <div className="mt-4 space-y-1.5 text-xs text-foreground/80">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{timeText}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{event.branchAddress || event.branchName}</span>
          </div>
        </div>

        {/* Participant Progress */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="text-muted-foreground">Đã tham gia</span>
          <span className="font-semibold text-foreground">
            {event.bookedSlots} / {event.slots} người
          </span>
        </div>

        {/* 3. Footer Action */}
        <div className="mt-5 flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              {isFull ? '' : 'Vé từ'}
            </div>
            <div className="font-heading text-lg font-black text-foreground">
              {isFull ? (
                <span className="text-muted-foreground text-sm font-semibold">Đã hết vé</span>
              ) : (
                formatEventPrice(event.ticketPrice)
              )}
            </div>
          </div>

          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-bold shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <span>Xem chi tiết</span>
            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
