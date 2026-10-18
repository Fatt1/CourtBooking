import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePublicBranchesQuery, type PublicBranchListItemDto } from '@/api/branches';
import { getImageUrl } from '@/api/storage';
import { formatVND } from '@/lib/format';
import { BranchReviewsModal } from './BranchReviewsModal';

const DEFAULT_BRANCH_FALLBACK =
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';

// Fallback data khi backend chưa chạy hoặc chưa có data
const FALLBACK_BRANCHES: PublicBranchListItemDto[] = [
  {
    id: 'b1',
    name: 'Sân Cầu lông Lan Anh',
    sports: [{ id: 's1', name: 'Cầu lông' }],
    district: 'Bình Thạnh',
    province: 'Hồ Chí Minh',
    street: '291 Cách Mạng Tháng 8',
    distanceKm: 1.2,
    reviewAverage: 4.8,
    minPrice: 100000,
    maxPrice: 180000,
    availableCourtCount: 4, // Có sân trống
    coverImage: {
      id: 'img1',
      url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    },
    openTime: '06:00',
    closeTime: '23:00',
  },
  {
    id: 'b2',
    name: 'Victory Pickleball',
    sports: [{ id: 's2', name: 'Pickleball' }],
    district: 'Thủ Đức',
    province: 'Hồ Chí Minh',
    street: '15 Đường Số 9',
    distanceKm: 2.4,
    reviewAverage: 4.7,
    minPrice: 140000,
    maxPrice: 220000,
    availableCourtCount: 2, // Có sân trống
    coverImage: {
      id: 'img2',
      url: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
    },
    openTime: '06:00',
    closeTime: '22:30',
  },
  {
    id: 'b3',
    name: 'Tennis Phú Thọ',
    sports: [{ id: 's3', name: 'Tennis' }],
    district: 'Quận 11',
    province: 'Hồ Chí Minh',
    street: '219 Lý Thường Kiệt',
    distanceKm: 4.1,
    reviewAverage: 4.9,
    minPrice: 180000,
    maxPrice: 300000,
    availableCourtCount: 1, // Còn 1 sân
    coverImage: {
      id: 'img3',
      url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    },
    openTime: '05:30',
    closeTime: '22:00',
  },
];

export function FeaturedBranchesSection() {
  const [selectedBranchForReviews, setSelectedBranchForReviews] =
    useState<PublicBranchListItemDto | null>(null);

  // Gọi API backend GET /api/v1/branches
  const { data: pagedResult, isLoading } = usePublicBranchesQuery({
    page: 1,
    pageSize: 6,
  });

  // Ưu tiên dữ liệu thật từ Backend nếu có
  const branches =
    pagedResult?.items && pagedResult.items.length > 0 ? pagedResult.items : FALLBACK_BRANCHES;

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              GẦN BẠN
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-foreground mt-1 leading-tight">
              Sân được người chơi quay lại
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Dựa trên đánh giá và lượt đặt gần đây quanh khu vực
            </p>
          </div>

          <Link
            to="/courts"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground hover:text-[#397B48] transition-colors group cursor-pointer"
          >
            <span>Khám phá thêm sân</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3 Cards Grid with Skeleton Support */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col"
              >
                {/* Image Skeleton */}
                <Skeleton className="aspect-[16/10] w-full rounded-none" />

                {/* Card Content Skeleton */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3.5 w-12" />
                    </div>
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.slice(0, 3).map((branch) => {
              const hasAvailability =
                branch.availableCourtCount !== null && branch.availableCourtCount !== undefined;
              const isAlmostFull = branch.availableCourtCount === 1;

              const sportName = branch.sports?.[0]?.name || 'Thể thao';
              const imageUrl =
                branch.coverImage?.url ||
                (branch.coverImage?.key ? getImageUrl(branch.coverImage.key) : null) ||
                DEFAULT_BRANCH_FALLBACK;

              return (
                <div
                  key={branch.id}
                  className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Image & Availability Badge */}
                  <Link
                    to={`/branches/${branch.id}`}
                    className="relative aspect-[16/10] bg-muted overflow-hidden block cursor-pointer"
                  >
                    <img
                      src={imageUrl}
                      alt={branch.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_BRANCH_FALLBACK;
                      }}
                    />

                    {/* Badge Còn sân */}
                    {hasAvailability ? (
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight shadow-md backdrop-blur-sm',
                            isAlmostFull
                              ? 'bg-amber-400 text-amber-950 border border-amber-500/40'
                              : 'bg-[#397B48] text-white border border-[#397B48]'
                          )}
                        >
                          {isAlmostFull ? 'Còn 1 sân' : 'Còn sân'}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#18231C]/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/10 backdrop-blur-xs">
                          Nhận đặt sân
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Sport Tag & Rating */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
<span className="font-semibold text-muted-foreground uppercase tracking-wide">
                          {sportName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedBranchForReviews(branch);
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
                      </div>

                      {/* Branch Name */}
                      <Link
                        to={`/branches/${branch.id}`}
                        className="block font-heading font-black text-xl text-foreground tracking-normal group-hover:text-[#397B48] transition-colors line-clamp-1 cursor-pointer"
                      >
                        {branch.name}
                      </Link>

                      {/* District & Distance */}
                      <p className="text-xs text-muted-foreground mt-1 font-medium line-clamp-1">
                        {branch.district}
                        {branch.distanceKm !== null && branch.distanceKm !== undefined ? (
                          <span className="text-[#397B48] font-bold">
                            {' '}· {branch.distanceKm} km
                          </span>
                        ) : (
                          ''
                        )}
                      </p>
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
            })}
          </div>
        )}
      </div>

      {/* Modal Xem Đánh Giá Chi Nhánh */}
      {selectedBranchForReviews && (
        <BranchReviewsModal
          isOpen={Boolean(selectedBranchForReviews)}
          onClose={() => setSelectedBranchForReviews(null)}
          branchId={selectedBranchForReviews.id}
          branchName={selectedBranchForReviews.name}
          reviewAverage={selectedBranchForReviews.reviewAverage}
        />
      )}
    </section>
  );
}
