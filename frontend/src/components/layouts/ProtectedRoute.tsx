import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

export function ProtectedRoute({
  allowedRoles = ['SystemAdmin', 'CourtOwner', 'Staff'],
  redirectPath = '/admin/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Nếu là Player cố truy cập Admin -> Chuyển về trang chủ
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
