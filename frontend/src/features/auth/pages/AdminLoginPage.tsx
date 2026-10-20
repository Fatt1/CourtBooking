import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { isJwtValid, getJwtRoles } from '@/lib/jwt';
import { AdminLoginForm } from '../components/AdminLoginForm';
import {
  ShieldCheck,
  ArrowLeft,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export function AdminLoginPage() {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const location = useLocation();

  // Tự động chuyển hướng nếu đã đăng nhập quyền Admin
  if (isAuthenticated && isJwtValid(accessToken)) {
    const roles = new Set<string>();
    if (user?.role) roles.add(user.role);
    getJwtRoles(accessToken).forEach((r) => roles.add(r));

    if (roles.has('Admin') || roles.has('SystemAdmin')) {
      const redirectPath =
        (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#070b09] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-black font-sans">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 size-96 rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <div className="size-8 rounded-xl bg-[#0f1713] border border-[#1b2b22] flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform text-emerald-400" />
          </div>
          <span>Về trang chủ</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Cổng Quản Trị Hệ Thống CourtOS
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Branding & Feature Highlights */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#0f1713] border border-[#1b2b22] px-3.5 py-1.5 text-xs text-zinc-300">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Trung tâm Điều Hành & Quản Trị CourtOS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Quản trị hệ thống <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  toàn diện & an toàn.
                </span>
              </h1>
              <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                Kiểm soát toàn bộ người dùng, đối tác chủ sân, gói cước dịch vụ và danh mục môn thể thao đa phân hệ trên một nền tảng quản trị tối cao.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 rounded-2xl bg-[#0f1713]/80 border border-[#1b2b22] p-3.5 backdrop-blur-md">
                <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Activity className="size-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Giám sát & Vận hành thời gian thực</h4>
                  <p className="text-[11px] text-zinc-400">Kiểm soát hoạt động người dùng và đối soát số liệu hệ thống tức thì.</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-[#0f1713]/80 border border-[#1b2b22] p-3.5 backdrop-blur-md">
                <div className="size-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Layers className="size-5 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Quản lý Môn Thể Thao & Gói Cước</h4>
                  <p className="text-[11px] text-zinc-400">Chuẩn hóa danh mục môn thể thao và mô hình SaaS toàn quốc.</p>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 pt-1">
              <Sparkles className="size-4 text-emerald-400 shrink-0" />
              <span>Chính sách bảo mật dữ liệu chuẩn mã hóa AES-256</span>
            </div>
          </div>

          {/* Right Column: Login Card Form */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-[#1b2b22] bg-[#0c1410]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative">
              {/* Card Header */}
              <div className="mb-7 text-center">
                <div className="mx-auto size-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center mb-4">
                  <div className="size-full bg-[#0c1410] rounded-[14px] flex items-center justify-center">
                    <ShieldCheck className="size-7 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Đăng Nhập Quản Trị
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                  Dành riêng cho Quản trị viên hệ sinh thái sàn SaaS CourtOS.
                </p>
              </div>

              {/* Form Component */}
              <AdminLoginForm />

              {/* Card Footer Divider */}
              <div className="mt-7 pt-6 border-t border-[#1b2b22] text-center space-y-2">
                <div className="text-xs text-zinc-400">
                  Bạn là đối tác quản lý cụm sân?{' '}
                  <Link
                    to="/owner/login"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  >
                    Đăng nhập Cổng Chủ Sân
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Security Note */}
            <p className="mt-4 text-center text-[11px] text-zinc-500">
              Hệ thống bảo vệ truy cập đa lớp • CourtOS Security Firewall
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-zinc-500">
        © 2026 CourtOS Administration. Nền tảng quản trị hạ tầng thể thao trực tuyến.
      </footer>
    </div>
  );
}
