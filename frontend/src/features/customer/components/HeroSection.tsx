import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-6 space-y-6">
            {/* Sub-tag */}
            <div className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              SÂN CHƠI ĐANG CHỜ BẠN
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-6xl sm:text-7xl lg:text-8xl uppercase tracking-normal sm:tracking-wide text-foreground leading-[1.05]">
              HÔM NAY<br />CHƠI GÌ?
            </h1>

            {/* Subtitle */}
            <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed font-normal">
              Đặt sân hoặc tham gia một kèo phù hợp chỉ trong vài phút.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                asChild
                className="bg-[#397B48] hover:bg-[#2D633A] text-white font-bold px-7 py-3 rounded-md text-base shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Link to="/courts">Tìm sân trống</Link>
              </Button>

              <Link
                to="/matches"
                className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-[#397B48] transition-colors text-sm sm:text-base group"
              >
                <span>Xem kèo tối nay</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 sm:pt-8 border-t border-border/50 max-w-md">
              <div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                  300+
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  sân đang hoạt động
                </div>
              </div>
              <div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                  4,8/5
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  từ người chơi
                </div>
              </div>
              <div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-foreground">
                  24/7
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  đặt sân trực tuyến
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image with Floating Badges */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image Container */}
              <div className="relative aspect-[4/3] sm:aspect-[14/11] rounded-3xl overflow-hidden shadow-2xl border border-border/40 bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80"
                  alt="Nhóm bạn thư giãn sau giờ chơi thể thao"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Badge 1: Top-Right (Kèo đang chờ) */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#18231A]/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/10 flex flex-col items-center min-w-[70px]">
                <span className="font-heading font-black text-2xl sm:text-3xl leading-none text-[#51B367]">
                  12
                </span>
                <span className="text-[9px] font-bold tracking-wider uppercase text-slate-300 mt-1">
                  KÈO ĐANG CHỜ
                </span>
              </div>

              {/* Floating Card 2: Bottom-Left (Kèo bóng đá tối nay) */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-card/95 text-card-foreground backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-border/60 max-w-[260px] animate-in fade-in-50 duration-500">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#397B48] animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    Kèo bóng đá tối nay
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium pl-4">
                  19:30 · Thủ Đức · còn 2 chỗ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
