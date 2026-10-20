import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { OwnerLayout } from '@/components/layouts/OwnerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ProtectedRoute, OwnerProtectedRoute } from '@/components/layouts/ProtectedRoute';

// Customer / Public Pages
import { HomePage } from '@/features/customer/pages/HomePage';
import { CourtsPage as CustomerCourtsPage } from '@/features/customer/pages/CourtsPage';
import { BranchDetailPage } from '@/features/customer/pages/BranchDetailPage';
import { CreateReviewPage } from '@/features/customer/pages/CreateReviewPage';
import { EventsPage } from '@/features/events/pages/EventsPage';
import { EventDetailPage } from '@/features/events/pages/EventDetailPage';
import { EventCheckoutPage } from '@/features/events/pages/EventCheckoutPage';
import { EventSuccessPage } from '@/features/events/pages/EventSuccessPage';
import { MatchesPage } from '@/features/matches/pages/MatchesPage';
import { MatchDetailPage } from '@/features/matches/pages/MatchDetailPage';
import { CreateMatchPage } from '@/features/matches/pages/CreateMatchPage';
import { EditMatchPage } from '@/features/matches/pages/EditMatchPage';


// Admin Pages
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { UsersPage } from '@/features/admin/pages/UsersPage';
import { CourtOwnersPage } from '@/features/admin/pages/CourtOwnersPage';
import { SubscriptionsPage } from '@/features/admin/pages/SubscriptionsPage';
import { SportTypesPage } from '@/features/admin/pages/SportTypesPage';

// Court Owners / Management Pages
import { OrdersPage } from '@/features/court-owners/pages/OrdersPage';
import { BranchesPage } from '@/features/court-owners/pages/BranchesPage';
import { CourtTypesPage } from '@/features/court-owners/pages/CourtTypesPage';
import { CourtsPage } from '@/features/court-owners/pages/CourtsPage';
import { ServiceCategoriesPage } from '@/features/court-owners/pages/ServiceCategoriesPage';
import { ProductsPage } from '@/features/court-owners/pages/ProductsPage';
import { PosPage } from '@/features/court-owners/pages/PosPage';
import { PosLayout } from '@/features/court-owners/components/pos/PosLayout';
import { RetailOrdersPage } from '@/features/court-owners/pages/RetailOrdersPage';
import { PricingPage } from '@/features/court-owners/pages/PricingPage';
import { CourtOwnerLoginPage } from '@/features/court-owners/pages/CourtOwnerLoginPage';
import { OwnerReportsPage } from '@/features/court-owners/pages/OwnerReportsPage';
import { OwnerDashboardPage } from '@/features/court-owners/pages/OwnerDashboardPage';

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
      // Đánh giá sân
      { path: '/orders/:orderId/review', element: <CreateReviewPage /> },
      { path: '/reviews/create', element: <CreateReviewPage /> },
      // Danh sách sân & Chi nhánh công khai
      { path: '/courts', element: <CustomerCourtsPage /> },
      // Kèo giao lưu thể thao (Matchday Social Matches)
      { path: '/matches', element: <MatchesPage /> },
      { path: '/matches/create', element: <CreateMatchPage /> },
      { path: '/matches/:id', element: <MatchDetailPage /> },
      { path: '/matches/:id/edit', element: <EditMatchPage /> },
      // Sự kiện thể thao (Matchday Events)
      { path: '/events', element: <EventsPage /> },
      { path: '/events/:id', element: <EventDetailPage /> },
      { path: '/events/:id/checkout', element: <EventCheckoutPage /> },
      { path: '/events/:id/success', element: <EventSuccessPage /> },
      { path: '/ai-assistant', element: <HomePage /> },
      { path: '/branches/:id', element: <BranchDetailPage /> },
      { path: '/courts/:id', element: <BranchDetailPage /> },
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
      { index: true, element: <OwnerDashboardPage /> },
      { path: 'dashboard', element: <OwnerDashboardPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'court-status', element: <OrdersPage /> },
      { path: 'courts', element: <CourtsPage /> },
      { path: 'court-types', element: <CourtTypesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'service-categories', element: <ServiceCategoriesPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'pos', element: <PosLayout />, children: [
        { index: true, element: <PosPage /> },
        { path: 'history', element: <RetailOrdersPage /> },
      ] },
      // Tạm tắt /owner/wallet: route cũ chỉ hiển thị nhầm trang lịch đặt sân.
      { path: 'reports', element: <OwnerReportsPage /> },
      { path: 'analytics', element: <OwnerReportsPage /> },
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
      { index: true, element: <AdminDashboardPage /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'owners', element: <CourtOwnersPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'sport-types', element: <SportTypesPage /> },
    ],
  },

  // 4. Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
