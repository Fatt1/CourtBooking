export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Tìm sân phù hợp',
      desc: 'Lọc theo khu vực, môn chơi và mức giá.',
    },
    {
      num: '02',
      title: 'Chọn khung giờ',
      desc: 'Xem lịch trống và giá theo từng thời điểm.',
    },
    {
      num: '03',
      title: 'Xem lại tạm tính',
      desc: 'Thêm dịch vụ và xem trước luồng thanh toán online, không cần đăng nhập.',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="space-y-3">
              <div className="font-heading font-black text-2xl sm:text-3xl text-foreground/90">
                {step.num}
              </div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
