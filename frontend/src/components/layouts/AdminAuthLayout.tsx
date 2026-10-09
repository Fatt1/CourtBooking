import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export function AdminAuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Về trang chủ</span>
          </Link>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            Cổng Quản Trị Hệ Thống
          </span>
        </div>

        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">CourtBooking Management</h2>
          <p className="mt-1 text-xs text-slate-400">
            Dành cho Quản trị viên sàn SaaS, Chủ cơ sở sân và Nhân viên vận hành
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur">
          <Outlet />
        </div>

        <div className="text-center text-xs text-slate-500">
          Hệ thống ghi nhận địa chỉ IP truy cập phục vụ an toàn thông tin
        </div>
      </div>
    </div>
  );
}
