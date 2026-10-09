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

// Auth Pages
import { UserLoginPage } from '@/features/auth/pages/UserLoginPage';
import { UserRegisterPage } from '@/features/auth/pages/UserRegisterPage';
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage';

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
  {
    element: <AdminAuthLayout />,
    children: [
      { path: '/admin/login', element: <AdminLoginPage /> },
    ],
  },

  // 3. Admin / Management Portal
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'orders', element: <OrdersPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },

  // 4. Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
