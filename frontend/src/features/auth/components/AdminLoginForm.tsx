import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLoginSchema, type AdminLoginValues } from '../schemas/adminAuthSchema';
import { useAdminLoginMutation } from '@/api/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';

export function AdminLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync: adminLogin, isPending } = useAdminLoginMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const onSubmit = async (values: AdminLoginValues) => {
    setErrorMessage(null);
    try {
      await adminLogin({
        email: values.usernameOrEmail,
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
      });

      const redirectPath =
        (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const msg =
        errorObj?.detail ||
        errorObj?.title ||
        errorObj?.message ||
        'Email hoặc mật khẩu quản trị không chính xác.';
      setErrorMessage(msg);
    }
  };

  // Nút hỗ trợ điền nhanh tài khoản Admin mặc định
  const handleQuickFill = () => {
    form.setValue('usernameOrEmail', 'admin@courtbooking.com', { shouldValidate: true });
    form.setValue('password', 'Admin@123456', { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      {/* Thông báo lỗi nếu đăng nhập thất bại */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
          <span className="font-semibold shrink-0">Lỗi:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 1. Email / Tên đăng nhập */}
          <FormField
            control={form.control}
            name="usernameOrEmail"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-zinc-300">
                  Email / Tên tài khoản quản trị <span className="text-rose-400">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <input
                      type="text"
                      className="w-full h-11 rounded-xl bg-[#111915] border border-[#1d2c23] pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      placeholder="admin@courtbooking.com"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          {/* 2. Mật khẩu */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-zinc-300">
                  Mật khẩu hệ thống <span className="text-rose-400">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-11 rounded-xl bg-[#111915] border border-[#1d2c23] pl-10 pr-11 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      placeholder="••••••••"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />



          {/* Nút Đăng nhập Quản trị */}
          <Button
            type="submit"
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer mt-2 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin text-slate-950" />}
            {isPending ? 'Đang xác thực hệ thống...' : 'Đăng nhập CourtOS Console'}
          </Button>

          {/* Nút điền nhanh tài khoản Admin */}
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-[#1d2c23] hover:border-emerald-500/40 bg-[#111915]/60 hover:bg-[#111915] text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="size-3 text-emerald-400" />
            <span>Điền nhanh tài khoản Admin mẫu (admin@courtbooking.com)</span>
          </button>
        </form>
      </Form>
    </div>
  );
}
