import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { userResetPasswordSchema, type UserResetPasswordValues } from '../schemas/userAuthSchema';
import { useUserResetPasswordMutation, useOwnerResetPasswordMutation } from '@/api/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

export function UserResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const role = searchParams.get('role') || 'player';

  const [isSuccess, setIsSuccess] = useState(false);

  const { mutateAsync: resetUserPassword, isPending: isUserPending } = useUserResetPasswordMutation();
  const { mutateAsync: resetOwnerPassword, isPending: isOwnerPending } = useOwnerResetPasswordMutation();
  const isPending = isUserPending || isOwnerPending;

  const form = useForm<UserResetPasswordValues>({
    resolver: zodResolver(userResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: UserResetPasswordValues) => {
    if (!email || !token) {
      toast.error('Thiếu thông tin xác thực từ đường link. Vui lòng thử lại!');
      return;
    }

    try {
      const payload = {
        email,
        token,
        newPassword: values.password,
      };

      if (role === 'owner') {
        await resetOwnerPassword(payload);
      } else {
        await resetUserPassword(payload);
      }

      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      toast.error(error?.detail || error?.message || 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.');
    }
  };

  const loginRedirectPath = role === 'owner' ? '/owner/login' : '/login';

  // Trường hợp thiếu email hoặc token trong URL
  if (!email || !token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Đường dẫn không hợp lệ
        </h2>
        <p className="text-xs text-muted-foreground">
          Liên kết đặt lại mật khẩu của bạn bị thiếu thông tin xác thực hoặc đã hết hạn. Vui lòng gửi lại yêu cầu để nhận mã mới.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link to="/forgot-password">
            <Button className="w-full h-10 font-bold rounded-xl cursor-pointer">
              Gửi lại yêu cầu khôi phục
            </Button>
          </Link>
          <Link to={loginRedirectPath}>
            <Button variant="ghost" className="w-full h-10 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5 mr-1" /> Quay về Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Thiết lập mật khẩu mới
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Tài khoản: <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Đổi mật khẩu thành công!</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mật khẩu mới đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate(loginRedirectPath)}
            className="w-full h-10 font-bold rounded-xl cursor-pointer"
          >
            Đăng nhập ngay
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-10" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to={loginRedirectPath}
                className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5 mr-1" /> Hủy và quay lại Đăng nhập
              </Link>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
