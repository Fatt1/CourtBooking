import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/api/storage';
import { formatVND } from '@/lib/format';
import type { PublicBranchListItemDto } from '@/api/branches';

interface CourtBranchCardProps {
  branch: PublicBranchListItemDto;
}

const DEFAULT_BRANCH_IMAGE =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';

export function CourtBranchCard({ branch }: CourtBranchCardProps) {
  // Ưu tiên url -> key -> fallback ảnh thể thao mặc định
  const imageUrl = branch.coverImage?.url
    ? branch.coverImage.url
    : branch.coverImage?.key
    ? getImageUrl(branch.coverImage.key)
    : DEFAULT_BRANCH_IMAGE;

  const sportName = branch.sports?.[0]?.name || 'Thể thao';
  const openTimeStr = branch.openTime ? branch.openTime.slice(0, 5) : '06:00';
  const closeTimeStr = branch.closeTime ? branch.closeTime.slice(0, 5) : '23:00';

  // Lấy danh sách tags tiện ích & loại sân từ database của chủ sân
  const tags: string[] = [
    ...(branch.courtTypes || []),
    ...(branch.services || []),
  ].slice(0, 4);

  // Hiển thị trạng thái sân trống nếu tìm theo khung giờ hoặc mặc định
  const hasAvailability =
    branch.availableCourtCount !== null && branch.availableCourtCount !== undefined;

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row group">
      {/* 1. Hình ảnh bên trái */}
      <div className="md:w-72 lg:w-80 shrink-0 relative aspect-[16/10] md:aspect-auto overflow-hidden bg-muted">
        <Link to={`/branches/${branch.id}`} className="block w-full h-full">
          <img
            src={imageUrl}
            alt={branch.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_BRANCH_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
        </Link>

        {/* Green badge góc trên bên phải ảnh (Figma: "3 sân còn trống") */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          {hasAvailability ? (
            <span className="bg-[#397B48] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              {branch.availableCourtCount} sân còn trống
            </span>
          ) : (
            <span className="bg-[#18231C]/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/10 backdrop-blur-xs">
              Nhận đặt sân
            </span>
          )}
        </div>
      </div>

      {/* 2. Chi tiết sân bên phải */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Hàng 1: Môn thể thao & Đánh giá sao */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {sportName}
            </span>

            {branch.reviewAverage > 0 ? (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                <span className="text-[#397B48]">{branch.reviewAverage.toFixed(1)}</span>
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">Mới mở</span>
            )}
          </div>

          {/* Hàng 2: Tên sân & Địa chỉ/Khoảng cách */}
          <div className="mt-1">
            <Link
              to={`/branches/${branch.id}`}
              className="font-heading font-black text-xl text-foreground group-hover:text-[#397B48] transition-colors line-clamp-1"
            >
              {branch.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-medium">
              {branch.fullAddress || `${branch.street || ''}, ${branch.district || ''}, ${branch.province || ''}`}
              {branch.distanceKm !== null && branch.distanceKm !== undefined && (
                <span className="ml-1 text-[#397B48] font-bold">
                  · {branch.distanceKm} km
                </span>
              )}
            </p>
          </div>

          {/* Hàng 3: Danh sách tags tiện ích & loại sân từ database */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-muted/80 text-muted-foreground text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-border/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hàng 4: Thanh khung giờ hoạt động (Strip bar chuẩn Figma) */}
        <div className="rounded-xl bg-muted/40 border border-border/50 px-3.5 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="font-bold text-foreground">
              HOẠT ĐỘNG: {openTimeStr} – {closeTimeStr}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            Đặt trực tuyến 24/7
          </span>
        </div>

        {/* Hàng 5: Giá tiền và Nút Xem sân (Yêu cầu đặc biệt của người dùng) */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-4">
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
              <div className="text-sm font-bold text-muted-foreground">
                Liên hệ chủ sân
              </div>
            )}
            <p className="text-[11px] text-muted-foreground font-medium">
              Xem lịch trống và giá chi tiết
            </p>
          </div>

          <Button
            asChild
            className="bg-[#397B48] hover:bg-[#2D633A] text-white font-bold px-6 py-2.5 h-10 rounded-xl text-sm shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Link to={`/branches/${branch.id}`}>Xem sân</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
