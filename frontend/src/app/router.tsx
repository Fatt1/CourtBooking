import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AdminAuthLayout } from '@/components/layouts/AdminAuthLayout';

// Public Pages
import { HomePage } from '@/features/public/pages/HomePage';


// Admin Pages
import { UsersPage } from '@/features/admin/pages/UsersPage';

// Court Owners / Management Pages
import { OrdersPage } from '@/features/court-owners/pages/OrdersPage';
import { BranchesPage } from '@/features/court-owners/pages/BranchesPage';
import { ServiceCategoriesPage } from '@/features/court-owners/pages/ServiceCategoriesPage';
import { CourtOwnerLoginPage } from '@/features/court-owners/pages/CourtOwnerLoginPage';

// Auth Pages
import { UserLoginPage } from '@/features/auth/pages/UserLoginPage';
import { UserRegisterPage } from '@/features/auth/pages/UserRegisterPage';

export const router = createBrowserRouter([
  // 1. Public Routes (Khách hàng & Người chơi xem trang chủ)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      // Placeholder routes trỏ tạm về HomePage nếu khách click
      { path: '/courts', element: <HomePage /> },
      { path: '/matches', element: <HomePage /> },
      { path: '/events', element: <HomePage /> },
      { path: '/ai-assistant', element: <HomePage /> },
      { path: '/branches/:id', element: <HomePage /> },
    ],
  },

  // 2. Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <UserLoginPage /> },
      { path: '/register', element: <UserRegisterPage /> },
    ],
  },
  // Cổng Đăng nhập Chủ sân & Quản trị
  {
    path: '/owner/login',
    element: <CourtOwnerLoginPage />,
  },
  {
    path: '/admin/login',
    element: <CourtOwnerLoginPage />,
  },

  // 3. Court Owner Portal (Giao diện Chủ sân)
  {
    path: '/owner',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/owner/orders" replace /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'court-status', element: <OrdersPage /> },
      { path: 'courts', element: <OrdersPage /> },
      { path: 'pricing', element: <OrdersPage /> },
      { path: 'service-categories', element: <ServiceCategoriesPage /> },
      { path: 'products', element: <OrdersPage /> },
      { path: 'pos', element: <OrdersPage /> },
      { path: 'wallet', element: <OrdersPage /> },
      { path: 'reports', element: <OrdersPage /> },
      { path: 'packages', element: <OrdersPage /> },
    ],
  },

  // 4. System Admin Portal (Quản trị hệ thống)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/users" replace /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'orders', element: <Navigate to="/owner/orders" replace /> },
      { path: 'branches', element: <Navigate to="/owner/branches" replace /> },
    ],
  },

  // 4. Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
