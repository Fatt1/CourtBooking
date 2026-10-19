import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Tìm sân phù hợp',
      desc: 'Lọc theo khu vực, môn chơi và mức giá.',
      href: '/courts',
      cta: 'Khám phá sân',
    },
    {
      num: '02',
      title: 'Chọn khung giờ',
      desc: 'Xem lịch trống và giá theo từng thời điểm.',
      href: '/courts',
      cta: 'Xem lịch trống',
    },
    {
      num: '03',
      title: 'Xem lại tạm tính',
      desc: 'Thêm dịch vụ và xem trước luồng thanh toán online, không cần đăng nhập.',
      href: '/courts',
      cta: 'Bắt đầu đặt',
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
            NHANH VÀ RÕ RÀNG
          </span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-foreground mt-1 leading-tight">
            Đặt sân trong 3 bước
          </h2>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <Link
              key={step.num}
              to={step.href}
              className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-[#397B48]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-3">
                <div className="font-heading font-black text-2xl sm:text-3xl text-foreground/80 group-hover:text-[#397B48] transition-colors">
                  {step.num}
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-[#397B48] transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 mt-2 flex items-center gap-1.5 text-xs font-bold text-[#397B48] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <span>{step.cta}</span>
                <ArrowRight className="size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

