import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useSportTypesQuery } from '@/api/sport-types';
import { getImageUrl } from '@/api/storage';

// Dữ liệu hình ảnh mặc định theo từng môn thể thao
const DEFAULT_SPORT_IMAGES: Record<string, string> = {
  'Bóng đá': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'Bóng đá mini': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  'Pickleball': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
  'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  'Bóng rổ': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  'Bơi lội': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
  'Bóng bàn': 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=800&q=80',
  'Bida (Billiards)': 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?auto=format&fit=crop&w=800&q=80',
};

interface SportCategoryDisplay {
  id: string;
  name: string;
  branchCount: number;
  imageUrl: string;
}

export function SportsCategorySection() {
  const { data: apiSports, isLoading } = useSportTypesQuery();
  const [api, setApi] = React.useState<CarouselApi>();

  // Dữ liệu thực tế từ Backend API
  const displaySports: SportCategoryDisplay[] = React.useMemo(() => {
    if (!apiSports || apiSports.length === 0) return [];
    return apiSports.map((sport) => {
      const imageUrl =
        (sport.image?.key ? getImageUrl(sport.image.key) : null) ||
        sport.image?.url ||
        DEFAULT_SPORT_IMAGES[sport.name] ||
        DEFAULT_SPORT_IMAGES['Bóng đá'];

      return {
        id: sport.id,
        name: sport.name,
        branchCount: sport.branchCount || 0,
        imageUrl,
      };
    });
  }, [apiSports]);

  // Chỉ hiển thị mũi tên và bật loop khi có nhiều hơn 4 môn thể thao
  const hasMultipleSlides = displaySports.length > 4;

  const handlePrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const handleNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  return (
    <section className="py-10 sm:py-14 select-none">
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

          <div className="flex items-center gap-4">
            <Link
              to="/courts"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
            >
              <span>Xem tất cả sân</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Các nút điều hướng nhỏ trên Header (chỉ hiện khi có nhiều hơn 4 hình) */}
            {hasMultipleSlides && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border/60">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Hình trước"
                  className="size-8 rounded-full border border-border/80 bg-background hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="size-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Hình kế tiếp"
                  className="size-8 rounded-full border border-border/80 bg-background hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="size-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sports Cards Infinite Loop Carousel */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 bg-muted/40 p-4 flex flex-col justify-end"
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
          <div className="relative group">
            <Carousel
              opts={{
                loop: hasMultipleSlides,
                align: 'start',
              }}
              setApi={setApi}
              className="w-full"
            >
              <CarouselContent className="-ml-3 sm:-ml-4 lg:-ml-6 py-2">
                {displaySports.map((sport, idx) => (
                  <CarouselItem
                    key={`${sport.id}-${idx}`}
                    className="pl-3 sm:pl-4 lg:pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <Link
                      to={`/courts?sport=${encodeURIComponent(sport.name)}&sportId=${sport.id}`}
                      className="group/card relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border border-border/60 bg-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#397B48]/50 cursor-pointer block select-none"
                    >
                      <img
                        src={sport.imageUrl}
                        alt={sport.name}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/card:scale-105 pointer-events-none"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            DEFAULT_SPORT_IMAGES[sport.name] || DEFAULT_SPORT_IMAGES['Bóng đá'];
                        }}
                      />
                      {/* Gradient Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                      {/* Title & Sân count */}
                      <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
                        <h3 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-normal leading-tight group-hover/card:text-emerald-300 transition-colors">
                          {sport.name}
                        </h3>
                        <p className="text-xs text-white/80 font-medium mt-0.5">
                          {sport.branchCount || 0} sân
                        </p>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Nút mũi tên Trái < ở giữa chiều dọc Carousel (chỉ hiện khi có nhiều hơn 4 hình) */}
            {hasMultipleSlides && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Hình trước"
                  className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-card/90 text-foreground hover:text-white hover:bg-[#397B48] border border-border/80 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="size-5 sm:size-6 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Hình kế tiếp"
                  className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-card/90 text-foreground hover:text-white hover:bg-[#397B48] border border-border/80 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="size-5 sm:size-6 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
