export function CommunityProofSection() {
  return (
    <section className="py-12 sm:py-16 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading */}
          <div className="lg:col-span-6 space-y-2">
            <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-[#397B48]">
              CỘNG ĐỒNG THẬT, TRẬN ĐẤU THẬT
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-normal sm:tracking-wide text-foreground leading-tight max-w-md">
              Chơi đều hơn khi luôn có người cùng sân.
            </h2>
          </div>

          {/* Right Column: Quote */}
          <div className="lg:col-span-6 border-l-2 border-foreground/20 pl-6 sm:pl-8 py-2">
            <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
              &ldquo;Nhóm mình thiếu người sát giờ. Đăng kèo xong khoảng 20 phút là đủ đội.&rdquo;
            </p>
            <p className="text-xs text-muted-foreground font-semibold mt-3">
              Minh Khoa · Người chơi bóng đá tại Thủ Đức
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
