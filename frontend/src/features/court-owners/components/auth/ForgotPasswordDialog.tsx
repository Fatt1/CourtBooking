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
import { Mail, CheckCircle2, Info, ArrowLeft } from 'lucide-react';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

/**
 * Modal Quên mật khẩu dành cho Chủ sân (Court Owner).
 * Lưu ý: Hiện tại chưa gọi API thực tế, hiển thị giao diện mẫu và thông báo hướng dẫn.
 */
export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = '',
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Chưa cần call API - ghi nhận và hiển thị thông báo hướng dẫn cho Chủ sân
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state sau khi đóng modal
    setTimeout(() => {
      setSubmitted(false);
      setEmail(defaultEmail);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[92vw] max-w-md rounded-2xl border border-border/70 bg-[#0B1324] p-6 text-foreground shadow-2xl backdrop-blur-xl sm:p-7">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Khôi phục mật khẩu Chủ sân
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-400">
            Nhận hướng dẫn đặt lại mật khẩu cho tài khoản quản lý cụm sân của bạn.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-4 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>Yêu cầu đã được ghi nhận</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống xác thực tài khoản Chủ sân cho email <strong className="text-white">{email}</strong>.
                Tính năng gửi email tự động đang được kích hoạt. Bạn cũng có thể liên hệ trực tiếp Ban Quản trị Matchday để được hỗ trợ cấp lại ngay.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-[#131d31] p-3.5 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Info className="size-4 text-[#a3e635]" />
                <span>Hỗ trợ kỹ thuật khẩn cấp:</span>
              </div>
              <p>Hotline: <strong className="text-white">1900-8888</strong> (Nhánh 2 - Đối tác sân)</p>
              <p>Email: <strong className="text-white">support@courtbooking.vn</strong></p>
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="w-full h-11 bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] rounded-xl cursor-pointer"
            >
              Quay lại Đăng nhập
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-xs font-semibold text-slate-300">
                Email đăng ký tài khoản Chủ sân
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chusan@courtbooking.vn"
                  className="pl-10 h-11 rounded-xl border-border/70 bg-[#131d31] text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/50"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Chúng tôi sẽ hướng dẫn các bước xác minh và tạo mật khẩu mới.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 rounded-xl border-border/60 bg-[#131d31] px-5 text-sm font-semibold text-white hover:bg-[#1a2742]"
              >
                <ArrowLeft className="size-4 mr-1.5" /> Hủy
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-[#a3e635] px-6 text-sm font-bold text-black hover:bg-[#8ece28] shadow-sm cursor-pointer"
              >
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
