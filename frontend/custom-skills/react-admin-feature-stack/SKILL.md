---
name: react-admin-feature-stack
description: Standard guidelines, architecture, and code templates for building modern Frontend Admin web apps using React, TypeScript, Vite, TanStack Query, Zustand, React Hook Form + Zod, and shadcn/ui with Feature-Driven Architecture.
---

# React Admin Feature Stack Guide

Chuyên biệt dành cho ứng dụng **Vite + React (TypeScript) + TanStack Query + Zustand + shadcn/ui + React Hook Form & Zod** với kiến trúc **Feature-Driven Architecture**.

---

## 1. Cấu Trúc Thư Mục Chuẩn (Feature-Driven Architecture)

```plaintext
src/
├── app/                              # Khởi tạo App, Providers, Routes
│   ├── App.tsx                       # Root component với RouterProvider & QueryClientProvider
│   ├── main.tsx                      # Entry point React DOM
│   ├── router.tsx                    # Cấu hình routes (React Router / TanStack Router)
│   └── index.css                     # Tailwind CSS & CSS variables cho shadcn
│
├── assets/                           # Static assets (images, icons, svgs)
│
├── components/                       # Shared UI Components dùng chung toàn app
│   ├── ui/                           # Toàn bộ components của shadcn/ui (Button, Dialog, Form, Input, Table...)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── sheet.tsx                 # Dùng cho mobile navigation drawer
│   │   ├── table.tsx
│   │   └── ...
│   ├── feedback/                     # Loading spinner, Error boundary, Empty states
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   └── layouts/                      # Layouts chính của ứng dụng
│       ├── PublicLayout.tsx          # Layout Public (Header sticky + Main content + Footer)
│       ├── PublicHeader.tsx          # Header Public (Logo, Navbar, Search, Mobile Drawer, Auth CTA)
│       ├── PublicFooter.tsx          # Footer Public (Links, Copyright, Socials)
│       ├── AdminLayout.tsx           # Layout Admin (Sidebar + Header + Main content)
│       ├── AppSidebar.tsx            # Sidebar điều hướng Admin (Responsive)
│       ├── AdminHeader.tsx           # Header Admin (User menu, Dark mode toggle, Breadcrumb)
│       ├── AuthLayout.tsx            # Layout Đăng nhập / Đăng ký cho người dùng Public
│       ├── AdminAuthLayout.tsx       # Layout Đăng nhập dành riêng cho Admin (Bảo mật, tối giản, dark tone)
│       └── ProtectedRoute.tsx        # Guard kiểm tra auth & quyền admin
│
├── features/                         # Các module nghiệp vụ chính (Business Domains)
│   ├── public-home/                  # Module Trang chủ Public (Landing Page)
│   │   ├── components/               # HeroSection, FeatureHighlights, Testimonials, FAQ
│   │   └── pages/                    # HomePage.tsx
│   │
│   ├── catalog/                      # Module Sản phẩm / Dịch vụ Public
│   │   ├── api/                      # useProductsQuery, useProductDetailQuery (Public API, không cần auth)
│   │   ├── components/               # ProductCard, ProductGrid, ProductFilters
│   │   └── pages/                    # CatalogPage.tsx, ProductDetailPage.tsx
│   │
│   ├── auth/                         # Module Xác thực (Tách biệt Public User vs Admin)
│   │   ├── api/                      # Hooks gọi API đăng nhập
│   │   │   ├── useUserAuth.ts        # useUserLoginMutation (POST /auth/login)
│   │   │   └── useAdminAuth.ts       # useAdminLoginMutation (POST /admin/auth/login)
│   │   ├── components/               # Các form UI tương ứng
│   │   │   ├── UserLoginForm.tsx     # Form người dùng (Email/Password, Social Login, link Đăng ký)
│   │   │   ├── UserRegisterForm.tsx  # Form đăng ký người dùng
│   │   │   └── AdminLoginForm.tsx    # Form Admin (Username/Password, mã 2FA / OTP, Security notice)
│   │   ├── schemas/                  # Zod validation schemas
│   │   │   ├── userAuthSchema.ts     # Schema cho public login/register
│   │   │   └── adminAuthSchema.ts    # Schema cho admin login (kèm mã xác thực 2FA 6 số)
│   │   ├── types/                    # Types DTOs (UserLoginDTO, AdminLoginDTO, AuthTokens)
│   │   └── pages/                    # Các màn hình login tương ứng từng route
│   │       ├── UserLoginPage.tsx     # Route: /login (Giao diện người dùng)
│   │       ├── UserRegisterPage.tsx  # Route: /register
│   │       └── AdminLoginPage.tsx    # Route: /admin/login (Giao diện cổng Admin)
│   │
│   ├── users/                        # Module Quản lý User (Admin CRUD)
│   │   ├── api/                      # useUsersQuery, useCreateUserMutation, useDeleteUserMutation
│   │   ├── components/               # UserTable, UserFormDialog, UserFilterBar
│   │   ├── schemas/                  # userSchema (Zod)
│   │   ├── types/                    # User types, Filter params
│   │   └── pages/                    # UsersPage.tsx (Screen chính trong Admin)
│   │
│   └── dashboard/                    # Module Dashboard / Thống kê Admin
│       ├── api/                      # useStatsQuery
│       ├── components/               # MetricCards, RevenueChart, RecentActivities
│       └── pages/                    # DashboardPage.tsx
│
├── hooks/                            # Custom hooks dùng chung (non-feature specific)
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts              # Xử lý responsive bằng code JS
│   └── useDisclosure.ts              # Quản lý đóng/mở modal/drawer
│
├── lib/                              # Cấu hình thư viện ngoài & Utils
│   ├── utils.ts                      # Hàm `cn()` (clsx + tailwind-merge) cho shadcn
│   ├── axios.ts                      # Axios instance cấu hình Base URL, Bearer Token & Interceptor
│   └── query-client.ts               # Khởi tạo QueryClient với default options tối ưu
│
├── stores/                           # Global Client State (Zustand)
│   ├── useAuthStore.ts               # State lưu user session, token, permissions
│   └── useAppThemeStore.ts           # State điều khiển sidebar collapse, theme mode
│
└── types/                            # Types dùng chung toàn bộ dự án
    └── api.ts                        # ApiResponse<T>, PaginatedResponse<T>, ApiError
```

