import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface BranchHeaderProps {
  name: string;
  sports: Array<{ id: string; name: string }>;
  street: string;
  district: string;
  province: string;
  distanceKm?: number | null;
  hotline?: string;
  ggMapUrl?: string;
  reviewAverage?: number;
  reviewCount?: number;
}

export function BranchHeader({
  name,
  sports,
  street,
  district,
  province,
  distanceKm,
  hotline,
  ggMapUrl,
  reviewAverage = 0,
  reviewCount = 0,
}: BranchHeaderProps) {
  const navigate = useNavigate();

  const fullAddress = [street, district, province].filter(Boolean).join(', ');
  const sportsLabel = sports?.length
    ? sports.map((s) => s.name.toUpperCase()).join(' · ')
    : 'THỂ THAO';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Xem sân ${name} tại Matchday`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="space-y-3">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>Kết quả tìm kiếm</span>
        </button>
      </div>

      {/* Main Header Information */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1.5 flex-1">
          {/* Sport Tag */}
          <div className="text-xs sm:text-sm font-black tracking-wider text-[#397B48] uppercase">
            {sportsLabel}
          </div>

          {/* Branch Name */}
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-foreground">
            {name}
          </h1>

          {/* Address & Distance */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:text-base text-muted-foreground font-medium">
            <span>{fullAddress || 'Đang cập nhật địa chỉ'}</span>
            {distanceKm !== undefined && distanceKm !== null && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="font-semibold text-foreground/80">{distanceKm} km</span>
              </>
            )}
          </div>
        </div>

        {/* Rating & Quick Actions */}
        <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-2 flex-shrink-0 pt-2 md:pt-0">
          {/* Rating Display */}
          {reviewCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                {(reviewAverage || 0).toFixed(1)}
              </span>
              <Star className="size-5 sm:size-6 fill-amber-400 text-amber-400" />
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                <div>{reviewCount} đánh giá</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-muted-foreground text-xs font-semibold">
              <Star className="size-3.5 text-muted-foreground/40" />
              <span>Chưa có đánh giá</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-1">
            {hotline && (
              <a
                href={`tel:${hotline.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                title={`Gọi hotline: ${hotline}`}
              >
                <Phone className="size-3.5 text-[#397B48]" />
                <span className="hidden sm:inline">{hotline}</span>
                <span className="sm:hidden">Gọi</span>
              </a>
            )}

            {ggMapUrl && (
              <a
                href={ggMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                title="Xem vị trí trên Google Maps"
              >
                <MapPin className="size-3.5 text-[#397B48]" />
                <span className="hidden sm:inline">Chỉ đường</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              title="Chia sẻ sân"
              aria-label="Chia sẻ"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
