import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 py-10 text-xs text-muted-foreground bg-background">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Brand + Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
          <Link
            to="/"
            className="font-heading font-black text-2xl tracking-normal text-foreground"
          >
            Matchday<span className="text-[#397B48]">.</span>
          </Link>
          <span className="hidden sm:inline-block text-border">|</span>
          <p className="text-muted-foreground font-medium">
            Tìm đúng sân. Gặp đúng người. Chơi đúng giờ.
          </p>
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-6 font-medium text-foreground/80">
          <a href="#" className="hover:text-foreground transition-colors">Hỗ trợ</a>
          <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
          <a href="#" className="hover:text-foreground transition-colors">Quyền riêng tư</a>
        </div>
      </div>
    </footer>
  );
}
