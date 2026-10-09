import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { userLoginSchema, type UserLoginValues } from '../schemas/userAuthSchema';
import { useUserLoginMutation } from '../api/useUserAuth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function UserLoginForm() {
  const navigate = useNavigate();
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
      navigate('/');
    } catch {
      // Form handles or toast will alert
    }
  };

  return (
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
                <a href="#" className="text-xs text-primary hover:underline">
                  Quên mật khẩu?
                </a>
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
  );
}
