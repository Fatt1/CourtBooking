import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface UrgentExpiringCardProps {
  expiringCount?: number;
}

export function UrgentExpiringCard({ expiringCount = 2 }: UrgentExpiringCardProps) {
  return (
    <div className="rounded-2xl border border-[#1a3828] bg-[#0f2218] p-5 md:p-6 flex flex-col justify-between shadow-md shadow-emerald-950/20">
      <div>
        {/* 1. Header Label */}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Cần chú ý
        </span>

        {/* 2. Amber Warning Icon */}
        <div className="mt-3.5 size-9 rounded-xl bg-[#261e11] border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
          <Clock className="size-4 stroke-[2.2]" />
        </div>

        {/* 3. Title & Description */}
        <h3 className="mt-3.5 text-sm font-bold text-white tracking-tight">
          {expiringCount} gói đăng ký sắp hết hạn
        </h3>

        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
          Các chủ sân có gói dịch vụ hết hạn trong 7 ngày tới. Kiểm tra để đảm bảo hoạt động liên tục.
        </p>
      </div>

      {/* 4. Bottom Link */}
      <div className="mt-5 pt-3 border-t border-[#1a3828]">
        <Link
          to="/admin/subscriptions?status=expiring"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors inline-flex items-center gap-1 group"
        >
          <span>Xem danh sách đăng ký</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
