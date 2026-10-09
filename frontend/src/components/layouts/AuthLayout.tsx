import { Outlet, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-black text-2xl text-primary">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Dumbbell className="size-6" />
            </div>
            <span className="text-foreground">Court<span className="text-primary">Booking</span></span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Đặt sân nhanh chóng, tiện lợi qua VietQR
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
          <Outlet />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.
        </p>
      </div>
    </div>
  );
}
