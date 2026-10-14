import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  CourtOwnerLoginRequest,
  CourtOwnerLoginResponse,
  UserLoginRequest,
  UserRegisterRequest,
  UserAuthResponse,
  AdminLoginRequest,
  AdminAuthResponse,
} from './types';

// ==========================================
// 1. COURT OWNER AUTH HOOKS
// ==========================================

/**
 * Hook Mutation đăng nhập dành riêng cho Chủ sân (Court Owner)
 * Tự động lưu Access Token và User Profile vào Zustand Store
 */
export function useCourtOwnerLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: CourtOwnerLoginRequest): Promise<CourtOwnerLoginResponse> => {
      const response = await apiClient.post<CourtOwnerLoginResponse>(
        API_ENDPOINTS.OWNER_AUTH.LOGIN,
        credentials
      );
      return response as unknown as CourtOwnerLoginResponse;
    },
    onSuccess: (data) => {
      setCredentials(
        {
          id: data.userId,
          name: data.fullName,
          email: data.email,
          role: data.roleName,
          mustChangePwd: data.mustChangePassword,
        },
        data.accessToken
      );
    },
  });
}

/**
 * Hook Mutation đăng xuất Chủ sân
 * Xóa Session trong Store và gọi Backend để dọn sạch HttpOnly Cookie
 */
export function useCourtOwnerLogoutMutation() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(API_ENDPOINTS.OWNER_AUTH.LOGOUT);
      } catch {
        // Vẫn tiếp tục dọn dẹp local state kể cả khi backend lỗi mạng
      }
    },
    onSettled: () => {
      logout();
    },
  });
}

// ==========================================
// 2. USER / PLAYER AUTH HOOKS
// ==========================================

/**
 * Hook Mutation đăng nhập cho Người dùng / Người chơi (User/Player)
 */
export function useUserLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: UserLoginRequest) => {
      const response = await apiClient.post<UserAuthResponse>('/auth/login', credentials);
      return response as unknown as UserAuthResponse;
    },
    onSuccess: (data) => {
      setCredentials(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    },
  });
}

/**
 * Hook Mutation đăng ký tài khoản Người dùng / Người chơi
 */
export function useUserRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: UserRegisterRequest) => {
      const response = await apiClient.post('/auth/register', payload);
      return response;
    },
  });
}

// ==========================================
// 3. ADMIN AUTH HOOKS
// ==========================================

/**
 * Hook Mutation đăng nhập Quản trị viên (Admin)
 */
export function useAdminLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: AdminLoginRequest): Promise<CourtOwnerLoginResponse> => {
      const email = credentials.email || credentials.usernameOrEmail || '';
      const response = await apiClient.post<CourtOwnerLoginResponse>(
        API_ENDPOINTS.ADMIN_AUTH.LOGIN,
        {
          email,
          password: credentials.password,
        }
      );
      return response as unknown as CourtOwnerLoginResponse;
    },
    onSuccess: (data) => {
      setCredentials(
        {
          id: data.userId,
          name: data.fullName,
          email: data.email,
          role: data.roleName,
          mustChangePwd: data.mustChangePassword,
        },
        data.accessToken
      );
    },
  });
}

/**
 * Hook Mutation đăng xuất Quản trị viên (Admin)
 */
export function useAdminLogoutMutation() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(API_ENDPOINTS.ADMIN_AUTH.LOGOUT);
      } catch {
        // Vẫn tiếp tục dọn dẹp local state kể cả khi backend lỗi mạng
      }
    },
    onSettled: () => {
      logout();
    },
  });
}
