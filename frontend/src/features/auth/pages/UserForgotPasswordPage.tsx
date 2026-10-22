import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { userForgotPasswordSchema, type UserForgotPasswordValues } from '../schemas/userAuthSchema';
import { useUserForgotPasswordMutation } from '@/api/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export function UserForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { mutateAsync: sendForgotPassword, isPending } = useUserForgotPasswordMutation();

  const form = useForm<UserForgotPasswordValues>({
    resolver: zodResolver(userForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: UserForgotPasswordValues) => {
    try {
      const clientResetUrl = `${window.location.origin}/reset-password`;
      await sendForgotPassword({
        email: values.email,
        clientResetUrl,
      });
      setSubmittedEmail(values.email);
      toast.success('Yêu cầu đặt lại mật khẩu đã được gửi!');
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      toast.error(error?.detail || error?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Quên mật khẩu?
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Nhập email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
        </p>
      </div>

      {submittedEmail ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Đã gửi liên kết khôi phục</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến <strong className="text-foreground">{submittedEmail}</strong>.
              Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và nhấn vào liên kết để tạo mật khẩu mới.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" className="w-full h-10 font-bold rounded-xl cursor-pointer">
                <ArrowLeft className="size-4 mr-2" /> Quay lại Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email đã đăng ký</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="nguyenvan@example.com"
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
              {isPending ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5 mr-1" /> Quay lại Đăng nhập
              </Link>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
