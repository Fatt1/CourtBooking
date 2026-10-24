import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  courtOwnerForgotPasswordSchema,
  type CourtOwnerForgotPasswordValues,
} from '../schemas/courtOwnerAuthSchema';
import { useOwnerForgotPasswordMutation } from '@/api/auth';
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
  Mail,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  KeyRound,
  Trophy,
  Info,
  ShieldCheck,
} from 'lucide-react';

export function CourtOwnerForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { mutateAsync: sendOwnerForgotPassword, isPending } = useOwnerForgotPasswordMutation();

  const form = useForm<CourtOwnerForgotPasswordValues>({
    resolver: zodResolver(courtOwnerForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: CourtOwnerForgotPasswordValues) => {
    try {
      const clientResetUrl = `${window.location.origin}/owner/reset-password`;
      await sendOwnerForgotPassword({
        email: values.email.trim(),
        clientResetUrl,
      });
      setSubmittedEmail(values.email.trim());
      toast.success('Yêu cầu đặt lại mật khẩu đã được gửi!');
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      toast.error(error?.detail || error?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
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
                  <KeyRound className="size-7 text-[#a3e635]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Khôi Phục Mật Khẩu
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Nhập địa chỉ email đăng ký tài khoản Chủ Sân để nhận liên kết thiết lập lại mật khẩu an toàn.
              </p>
            </div>

            {submittedEmail ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 text-xs sm:text-sm space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Đã gửi liên kết khôi phục!</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ thống đã gửi hướng dẫn đặt lại mật khẩu đến <strong className="text-white">{submittedEmail}</strong>.
                    Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và nhấn vào liên kết để đổi mật khẩu.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0c162c] p-3.5 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Info className="size-4 text-[#a3e635]" />
                    <span>Hỗ trợ kỹ thuật khẩn cấp:</span>
                  </div>
                  <p>Hotline: <strong className="text-white">1900-8888</strong> (Nhánh 2 - Đối tác sân)</p>
                  <p>Email: <strong className="text-white">support@courtbooking.vn</strong></p>
                </div>

                <Link to="/owner/login" className="block pt-1">
                  <Button
                    type="button"
                    className="w-full h-11.5 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] rounded-xl shadow-md cursor-pointer text-sm"
                  >
                    Quay lại Đăng nhập Chủ Sân
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Field Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-slate-200">
                          Email đăng ký tài khoản Chủ Sân
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <Input
                              type="email"
                              autoComplete="email"
                              placeholder="chusan@courtbooking.vn"
                              className="h-11 pl-10 pr-3 rounded-xl border-border/70 bg-[#0c162c] text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/40 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400 font-medium" />
                      </FormItem>
                    )}
                  />

                  {/* Nút gửi yêu cầu */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11.5 mt-2 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] active:scale-[0.99] rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4.5 animate-spin text-black" />
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      <span>Gửi liên kết khôi phục</span>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      to="/owner/login"
                      className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="size-3.5 mr-1.5" /> Quay lại Đăng nhập Chủ Sân
                    </Link>
                  </div>
                </form>
              </Form>
            )}

            {/* Card Footer Divider */}
            <div className="mt-7 pt-6 border-t border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">
                Bạn là người chơi thể thao?{' '}
                <Link
                  to="/forgot-password"
                  className="font-semibold text-[#a3e635] hover:text-[#b4f045] hover:underline transition-colors"
                >
                  Khôi phục tài khoản người chơi
                </Link>
              </div>
            </div>
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
