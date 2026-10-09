import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicBranchesQuery } from '../api/usePublicHome';
import type { PublicBranchListItemDto } from '../types/public.types';

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
  // Gọi API backend GET /api/v1/branches
  const { data: pagedResult, isLoading } = usePublicBranchesQuery({ page: 1, pageSize: 6 });

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  // Ưu tiên dữ liệu thật từ Backend nếu có
  const branches =
    pagedResult?.items && pagedResult.items.length > 0 ? pagedResult.items : FALLBACK_BRANCHES;

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              GẦN BẠN
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-foreground mt-1 leading-tight">
              Sân được người chơi quay lại
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium pb-1">
            Dựa trên đánh giá và lượt đặt gần đây
          </p>
        </div>

        {/* 3 Cards Grid with Skeleton Support */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col"
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
              // Kiểm tra AvailableCourtCount null hay có giá trị theo đúng lưu ý của người dùng
              const hasAvailability =
                branch.availableCourtCount !== null && branch.availableCourtCount !== undefined;
              const isAlmostFull = branch.availableCourtCount === 1;

              const sportName = branch.sports?.[0]?.name || 'Thể thao';
              const imageUrl =
                branch.coverImage?.url ||
                'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={branch.id}
                  className="group rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Image & Availability Badge */}
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={branch.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge Còn sân: Chỉ hiển thị khi backend trả về khác null */}
                    {hasAvailability && (
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
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Sport Tag & Rating (Đã bỏ tổng số review theo yêu cầu) */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium text-muted-foreground">{sportName}</span>
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          <span>{branch.reviewAverage?.toFixed(1) || '5.0'}</span>
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                        </div>
                      </div>

                      {/* Branch Name */}
                      <h3 className="font-heading font-black text-xl text-foreground tracking-normal group-hover:text-[#397B48] transition-colors line-clamp-1">
                        {branch.name}
                      </h3>

                      {/* District & Distance (Đã bỏ tổng số review) */}
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        {branch.district}
                        {branch.distanceKm ? ` · ${branch.distanceKm} km` : ''}
                      </p>
                    </div>

                    {/* Footer: Khoảng giá & Nút Xem sân */}
                    <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <span className="font-heading font-black text-base sm:text-lg text-foreground tracking-normal">
                          {formatPrice(branch.minPrice)} - {formatPrice(branch.maxPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/ giờ</span>
                      </div>

                      <Link
                        to={`/branches/${branch.id}`}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-foreground hover:text-[#397B48] transition-colors group/link"
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
    </section>
  );
}
