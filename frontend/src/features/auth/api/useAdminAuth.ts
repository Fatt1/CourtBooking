import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AdminLoginValues } from '../schemas/adminAuthSchema';
import type { User, AuthTokens } from '@/types/user';

interface AdminAuthResponse {
  user: User;
  tokens: AuthTokens;
}

export function useAdminLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: AdminLoginValues) => {
      const response = await apiClient.post<AdminAuthResponse>('/admin/auth/login', credentials);
      return response as unknown as AdminAuthResponse;
    },
    onSuccess: (data) => {
      setCredentials(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    },
  });
}
