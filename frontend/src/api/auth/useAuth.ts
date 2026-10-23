import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OwnerProfileResponse,
  UpdateOwnerProfileRequest,
  ChangePasswordRequest,
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

/**
 * Hook Mutation gửi yêu cầu quên mật khẩu cho Chủ sân
 */
export function useOwnerForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordRequest) => {
      return apiClient.post(API_ENDPOINTS.OWNER_AUTH.FORGOT_PASSWORD, payload);
    },
  });
}

/**
 * Hook Mutation đặt lại mật khẩu bằng token cho Chủ sân
 */
export function useOwnerResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => {
      return apiClient.post(API_ENDPOINTS.OWNER_AUTH.RESET_PASSWORD, payload);
    },
  });
}

// ==========================================

/**
 * Hook Query lấy thông tin hồ sơ của Chủ sân (kèm gói dịch vụ hiện tại)
 */
export function useOwnerProfileQuery() {
  return useQuery({
    queryKey: ['owner-profile'],
    queryFn: async (): Promise<OwnerProfileResponse> => {
      const response = await apiClient.get<OwnerProfileResponse>(
        API_ENDPOINTS.OWNER_AUTH.PROFILE
      );
      return response as unknown as OwnerProfileResponse;
    },
  });
}

/**
 * Hook Mutation cập nhật thông tin cá nhân và doanh nghiệp của Chủ sân
 */
export function useUpdateOwnerProfileMutation() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: UpdateOwnerProfileRequest) => {
      const response = await apiClient.put(
        API_ENDPOINTS.OWNER_AUTH.PROFILE,
        payload
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-profile'] });
      updateUser({
        name: variables.fullName,
        email: variables.email,
      });
    },
  });
}

/**
 * Hook Mutation đổi mật khẩu cho Chủ sân
 */
export function useOwnerChangePasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      const response = await apiClient.post(
        API_ENDPOINTS.OWNER_AUTH.CHANGE_PASSWORD,
        payload
      );
      return response;
    },
  });
}

// 2. USER / PLAYER AUTH HOOKS
// ==========================================

/**
 * Hook Mutation đăng nhập cho Người dùng / Người chơi (User/Player)
 */
export function useUserLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: UserLoginRequest): Promise<CourtOwnerLoginResponse> => {
      const response = await apiClient.post<CourtOwnerLoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
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
 * Hook Mutation đăng ký tài khoản Người dùng / Người chơi
 */
export function useUserRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: UserRegisterRequest) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        phoneNumber: payload.phoneNumber,
        gender: payload.gender ?? 0,
      });
      return response;
    },
  });
}

/**
 * Hook Mutation gửi yêu cầu quên mật khẩu cho Người chơi
 */
export function useUserForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordRequest) => {
      return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    },
  });
}

/**
 * Hook Mutation đặt lại mật khẩu mới cho Người chơi
 */
export function useUserResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => {
      return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
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
