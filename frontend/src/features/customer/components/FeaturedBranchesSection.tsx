import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicBranchesQuery, type PublicBranchListItemDto } from '@/api/branches';
import { BranchReviewsModal } from './BranchReviewsModal';
import { CourtBranchCard } from './courts/CourtBranchCard';

export function FeaturedBranchesSection() {
  const [selectedBranchForReviews, setSelectedBranchForReviews] =
    useState<PublicBranchListItemDto | null>(null);

  // Gọi API backend GET /api/v1/branches
  const { data: pagedResult, isLoading } = usePublicBranchesQuery({
    page: 1,
    pageSize: 6,
  });

  // Dữ liệu thật từ Backend API
  const branches = pagedResult?.items || [];

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
        ) : branches.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border/60">
            Hiện chưa có thông tin sân nào quanh khu vực này.
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