---

## 2. Cấu Hình Axios & TanStack Query

### 2.1. Cấu hình Axios Client (`src/lib/axios.ts`)
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động gán JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Bắt lỗi 401 & xử lý Refresh Token / Logout
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error.response?.data || error.message);
  }
);
```

### 2.2. Khởi tạo Query Client (`src/lib/query-client.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút cache fresh
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 3. Quản Lý State Toàn Cục với Zustand (`src/stores/useAuthStore.ts`)

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setCredentials: (user: User, token: string) => void;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,

        setCredentials: (user, token) =>
          set({ user, accessToken: token, isAuthenticated: true }, false, 'auth/setCredentials'),

        logout: () =>
          set({ user: null, accessToken: null, isAuthenticated: false }, false, 'auth/logout'),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({ accessToken: state.accessToken, user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

---

## 4. Xử Lý Form Chuẩn: React Hook Form + Zod + shadcn/ui

### Schema Validation (`src/features/users/schemas/userSchema.ts`)
```typescript
import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không đúng định dạng'),
  role: z.enum(['admin', 'user'], { required_error: 'Vui lòng chọn vai trò' }),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
```

### Component Form (`src/features/users/components/UserFormDialog.tsx`)
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, type UserFormValues } from '../schemas/userSchema';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function UserFormDialog({ open, onOpenChange, onSubmit, isSubmitting }: Props) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      status: 'active',
    },
  });

  const handleSubmit = async (values: UserFormValues) => {
    await onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@domain.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Mẫu Admin Layout Responsive & Collapsible Sidebar

### Layout Container (`src/components/layouts/AdminLayout.tsx`)
```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Responsive: Toggle trên Mobile, cố định trên Desktop */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Hook TanStack Query trong Feature (`src/features/users/api/useUsersQuery.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { UserFormValues } from '../schemas/userSchema';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export function useUsersQuery(page = 1, search = '') {
  return useQuery({
    queryKey: ['users', { page, search }],
    queryFn: async () => {
      const data = await apiClient.get<{ items: UserItem[]; total: number }>('/users', {
        params: { page, search },
      });
      return data;
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UserFormValues) => apiClient.post('/users', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

---

## 6. Kiến Trúc Routing Đa Layout (Public vs Auth vs Admin Protected)

Sử dụng React Router v6/v7 phân tách rõ ràng 3 khu vực Layout trong `src/app/router.tsx`:

```tsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

// Layouts
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';

// Public Pages
import { HomePage } from '@/features/public-home/pages/HomePage';
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';

// Admin Pages
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { UsersPage } from '@/features/users/pages/UsersPage';

// Guard bảo vệ trang Admin
function AdminProtectedRoute({ allowedRoles = ['admin'] }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  // Chưa đăng nhập -> Chuyển về trang đăng nhập của Admin
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Đăng nhập rồi nhưng không phải role admin -> Chuyển về trang chủ Public
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  // 1. PUBLIC ROUTES (Người dùng thông thường)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalog', element: <CatalogPage /> },
      { path: '/catalog/:id', element: <ProductDetailPage /> },
    ],
  },

  // 2. PUBLIC AUTH ROUTES (/login, /register cho khách hàng)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <UserLoginPage /> },
      { path: '/register', element: <UserRegisterPage /> },
    ],
  },

  // 3. ADMIN AUTH ROUTE (/admin/login - Cổng đăng nhập riêng của Quản trị viên)
  {
    element: <AdminAuthLayout />,
    children: [
      { path: '/admin/login', element: <AdminLoginPage /> },
    ],
  },

  // 4. ADMIN PROTECTED ROUTES (Chỉ Admin đã đăng nhập mới vào được)
  {
    path: '/admin',
    element: <AdminProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'users', element: <UsersPage /> },
        ],
      },
    ],
  },

  // Catch-all 404
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

---

## 7. Mẫu Public Layout Responsive (Sticky Header + Mobile Sheet Drawer + Footer)

### `src/components/layouts/PublicLayout.tsx`
```tsx
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
```

### `src/components/layouts/PublicHeader.tsx`
```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/useAuthStore';

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm / Dịch vụ', href: '/catalog' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Liên hệ', href: '/contact' },
];

export function PublicHeader() {
  const [openMobile, setOpenMobile] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
          <span>MyApp</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA & User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {user?.role === 'admin' && (
                <Button variant="outline" asChild size="sm">
                  <Link to="/admin">Trang Quản Trị</Link>
                </Button>
              )}
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>

        {/* Mobile Hamburger Drawer via shadcn/ui Sheet */}
        <div className="flex md:hidden">
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mở menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-lg">Menu Điều Hướng</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpenMobile(false)}
                    className="text-base font-medium py-2 hover:text-primary transition-colors border-b"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      {user?.role === 'admin' && (
                        <Button className="w-full" asChild onClick={() => setOpenMobile(false)}>
                          <Link to="/admin">Vào Trang Quản Trị</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button className="w-full" asChild onClick={() => setOpenMobile(false)}>
                      <Link to="/login">Đăng nhập</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

