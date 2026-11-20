import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { useMatchesQuery, type MatchDto } from '@/api/matches';

interface HeroMatchInfo {
  id: string;
  title: string;
  subtitle: string;
}

const HERO_SLIDES = [
  {
    image: '/images/hero-2.jpg',
    alt: 'Trận giao lưu pickleball sôi nổi tại cụm sân hiện đại',
  },
  {
    image: '/images/hero-1.jpg',
    alt: 'Nhóm bạn thư giãn sau giờ chơi thể thao tại công viên Vinhomes',
  },
  {
    image: '/images/hero-3.jpg',
    alt: 'Trận bóng đá giao hữu dưới ánh đèn sân cỏ nhân tạo',
  },
];

function formatMatchSimpleInfo(match: MatchDto): HeroMatchInfo {
  const title =
    match.description?.trim().split('\n')[0]?.slice(0, 45) ||
    `Kèo ${match.sportTypeName || 'Giao lưu'}`;

  const time = match.startTime ? match.startTime.slice(0, 5) : '';
  const location =
    match.branchAddress?.split(',').slice(-2, -1)[0]?.trim() || match.branchName;
  const slots =
    match.availableSlots > 0 ? `còn ${match.availableSlots} chỗ` : 'đã đủ người';

  const subtitle = [time, location, slots].filter(Boolean).join(' · ');

  return {
    id: match.id,
    title,
    subtitle,
  };
}

export function HeroSection() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(HERO_SLIDES.length);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Lấy tối đa 3 kèo giao lưu từ API hiện có
  const { data: pagedMatches } = useMatchesQuery({
    page: 1,
    pageSize: 3,
  });

  const matches = pagedMatches?.items || [];
  const totalMatchesCount = pagedMatches?.totalCount ?? matches.length;

  const currentMatch = React.useMemo<HeroMatchInfo | null>(() => {
    if (!matches.length) return null;
    const match = matches[current % matches.length];
    return match ? formatMatchSimpleInfo(match) : null;
  }, [matches, current]);

  return (
    <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-6 space-y-6">
            {/* Sub-tag */}
            <div className="font-sans font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              SÂN CHƠI ĐANG CHỜ BẠN
            </div>

            {/* Main Headline */}
            <h1 className="font-sans font-black text-6xl sm:text-7xl lg:text-[5.5rem] xl:text-[6rem] uppercase tracking-tight text-foreground leading-[0.98] sm:leading-[1]">
              HÔM NAY<br />CHƠI GÌ?
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed font-normal">
              Đặt sân hoặc tham gia một kèo phù hợp chỉ trong vài phút.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-sans">
              <Link
                to="/courts"
                className="inline-flex items-center justify-center bg-[#397B48] hover:bg-[#2D633A] !text-white font-bold px-7 py-3 rounded-xl text-base shadow-sm transition-transform active:scale-95 cursor-pointer select-none"
              >
                Tìm sân trống
              </Link>

              <Link
                to="/matches"
                className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-[#397B48] transition-colors text-sm sm:text-base group select-none"
              >
                <span>Xem kèo tối nay</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 sm:pt-8 border-t border-border/40 max-w-md font-sans">
              <Link to="/courts" className="group block cursor-pointer">
                <div className="font-sans font-black text-2xl sm:text-3xl text-foreground group-hover:text-[#397B48] transition-colors">
                  300+
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium group-hover:text-foreground transition-colors">
                  sân đang hoạt động
                </div>
              </Link>
              <div>
                <div className="font-sans font-black text-2xl sm:text-3xl text-foreground">
                  4,8/5
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  từ người chơi
                </div>
              </div>
              <Link to="/courts" className="group block cursor-pointer">
                <div className="font-sans font-black text-2xl sm:text-3xl text-foreground group-hover:text-[#397B48] transition-colors">
                  24/7
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium group-hover:text-foreground transition-colors">
                  đặt sân trực tuyến
                </div>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Image Carousel with Clean Presentation */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full relative"
                opts={{
                  loop: true,
                }}
                setApi={setApi}
              >
                {/* Main Carousel Slides */}
                <CarouselContent className="-ml-0">
                  {HERO_SLIDES.map((slide, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <div className="relative aspect-[4/3] sm:aspect-[14/11] w-full rounded-3xl overflow-hidden shadow-2xl border border-border/40 bg-muted">
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          className="w-full h-full object-cover object-center select-none"
                          loading={index === 0 ? 'eager' : 'lazy'}
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {/* Slide Indicators / Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
                  {Array.from({ length: count }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => api?.scrollTo(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 cursor-pointer shadow-sm',
                        current === i
                          ? 'w-6 bg-white'
                          : 'w-1.5 bg-white/60 hover:bg-white/80'
                      )}
                      aria-label={`Chuyển tới ảnh ${i + 1}`}
                    />
                  ))}
                </div>
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
