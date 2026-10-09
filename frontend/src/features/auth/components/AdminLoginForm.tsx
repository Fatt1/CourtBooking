import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { adminLoginSchema, type AdminLoginValues } from '../schemas/adminAuthSchema';
import { useAdminLoginMutation } from '../api/useAdminAuth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound } from 'lucide-react';

export function AdminLoginForm() {
  const navigate = useNavigate();
  const { mutateAsync: adminLogin, isPending } = useAdminLoginMutation();

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      twoFactorCode: '',
    },
  });

  const onSubmit = async (values: AdminLoginValues) => {
    try {
      await adminLogin(values);
      navigate('/admin');
    } catch {
      // Handled
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="usernameOrEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Tài khoản / Email quản trị</FormLabel>
              <FormControl>
                <Input
                  className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500"
                  placeholder="admin@courtbooking.vn hoặc owner_account"
                  {...field}
                />
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
              <FormLabel className="text-slate-200">Mật khẩu</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twoFactorCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-emerald-400" />
                <FormLabel className="text-slate-200">Mã 2FA / OTP (Tùy chọn)</FormLabel>
              </div>
              <FormControl>
                <Input
                  maxLength={6}
                  className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 tracking-widest font-mono text-center"
                  placeholder="123456"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 mt-2"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isPending ? 'Đang xác thực hệ thống...' : 'Đăng nhập Quản Trị'}
        </Button>
      </form>
    </Form>
  );
}
