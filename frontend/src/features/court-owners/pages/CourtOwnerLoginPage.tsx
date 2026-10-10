import { Link } from 'react-router-dom';
import { CourtOwnerLoginForm } from '../components/auth/CourtOwnerLoginForm';
import {
  Trophy,
  ArrowLeft,
  CalendarCheck2,
  TrendingUp,
  Headphones,
} from 'lucide-react';

export function CourtOwnerLoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#060B17] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-[#a3e635] selection:text-black">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-[#a3e635]/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 size-96 rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Về trang chủ</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1 text-xs font-semibold text-[#a3e635]">
            <span className="size-1.5 rounded-full bg-[#a3e635] animate-pulse" />
            Cổng Quản Trị Chủ Sân
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Branding & Feature Highlights (Hidden on small screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-300">
                <Trophy className="size-4 text-[#a3e635]" />
                <span>Hệ sinh thái thể thao Matchday.</span>
              </div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Quản lý sân bãi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] via-emerald-400 to-teal-300">
                  thông minh & hiệu quả.
                </span>
              </h1>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                Tối ưu hóa lịch đặt sân, theo dõi doanh thu thời gian thực, quản lý dịch vụ và vận hành cụm sân đa chi nhánh trên một nền tảng duy nhất.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 backdrop-blur-md">
                <div className="size-10 rounded-xl bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="size-5 text-[#a3e635]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Lưới lịch trực quan 24/7</h4>
                  <p className="text-[11px] text-slate-400">Kiểm soát tình trạng trống/bận theo từng khung giờ và loại sân.</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 backdrop-blur-md">
                <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="size-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Đối soát & Doanh thu tự động</h4>
                  <p className="text-[11px] text-slate-400">Tích hợp VietQR động, duyệt đơn và xuất báo cáo tài chính chuẩn xác.</p>
                </div>
              </div>
            </div>

            {/* Support Hotline Info */}
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
              <div className="size-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Headphones className="size-4 text-[#a3e635]" />
              </div>
              <div>
                <span>Cần hỗ trợ đăng ký đối tác mới? </span>
                <span className="font-semibold text-white">Hotline: 1900-8888</span>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card Form */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-slate-800/90 bg-[#0B1324]/90 p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative">
              {/* Header inside Form Card */}
              <div className="mb-7 text-center">
                <div className="mx-auto size-13 rounded-2xl bg-gradient-to-tr from-[#a3e635] to-emerald-400 p-0.5 shadow-lg shadow-[#a3e635]/20 flex items-center justify-center mb-4">
                  <div className="size-full bg-[#0B1324] rounded-[14px] flex items-center justify-center">
                    <Trophy className="size-7 text-[#a3e635]" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Đăng Nhập Chủ Sân
                </h2>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Đăng nhập bằng tài khoản Quản trị cơ sở được cấp để tiếp tục vận hành.
                </p>
              </div>

              {/* Form Component */}
              <CourtOwnerLoginForm />

              {/* Card Footer Divider */}
              <div className="mt-7 pt-6 border-t border-slate-800/80 text-center space-y-3">
                <div className="text-xs text-slate-400">
                  Bạn là người chơi thể thao?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-[#a3e635] hover:text-[#b4f045] hover:underline transition-colors"
                  >
                    Đăng nhập cổng người chơi
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Security Note */}
            <p className="mt-4 text-center text-[11px] text-slate-500">
              Hệ thống được mã hóa an toàn SSL 256-bit • Matchday Partner Network
            </p>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-slate-500">
        © 2026 Matchday CourtBooking. Nền tảng quản lý cụm sân thể thao hàng đầu Việt Nam.
      </footer>
    </div>
  );
}
