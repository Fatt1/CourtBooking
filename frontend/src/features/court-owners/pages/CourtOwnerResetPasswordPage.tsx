import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  courtOwnerResetPasswordSchema,
  type CourtOwnerResetPasswordValues,
} from '../schemas/courtOwnerAuthSchema';
import { useOwnerResetPasswordMutation } from '@/api/auth';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Trophy,
} from 'lucide-react';

export function CourtOwnerResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutateAsync: resetOwnerPassword, isPending } = useOwnerResetPasswordMutation();

  const form = useForm<CourtOwnerResetPasswordValues>({
    resolver: zodResolver(courtOwnerResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: CourtOwnerResetPasswordValues) => {
    if (!email || !token) {
      toast.error('Thiếu thông tin xác thực từ đường link. Vui lòng thử lại!');
      return;
    }

    try {
      await resetOwnerPassword({
        email,
        token,
        newPassword: values.password,
      });

      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu Chủ sân thành công!');
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      toast.error(
        error?.detail ||
          error?.message ||
          'Không thể đặt lại mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.'
      );
    }
  };

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
          to="/owner/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <div className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Quay lại đăng nhập</span>
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
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-3xl border border-slate-800/90 bg-[#0B1324]/90 p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative">
            {/* Header inside Card */}
            <div className="mb-7 text-center">
              <div className="mx-auto size-13 rounded-2xl bg-gradient-to-tr from-[#a3e635] to-emerald-400 p-0.5 shadow-lg shadow-[#a3e635]/20 flex items-center justify-center mb-4">
                <div className="size-full bg-[#0B1324] rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="size-7 text-[#a3e635]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Thiết Lập Mật Khẩu Mới
              </h2>
              {email && (
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Tài khoản: <strong className="text-[#a3e635] font-semibold">{email}</strong>
                </p>
              )}
            </div>

            {/* Trường hợp thiếu email hoặc token trong URL */}
            {!email || !token ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Đường dẫn không hợp lệ
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Liên kết đặt lại mật khẩu của bạn bị thiếu thông tin xác thực hoặc đã hết hạn. Vui lòng gửi lại yêu cầu để nhận liên kết mới.
                </p>
                <div className="pt-2 flex flex-col gap-2.5">
                  <Link to="/owner/forgot-password">
                    <Button className="w-full h-11 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] rounded-xl cursor-pointer text-xs">
                      Gửi lại yêu cầu khôi phục
                    </Button>
                  </Link>
                  <Link to="/owner/login">
                    <Button variant="ghost" className="w-full h-11 text-xs text-slate-400 hover:text-white">
                      <ArrowLeft className="size-3.5 mr-1" /> Quay về Đăng nhập
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 text-xs sm:text-sm space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Đổi mật khẩu thành công!</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mật khẩu quản trị Chủ Sân của bạn đã được cập nhật an toàn. Bây giờ bạn có thể đăng nhập vào hệ thống quản lý bằng mật khẩu mới.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate('/owner/login', { replace: true })}
                  className="w-full h-11.5 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] rounded-xl shadow-md cursor-pointer text-sm"
                >
                  Đăng nhập Cổng Chủ Sân ngay
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Field Mật khẩu mới */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-slate-200">
                          Mật khẩu mới
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Tối thiểu 6 ký tự"
                              className="h-11 pl-10 pr-10 rounded-xl border-border/70 bg-[#0c162c] text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/40 transition-colors"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400 font-medium" />
                      </FormItem>
                    )}
                  />

                  {/* Field Xác nhận mật khẩu mới */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-slate-200">
                          Xác nhận mật khẩu mới
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Nhập lại mật khẩu mới"
                              className="h-11 pl-10 pr-10 rounded-xl border-border/70 bg-[#0c162c] text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/40 transition-colors"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400 font-medium" />
                      </FormItem>
                    )}
                  />

                  {/* Nút submit */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11.5 mt-2 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] active:scale-[0.99] rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4.5 animate-spin text-black" />
                        Đang cập nhật mật khẩu...
                      </>
                    ) : (
                      <span>Cập nhật mật khẩu mới</span>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      to="/owner/login"
                      className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="size-3.5 mr-1.5" /> Hủy và quay lại Đăng nhập
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Hệ thống được mã hóa an toàn SSL 256-bit • Matchday Partner Network
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-slate-500">
        © 2026 Matchday CourtBooking. Nền tảng quản lý cụm sân thể thao hàng đầu Việt Nam.
      </footer>
    </div>
  );
}
