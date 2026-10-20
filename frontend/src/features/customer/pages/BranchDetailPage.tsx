import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublicBranchDetailQuery, type PublicBranchDetailDto } from '@/api/branches';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchHeader } from '../components/branch-detail/BranchHeader';
import { BranchGallery } from '../components/branch-detail/BranchGallery';
import { BranchTabsNav, type BranchDetailTab } from '../components/branch-detail/BranchTabsNav';
import { BranchInfoTab } from '../components/branch-detail/BranchInfoTab';
import { BranchReviewsTab } from '../components/branch-detail/BranchReviewsTab';
import { BranchPricingTab } from '../components/branch-detail/BranchPricingTab';
import { BranchServicesTab } from '../components/branch-detail/BranchServicesTab';
import { BranchBookingTab } from '../components/branch-detail/BranchBookingTab';
import { useBranchReviewsQuery } from '@/api/reviews';
import { toast } from 'sonner';

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Quản lý tab đang hoạt động (mặc định vào tab booking theo yêu cầu)
  const [activeTab, setActiveTab] = useState<BranchDetailTab>('booking');

  // 2. Fetch dữ liệu chi nhánh từ Backend API
  const { data: apiBranch, isLoading, isError } = usePublicBranchDetailQuery(id);

  // Dữ liệu chi nhánh thực tế từ Backend API
  const branch: PublicBranchDetailDto | undefined = apiBranch;

  // 4. Fetch dữ liệu đánh giá thực tế từ Backend API
  const { data: reviewsData } = useBranchReviewsQuery(branch?.id, 1, 10);
  const realReviewCount = reviewsData?.totalCount ?? reviewsData?.items?.length ?? 0;
  const calculatedAvg =
    reviewsData?.items && reviewsData.items.length > 0
      ? reviewsData.items.reduce((acc, r) => acc + r.rating, 0) / reviewsData.items.length
      : 0;
  const realReviewAverage =
    reviewsData?.averageRating && reviewsData.averageRating > 0
      ? reviewsData.averageRating
      : calculatedAvg > 0
        ? calculatedAvg
        : branch?.reviewAverage && branch.reviewAverage > 0
          ? branch.reviewAverage
          : 0;

  // Cập nhật thẻ title trình duyệt
  useEffect(() => {
    if (branch?.name) {
      document.title = `${branch.name} | Đặt sân tại Matchday`;
    }
  }, [branch?.name]);

  if (isLoading && !branch) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h2 className="font-heading font-black text-2xl text-foreground">
          Không tìm thấy thông tin sân bãi
        </h2>
        <p className="text-sm text-muted-foreground">
          Chi nhánh này có thể đã dừng hoạt động hoặc đường dẫn không chính xác.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl bg-[#183424] text-white font-bold text-sm shadow-md"
        >
          Quay về Trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* 1. Header chi nhánh (Tên, địa chỉ, khoảng cách, hotline, đánh giá) */}
        <BranchHeader
          name={branch.name}
          sports={branch.sports}
          street={branch.street}
          district={branch.district}
          province={branch.province}
          distanceKm={branch.distanceKm}
          hotline={branch.hotline}
          ggMapUrl={branch.ggMapUrl}
          reviewAverage={realReviewAverage}
          reviewCount={realReviewCount}
        />

        {/* 2. Bộ sưu tập ảnh (Gallery 3 ảnh + Overlay dấu cộng xem toàn bộ ảnh) */}
        <BranchGallery images={branch.images} branchName={branch.name} />

        {/* 3. Thanh điều hướng 5 Tab chính */}
        <BranchTabsNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          reviewCount={realReviewCount}
        />

        {/* 4. Nội dung các Tab */}
        <div className="pt-2">
          {activeTab === 'info' && (
            <BranchInfoTab
              branch={branch}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'reviews' && (
            <BranchReviewsTab
              branchId={branch.id}
              branchName={branch.name}
              reviewAverage={realReviewAverage}
            />
          )}

          {activeTab === 'pricing' && (
            <BranchPricingTab
              branchId={branch.id}
              branchName={branch.name}
              minPrice={branch.minPrice}
              maxPrice={branch.maxPrice}
            />
          )}

          {activeTab === 'services' && (
            <BranchServicesTab
              branchId={branch.id}
              branchName={branch.name}
            />
          )}

          {activeTab === 'booking' && (
            <BranchBookingTab
              branchId={branch.id}
              branchName={branch.name}
              openTime={branch.openTime}
              closeTime={branch.closeTime}
              branchAddress={`${branch.street}, ${branch.district}, ${branch.province}`}
              branchBanner={
                branch.images && branch.images.length > 0
                  ? branch.images[0].key
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
