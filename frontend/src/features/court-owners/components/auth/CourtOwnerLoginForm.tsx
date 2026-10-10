import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  courtOwnerLoginSchema,
  type CourtOwnerLoginValues,
} from '../../schemas/courtOwnerAuthSchema';
import { useCourtOwnerLoginMutation } from '../../api/useCourtOwnerAuth';
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
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

export function CourtOwnerLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: loginOwner, isPending } = useCourtOwnerLoginMutation();

  const form = useForm<CourtOwnerLoginValues>({
    resolver: zodResolver(courtOwnerLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: CourtOwnerLoginValues) => {
    try {
      setErrorMessage(null);
      await loginOwner({
        email: values.email.trim(),
        password: values.password,
      });

      // Nếu có lưu state chuyển hướng trước đó thì điều hướng tới đó, ngược lại vào cổng quản trị sân
      const redirectPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/owner/orders';
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      // Backend trả về RFC ProblemDetails { title, detail } hoặc Error thông thường
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const displayMsg =
        errorObj?.detail ||
        errorObj?.title ||
        errorObj?.message ||
        'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
      setErrorMessage(displayMsg);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Thông báo lỗi nếu đăng nhập thất bại */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-rose-200">Đăng nhập không thành công:</span>{' '}
            {errorMessage}
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Field Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-200">
                  Email đăng ký Chủ Sân
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

          {/* Field Mật khẩu */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold text-slate-200">
                    Mật khẩu
                  </FormLabel>
                  {/* Link Quên Mật Khẩu */}
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs font-medium text-[#a3e635] hover:text-[#b4f045] hover:underline transition-colors cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 rounded-xl border-border/70 bg-[#0c162c] text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/40 transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400 font-medium" />
              </FormItem>
            )}
          />

          {/* Tuỳ chọn Ghi nhớ tài khoản */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center space-x-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={field.value}
                  onChange={field.onChange}
                  className="size-4 rounded border-border/70 bg-[#0c162c] text-[#a3e635] focus:ring-[#a3e635]/40 accent-[#a3e635] cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-medium text-slate-300 select-none cursor-pointer"
                >
                  Ghi nhớ phiên đăng nhập trên thiết bị này
                </label>
              </div>
            )}
          />

          {/* Nút Đăng nhập chính - Chuẩn phong cách Figma Matchday với shadcn Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11.5 mt-2 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] active:scale-[0.99] rounded-xl shadow-md transition-all cursor-pointer text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4.5 animate-spin text-black" />
                Đang xác thực thông tin...
              </>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Đăng nhập Cổng Chủ Sân <ArrowRight className="size-4 stroke-[2.5]" />
              </span>
            )}
          </Button>
        </form>
      </Form>

      {/* Modal Quên mật khẩu */}
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        defaultEmail={form.getValues('email')}
      />
    </div>
  );
}
