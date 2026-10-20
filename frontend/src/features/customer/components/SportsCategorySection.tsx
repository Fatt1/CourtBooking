import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSportTypesQuery, type SportTypeItem } from '@/api/sport-types';
import { getImageUrl } from '@/api/storage';

// Dữ liệu hình ảnh mặc định theo từng môn thể thao
const DEFAULT_SPORT_IMAGES: Record<string, string> = {
  'Bóng đá': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'Bóng đá mini': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  'Pickleball': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
  'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  'Bóng rổ': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
};

export function SportsCategorySection() {
  const { data: apiSports, isLoading } = useSportTypesQuery();

  // Dữ liệu thật từ Backend API
  const displaySports = apiSports || [];

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              KHÁM PHÁ THEO MÔN
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-foreground mt-1 leading-tight">
              Một chỗ cho mọi cuộc chơi
            </h2>
          </div>

          <Link
            to="/courts"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <span>Xem tất cả sân</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Sports Cards Grid with Skeleton Support */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/60 bg-muted/40 p-4 flex flex-col justify-end"
              >
                <Skeleton className="absolute inset-0 rounded-none w-full h-full" />
                <div className="relative z-10 space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-foreground/15" />
                  <Skeleton className="h-3.5 w-1/3 bg-foreground/15" />
                </div>
              </div>
            ))}
          </div>
        ) : displaySports.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border/60">
            Hiện chưa có danh mục môn thể thao nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displaySports.slice(0, 4).map((sport) => {
              const imageUrl =
                (sport.image?.key ? getImageUrl(sport.image.key) : null) ||
                sport.image?.url ||
                DEFAULT_SPORT_IMAGES[sport.name] ||
                DEFAULT_SPORT_IMAGES['Bóng đá'];

              return (
                <Link
                  key={sport.id}
                  to={`/courts?sport=${encodeURIComponent(sport.name)}&sportId=${sport.id}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border border-border/60 bg-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#397B48]/50 cursor-pointer block"
                >
                  <img
                    src={imageUrl}
                    alt={sport.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        DEFAULT_SPORT_IMAGES[sport.name] || DEFAULT_SPORT_IMAGES['Bóng đá'];
                    }}
                  />
                  {/* Gradient Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Title & Sân count */}
                  <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                    <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-normal leading-tight group-hover:text-emerald-300 transition-colors">
                      {sport.name}
                    </h3>
                    <p className="text-xs text-white/80 font-medium mt-0.5">
                      {sport.branchCount || 0} sân
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}


