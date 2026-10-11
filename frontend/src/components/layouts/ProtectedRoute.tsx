import { ReactNode, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { isJwtValid, getJwtRoles } from '@/lib/jwt';
import { refreshAccessToken } from '@/lib/auth-service';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
  children?: ReactNode;
}

export function ProtectedRoute({
  allowedRoles = ['CourtOwner', 'Admin'],
  redirectPath = '/owner/login',
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const location = useLocation();

  // Kiểm tra tính hợp lệ của token hiện tại
  const hasValidJwt = isJwtValid(accessToken);

  // Quản lý trạng thái làm mới Token ngầm (Silent Refresh)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(() => {
    // Nếu có cờ đăng nhập nhưng JWT đã hết hạn hoặc rỗng -> Bật cờ refresh ngay từ render đầu tiên
    return isAuthenticated && !hasValidJwt;
  });
  const [refreshFailed, setRefreshFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Nếu người dùng từng đăng nhập (isAuthenticated = true) nhưng access token hiện tại đã hết hạn
    if (isAuthenticated && !hasValidJwt && !refreshFailed) {
      setIsRefreshing(true);
      refreshAccessToken()
        .then((newToken) => {
          if (!isMounted) return;
          if (!newToken) {
            setRefreshFailed(true);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setRefreshFailed(true);
        })
        .finally(() => {
          if (isMounted) setIsRefreshing(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, hasValidJwt, refreshFailed]);

  // 1. Nếu chưa từng đăng nhập hoặc đã thử refresh token nhưng thất bại (Refresh Token cũng hết hạn/thu hồi)
  if (!isAuthenticated || refreshFailed) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 2. Nếu JWT hết hạn nhưng đang trong tiến trình tự động Refresh Token ngầm
  if (isRefreshing || (!hasValidJwt && isAuthenticated)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="relative flex items-center justify-center">
          <div className="size-10 rounded-full border-2 border-[#a3e635]/20 border-t-[#a3e635] animate-spin" />
          <Loader2 className="absolute size-4 text-[#a3e635] animate-pulse" />
        </div>
      </div>
    );
  }

  // 3. Kiểm tra vai trò (Role)
  // Lấy danh sách roles từ user profile trong store kết hợp claims trong JWT token
  const jwtRoles = getJwtRoles(accessToken);
  const currentRoles = new Set<string>();
  if (user?.role) currentRoles.add(user.role);
  jwtRoles.forEach((r) => currentRoles.add(r));

  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => currentRoles.has(role));

    if (!hasRequiredRole) {
      // Đã đăng nhập nhưng không đủ quyền (ví dụ Player cố truy cập cổng Owner/Admin)
      toast.error('Bạn không có quyền truy cập vào cổng quản trị này.');
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * Route Guard chuyên biệt dành riêng cho Cổng Chủ Sân (Court Owner Portal)
 * Yêu cầu:
 * - Đã đăng nhập và sở hữu JWT Token hợp lệ (tự động gia hạn qua Refresh Token nếu hết hạn)
 * - Có vai trò 'CourtOwner' (hoặc 'Admin' quản trị cấp cao)
 * - Nếu chưa đăng nhập: Tự động chuyển hướng về /owner/login kèm state location
 * - Nếu không đúng vai trò (ví dụ: Player): Từ chối và chuyển về trang chủ
 */
export function OwnerProtectedRoute({ children }: { children?: ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={['CourtOwner', 'Admin']}
      redirectPath="/owner/login"
    >
      {children}
    </ProtectedRoute>
  );
}

