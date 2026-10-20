import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicBranchesQuery, type PublicBranchListItemDto } from '@/api/branches';
import { BranchReviewsModal } from './BranchReviewsModal';
import { CourtBranchCard } from './courts/CourtBranchCard';

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
                    <Skeleton className="h-3.5 w-28" />
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
            {branches.slice(0, 3).map((branch) => (
              <CourtBranchCard
                key={branch.id}
                branch={branch}
                onOpenReviews={setSelectedBranchForReviews}
              />
            ))}
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
