import { HeroSection } from '../components/HeroSection';
import { QuickSearchBar } from '../components/QuickSearchBar';
import { SportsCategorySection } from '../components/SportsCategorySection';
import { FeaturedBranchesSection } from '../components/FeaturedBranchesSection';
import { SocialMatchesSection } from '../components/SocialMatchesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { CommunityProofSection } from '../components/CommunityProofSection';
import { CtaBannerSection } from '../components/CtaBannerSection';

export function HomePage() {
  return (
    <div className="space-y-4 sm:space-y-8 pb-12">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Quick Booking Search Bar */}
      <QuickSearchBar />

      {/* 3. Khám Phá Theo Môn (Bóng đá, Cầu lông, Pickleball, Tennis) */}
      <SportsCategorySection />

      {/* 4. Sân Được Người Chơi Quay Lại (Gần bạn) */}
      <FeaturedBranchesSection />

      {/* 5. Kèo Giao Lưu (Dark Green Section) */}
      <SocialMatchesSection />

      {/* 6. Đặt Sân Trong 3 Bước */}
      <HowItWorksSection />

      {/* 7. Cộng Đồng Thật, Trận Đấu Thật */}
      <CommunityProofSection />

      {/* 8. CTA Banner (Đăng ký Matchday) */}
      <CtaBannerSection />
    </div>
  );
}
