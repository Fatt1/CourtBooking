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

// Fallback dữ liệu hoàn chỉnh khi người dùng click vào các thẻ sân mẫu ở trang chủ (b1, b2, b3)
const MOCK_BRANCHES: Record<string, PublicBranchDetailDto> = {
  b1: {
    id: 'b1',
    name: 'Sân Cầu lông Lan Anh',
    hotline: '0903 123 456',
    street: '291 Cách Mạng Tháng 8',
    district: 'Quận 10',
    province: 'Hồ Chí Minh',
    ggMapUrl: 'https://maps.google.com',
    distanceKm: 1.2,
    openTime: '06:00:00',
    closeTime: '23:00:00',
    policy: 'Hủy sân trước 6 tiếng hoàn 100% cọc. Vui lòng mang giày đế kếp chuyên dụng khi vào sân thi đấu.',
    description: `<h3>Hệ thống sân cầu lông tiêu chuẩn thi đấu quốc tế</h3><p>Sân Cầu lông Lan Anh sở hữu 8 thảm đấu đạt tiêu chuẩn BWF với độ nảy đồng đều, hệ thống đèn LED chống lóa cao cấp giúp người chơi quan sát đường cầu rõ nét nhất.</p><p>Tại đây có đầy đủ phòng thay đồ, tắm nóng lạnh miễn phí, căng-tin phục vụ nước giải khát và dịch vụ căng vợt chuyên nghiệp.</p>`,
    minPrice: 100000,
    maxPrice: 180000,
    reviewAverage: 4.8,
    sports: [{ id: 's1', name: 'Cầu lông' }],
    images: [
      { id: 'img1', key: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80' },
      { id: 'img2', key: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80' },
      { id: 'img3', key: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=800&q=80' },
      { id: 'img4', key: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  b2: {
    id: 'b2',
    name: 'Victory Pickleball Arena',
    hotline: '0988 765 432',
    street: '15 Đường Số 9, P. Linh Chiểu',
    district: 'TP. Thủ Đức',
    province: 'Hồ Chí Minh',
    ggMapUrl: 'https://maps.google.com',
    distanceKm: 2.4,
    openTime: '06:00:00',
    closeTime: '22:30:00',
    policy: 'Chấp nhận đổi giờ chơi trước 4 tiếng. Không mang thức ăn có mùi vào khu vực sân đấu.',
    description: `<h3>Tổ hợp Pickleball ngoài trời có mái che hiện đại</h3><p>Mặt sân Acrylic 8 lớp cao cấp chống trơn trượt, giảm chấn động bảo vệ khớp gối người chơi tối đa. Đầy đủ khu nghỉ ngơi cà phê máy lạnh mát mẻ.</p>`,
    minPrice: 140000,
    maxPrice: 220000,
    reviewAverage: 4.7,
    sports: [{ id: 's2', name: 'Pickleball' }],
    images: [
      { id: 'img1', key: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80' },
      { id: 'img2', key: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
      { id: 'img3', key: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  b3: {
    id: 'b3',
    name: 'GREEN FIELD ARENA',
    hotline: '0912 345 678',
    street: '18 Nguyễn Thị Thập',
    district: 'Quận 7',
    province: 'Hồ Chí Minh',
    ggMapUrl: 'https://maps.google.com',
    distanceKm: 5.8,
    openTime: '06:00:00',
    closeTime: '24:00:00',
    policy: 'Vui lòng có mặt trước giờ chơi 10 phút. Yêu cầu hủy được chủ sân duyệt theo chính sách chi nhánh. Không mang thức ăn có mùi vào khu vực thi đấu.',
    description: `<h3>Trung tâm thể thao bóng đá & đa năng Green Field</h3><p>Cụm sân cỏ nhân tạo đạt chuẩn FIFA 2 sao, sợi cỏ mềm mại chống trầy xước, dàn đèn LED công suất lớn không bóng đổ. Bãi giữ xe ô tô sức chứa lớn và hệ thống camera an ninh 24/7.</p>`,
    minPrice: 170000,
    maxPrice: 300000,
    reviewAverage: 4.8,
    sports: [{ id: 's3', name: 'Bóng đá' }, { id: 's4', name: 'Cầu lông' }],
    images: [
      { id: 'img1', key: 'https://images.unsplash.com/photo-1529900245534-47fbf82a6f6d?auto=format&fit=crop&w=1200&q=80' },
      { id: 'img2', key: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' },
      { id: 'img3', key: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80' },
      { id: 'img4', key: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80' },
      { id: 'img5', key: 'https://images.unsplash.com/photo-1518604666864-74230560e945?auto=format&fit=crop&w=800&q=80' },
    ],
  },
};

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Quản lý tab đang hoạt động (mặc định vào tab booking theo yêu cầu)
  const [activeTab, setActiveTab] = useState<BranchDetailTab>('booking');

  // 2. Fetch dữ liệu chi nhánh từ Backend API
  const { data: apiBranch, isLoading, isError } = usePublicBranchDetailQuery(id);

  // Xác định dữ liệu hiển thị (Ưu tiên API Backend, fallback nếu dùng ID demo)
  const branch: PublicBranchDetailDto | undefined =
    apiBranch || (id && MOCK_BRANCHES[id]) || MOCK_BRANCHES['b3'];

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
