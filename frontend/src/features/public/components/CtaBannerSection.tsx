import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CtaBannerSection() {
  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="rounded-3xl bg-[#132617] dark:bg-[#0E1B2E] text-white border border-white/10 p-8 sm:p-12 lg:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text */}
          <div className="space-y-2 max-w-xl relative z-10">
            <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-emerald-400">
              TRẬN TIẾP THEO ĐANG CHỜ
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-white leading-tight">
              Tạo tài khoản để lưu lịch và mở kèo giao lưu.
            </h2>
          </div>

          {/* Right Button */}
          <div className="shrink-0 relative z-10">
            <Button
              asChild
              className="bg-[#397B48] hover:bg-[#2D633A] text-white font-bold px-8 py-3.5 rounded-md text-sm sm:text-base shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Link to="/register">Đăng ký MATCHDAY</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
