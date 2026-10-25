import { Link } from 'react-router-dom';
import { Star, Clock, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/api/storage';
import { formatVND } from '@/lib/format';
import type { PublicBranchListItemDto } from '@/api/branches';

export interface CourtBranchCardProps {
  branch: PublicBranchListItemDto;
  onOpenReviews?: (branch: PublicBranchListItemDto) => void;
}

const DEFAULT_BRANCH_IMAGE =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';

export function CourtBranchCard({ branch, onOpenReviews }: CourtBranchCardProps) {
  const imageUrl =
    branch.coverImage?.url ||
    (branch.coverImage?.key ? getImageUrl(branch.coverImage.key) : null) ||
    DEFAULT_BRANCH_IMAGE;

  const sportName = branch.sports?.[0]?.name || 'Thể thao';
  const openTimeStr = branch.openTime ? branch.openTime.slice(0, 5) : '06:00';
  const closeTimeStr = branch.closeTime ? branch.closeTime.slice(0, 5) : '23:00';

  const hasAvailability =
    branch.availableCourtCount !== null && branch.availableCourtCount !== undefined;
  const isAlmostFull = branch.availableCourtCount === 1;

  const addressText =
    branch.fullAddress ||
    [branch.street, branch.district, branch.province].filter(Boolean).join(', ') ||
    branch.district ||
    'Chưa cập nhật địa chỉ';

  // Link Google Maps chỉ đường
  const mapLocationUrl =
    branch.latitude && branch.longitude
      ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${branch.name}, ${addressText}`
        )}`;

  return (
    <div className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* 1. Hình ảnh & Nút chỉ đường */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        <Link
          to={`/branches/${branch.id}`}
          className="block w-full h-full cursor-pointer"
        >
          <img
            src={imageUrl}
            alt={branch.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_BRANCH_IMAGE;
            }}
          />
        </Link>

        {/* Badge Còn sân (hiển thị khi tìm theo khung giờ) */}
        {hasAvailability && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-md backdrop-blur-sm',
                isAlmostFull
                  ? 'bg-amber-400 text-amber-950 border border-amber-500/40'
                  : 'bg-[#397B48] text-white border border-[#397B48]'
              )}
            >
              {isAlmostFull ? 'Còn 1 sân' : `${branch.availableCourtCount} sân trống`}
            </span>
          </div>
        )}

        {/* Nút chỉ đường (định vị vị trí sân trên Google Maps) */}
        <div className="absolute top-3 right-3 z-10">
          <a
            href={mapLocationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 bg-[#18231C]/90 hover:bg-[#397B48] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md border border-white/10 backdrop-blur-xs transition-all duration-200 cursor-pointer group/map"
            title={`Xem vị trí của ${branch.name} trên Google Maps`}
          >
            <MapPin className="size-3 text-emerald-400 group-hover/map:text-white transition-colors" />
            <span>Chỉ đường</span>
          </a>
        </div>
      </div>

      {/* 2. Nội dung thẻ */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Môn thể thao & Đánh giá */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-muted-foreground uppercase tracking-wide">
              {sportName}
            </span>
            {onOpenReviews ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenReviews(branch);
                }}
                className="flex items-center gap-1 font-bold text-foreground hover:text-[#397B48] bg-muted/60 hover:bg-[#397B48]/10 px-2 py-0.5 rounded-full transition-colors cursor-pointer group/star border border-border/40"
                title="Xem đánh giá tổng quan của cơ sở này"
              >
                <span className="text-[#397B48] group-hover/star:underline">
                  {branch.reviewAverage && branch.reviewAverage > 0
                    ? branch.reviewAverage.toFixed(1)
                    : '5.0'}
                </span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
              </button>
            ) : (
              <div
                className="flex items-center gap-1 font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40"
                title="Đánh giá trung bình"
              >
                <span className="text-[#397B48]">
                  {branch.reviewAverage && branch.reviewAverage > 0
                    ? branch.reviewAverage.toFixed(1)
                    : '5.0'}
                </span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
              </div>
            )}
          </div>

          {/* Tên sân / Chi nhánh */}
          <Link
            to={`/branches/${branch.id}`}
            className="block font-heading font-black text-xl text-foreground tracking-normal group-hover:text-[#397B48] transition-colors line-clamp-1 cursor-pointer"
          >
            {branch.name}
          </Link>

          {/* Địa chỉ chi nhánh & Khoảng cách */}
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1.5 font-medium">
            <MapPin className="size-3.5 text-muted-foreground/80 shrink-0 mt-0.5" />
            <span className="line-clamp-1 flex-1" title={addressText}>
              {addressText}
            </span>
            {branch.distanceKm !== null && branch.distanceKm !== undefined && (
              <span className="text-[#397B48] font-bold shrink-0">
                · {branch.distanceKm} km
              </span>
            )}
          </div>

          {/* Giờ hoạt động */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-medium">
            <Clock className="size-3.5 text-muted-foreground/80 shrink-0" />
            <span>
              {openTimeStr} – {closeTimeStr}
            </span>
          </div>
        </div>

        {/* Footer: Khoảng giá & Nút Xem sân */}
        <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <div>
            {branch.minPrice > 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="font-heading font-black text-base sm:text-lg text-[#397B48]">
                  {formatVND(branch.minPrice)}
                  {branch.maxPrice > branch.minPrice && ` – ${formatVND(branch.maxPrice)}`}
                </span>
                <span className="text-xs text-muted-foreground font-normal">/ giờ</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                Liên hệ chủ sân
              </span>
            )}
          </div>

          <Link
            to={`/branches/${branch.id}`}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-foreground hover:text-[#397B48] transition-colors group/link cursor-pointer"
          >
            <span>Xem sân</span>
            <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
