import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function CourtsHeader() {
  return (
    <div className="space-y-4 pb-6 border-b border-border/50">
      {/* Breadcrumb back to Home */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="size-3.5" />
        <span>Trang chủ</span>
      </Link>

      <div className="space-y-1.5">
        {/* Green Tagline */}
        <div className="font-heading font-bold text-xs tracking-widest uppercase text-[#397B48]">
          TÌM ĐÚNG SÂN, VÀO TRẬN NHANH
        </div>

        {/* Main Title */}
        <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-foreground leading-[1.1]">
          SÂN PHÙ HỢP VỚI LỊCH CỦA BẠN
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-sm sm:text-base font-normal">
          Ngày linh hoạt quanh bạn. Dữ liệu sân theo thời gian thực từ chủ sân.
        </p>
      </div>
    </div>
  );
}
