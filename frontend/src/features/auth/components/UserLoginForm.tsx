import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { userLoginSchema, type UserLoginValues } from '../schemas/userAuthSchema';
import { useUserLoginMutation } from '@/api/auth';
import { getApiErrorMessage } from '@/types/api';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { UserForgotPasswordDialog } from './UserForgotPasswordDialog';

export function UserLoginForm() {
  const navigate = useNavigate();
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { mutateAsync: login, isPending } = useUserLoginMutation();

  const form = useForm<UserLoginValues>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: UserLoginValues) => {
    try {
      await login(values);
      toast.success('Đăng nhập thành công!');
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Email hoặc mật khẩu không chính xác!'));
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email đăng nhập</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="nguyenvan@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mật khẩu</FormLabel>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0 font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isPending ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Chưa có tài khoản người chơi?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </Form>

      <UserForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        defaultEmail={form.getValues('email')}
      />
    </>
  );
}
