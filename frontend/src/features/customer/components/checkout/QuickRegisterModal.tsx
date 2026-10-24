import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  LogIn,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { useUserRegisterMutation, useUserLoginMutation } from '@/api/auth/useAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { getApiErrorMessage } from '@/types/api';
import { toast } from 'sonner';
import {
  quickRegisterSchema,
  type QuickRegisterValues,
} from '../../schemas/checkoutSchema';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFullName: string;
  initialPhone: string;
  initialEmail?: string;
  onSuccess: () => void;
  onGoToLogin: () => void;
}

export function QuickRegisterModal({
  isOpen,
  onClose,
  initialFullName,
  initialPhone,
  initialEmail = '',
  onSuccess,
  onGoToLogin,
}: QuickRegisterModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<QuickRegisterValues>({
    resolver: zodResolver(quickRegisterSchema),
    defaultValues: {
      fullName: initialFullName || '',
      phoneNumber: initialPhone || '',
      email: initialEmail || '',
      password: '',
    },
  });

  // Sync khi initial props thay đổi và khi mở dialog
  useEffect(() => {
    if (isOpen) {
      form.reset({
        fullName: initialFullName || '',
        phoneNumber: initialPhone || '',
        email: initialEmail || '',
        password: '',
      });
      setErrorMessage(null);
      setShowPassword(false);
    }
  }, [isOpen, initialFullName, initialPhone, initialEmail, form]);

  const registerMutation = useUserRegisterMutation();
  const loginMutation = useUserLoginMutation();

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const onSubmit = async (values: QuickRegisterValues) => {
    setErrorMessage(null);

    const trimmedName = values.fullName.trim();
    const cleanedPhone = values.phoneNumber.replace(/[\s.-]/g, '');
    const trimmedEmail = values.email.trim();

    try {
      // 1. Đăng ký tài khoản người chơi mới
      await registerMutation.mutateAsync({
        fullName: trimmedName,
        phoneNumber: cleanedPhone,
        email: trimmedEmail,
        password: values.password,
        gender: 0,
      });

      // 2. Tự động đăng nhập ngay sau khi đăng ký thành công
      await loginMutation.mutateAsync({
        email: trimmedEmail,
        password: values.password,
      });

      // Đảm bảo lưu thông tin số điện thoại vào auth store
      useAuthStore.getState().updateUser({
        phoneNumber: cleanedPhone,
        name: trimmedName,
        email: trimmedEmail,
      });

      toast.success('Đăng ký tài khoản thành công! Đang tiến hành tạo đơn đặt sân...');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const detail = getApiErrorMessage(err, 'Đăng ký tài khoản không thành công. Vui lòng thử lại!');
      setErrorMessage(detail);
      toast.error(detail);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="size-11 rounded-2xl bg-[#397B48]/10 text-[#397B48] flex items-center justify-center mb-1">
            <UserPlus className="size-6" />
          </div>
          <DialogTitle className="font-heading font-black text-xl text-foreground">
            Đăng ký tài khoản nhanh
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Hệ thống yêu cầu tài khoản để giữ chỗ và cập nhật trạng thái lịch đặt. Vui lòng hoàn tất thông tin để tiếp tục đặt sân!
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs mt-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{errorMessage}</span>
              {(errorMessage.toLowerCase().includes('email') ||
                errorMessage.toLowerCase().includes('đăng nhập')) && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={onGoToLogin}
                    className="font-bold underline text-[#397B48] hover:text-[#2d6339] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <LogIn className="size-3" />
                    <span>Đã có tài khoản? Đăng nhập ngay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 pt-2">
            {/* Họ và tên */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Họ và tên</span>
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        className="pl-9 rounded-xl border-border/70 text-xs focus-visible:ring-1 focus-visible:ring-[#397B48]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Số điện thoại */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Số điện thoại</span>
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="0912 345 678"
                        className="pl-9 rounded-xl border-border/70 text-xs focus-visible:ring-1 focus-visible:ring-[#397B48]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Email</span>
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        className="pl-9 rounded-xl border-border/70 text-xs focus-visible:ring-1 focus-visible:ring-[#397B48]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                  <p className="text-[11px] text-muted-foreground">
                    Mỗi email chỉ được sử dụng cho một tài khoản duy nhất.
                  </p>
                </FormItem>
              )}
            />

            {/* Mật khẩu */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Mật khẩu</span>
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        className="pl-9 pr-9 rounded-xl border-border/70 text-xs focus-visible:ring-1 focus-visible:ring-[#397B48]"
                        disabled={isSubmitting}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Link chuyển sang đăng nhập */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đã có tài khoản?</span>
              <button
                type="button"
                onClick={onGoToLogin}
                disabled={isSubmitting}
                className="font-bold text-[#397B48] hover:text-[#2d6339] inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <LogIn className="size-3.5" />
                <span>Đăng nhập ngay</span>
              </button>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#397B48] hover:bg-[#2d6339] text-white rounded-xl text-xs font-bold gap-2 px-4 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Đăng ký & Đặt sân</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
