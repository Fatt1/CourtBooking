
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useUserForgotPasswordMutation } from '@/api/auth';
import { toast } from 'sonner';

interface UserForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function UserForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = '',
}: UserForgotPasswordDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);
  const { mutateAsync: sendForgotPassword, isPending } = useUserForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    try {
      const clientResetUrl = `${window.location.origin}/reset-password`;
      await sendForgotPassword({
        email: cleanEmail,
        clientResetUrl,
      });
      setSubmitted(true);
      toast.success('Yêu cầu đặt lại mật khẩu đã được gửi!');
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      toast.error(error?.detail || error?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setEmail(defaultEmail);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[92vw] max-w-md rounded-2xl border border-border/80 bg-card p-6 text-foreground shadow-2xl sm:p-7">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Quên mật khẩu?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Nhập email tài khoản của bạn để nhận liên kết đặt lại mật khẩu.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-3 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>Kiểm tra hòm thư của bạn</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chúng tôi đã gửi đường dẫn đặt lại mật khẩu tới email <strong className="text-foreground">{email}</strong>.
                Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam/Quảng cáo).
              </p>
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="w-full h-10 font-bold rounded-xl cursor-pointer"
            >
              Quay lại Đăng nhập
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="user-forgot-email" className="text-xs font-semibold text-foreground">
                Email tài khoản đã đăng ký
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvan@example.com"
                  className="pl-10 h-11 rounded-xl"
                  disabled={isPending}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hệ thống sẽ gửi một liên kết an toàn có thời hạn để bạn thiết lập mật khẩu mới.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="h-10 rounded-xl px-4 text-sm font-semibold"
              >
                <ArrowLeft className="size-4 mr-1.5" /> Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending || !email.trim()}
                className="h-10 rounded-xl px-5 text-sm font-bold shadow-sm"
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isPending ? 'Đang gửi...' : 'Gửi liên kết'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
