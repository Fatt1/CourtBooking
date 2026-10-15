import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { OwnerLayout } from '@/components/layouts/OwnerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ProtectedRoute, OwnerProtectedRoute } from '@/components/layouts/ProtectedRoute';

// Customer / Public Pages
import { HomePage } from '@/features/customer/pages/HomePage';


// Admin Pages
import { UsersPage } from '@/features/admin/pages/UsersPage';
import { SportTypesPage } from '@/features/admin/pages/SportTypesPage';

// Court Owners / Management Pages
import { OrdersPage } from '@/features/court-owners/pages/OrdersPage';
import { BranchesPage } from '@/features/court-owners/pages/BranchesPage';
import { CourtTypesPage } from '@/features/court-owners/pages/CourtTypesPage';
import { CourtsPage } from '@/features/court-owners/pages/CourtsPage';
import { ServiceCategoriesPage } from '@/features/court-owners/pages/ServiceCategoriesPage';
import { PricingPage } from '@/features/court-owners/pages/PricingPage';
import { CourtOwnerLoginPage } from '@/features/court-owners/pages/CourtOwnerLoginPage';

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
  // Cổng Đăng nhập Chủ sân & Quản trị
  {
    path: '/owner/login',
    element: <CourtOwnerLoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },

  // 3. Court Owner Portal (Giao diện Chủ sân - Bảo vệ bằng JWT & Role CourtOwner)
  {
    path: '/owner',
    element: (
      <OwnerProtectedRoute>
        <OwnerLayout />
      </OwnerProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/owner/orders" replace /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'court-status', element: <OrdersPage /> },
      { path: 'courts', element: <CourtsPage /> },
      { path: 'court-types', element: <CourtTypesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'service-categories', element: <ServiceCategoriesPage /> },
      { path: 'products', element: <OrdersPage /> },
      { path: 'pos', element: <OrdersPage /> },
      { path: 'wallet', element: <OrdersPage /> },
      { path: 'reports', element: <OrdersPage /> },
      { path: 'packages', element: <OrdersPage /> },
    ],
  },

  // 4. System Admin Portal (Quản trị hệ thống - Bảo vệ bằng JWT & Role Admin)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'SystemAdmin']} redirectPath="/admin/login">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/users" replace /> },
      { path: 'dashboard', element: <UsersPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'owners', element: <UsersPage /> },
      { path: 'subscriptions', element: <UsersPage /> },
      { path: 'sport-types', element: <SportTypesPage /> },
    ],
  },

  // 4. Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
