import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { CourtOwnerLoginRequest, CourtOwnerLoginResponse } from '../types/auth';

/**
 * Hook Mutation đăng nhập dành riêng cho Chủ sân (Court Owner)
 * Tự động lưu Access Token và User Profile vào Zustand Store (Refresh Token được quản lý qua HttpOnly Cookie)
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
