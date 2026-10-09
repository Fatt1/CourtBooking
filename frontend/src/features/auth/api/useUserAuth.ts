import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserLoginValues, UserRegisterValues } from '../schemas/userAuthSchema';
import type { User, AuthTokens } from '@/types/user';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export function useUserLoginMutation() {
  const { setCredentials } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: UserLoginValues) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response as unknown as AuthResponse;
    },
    onSuccess: (data) => {
      setCredentials(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    },
  });
}

export function useUserRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: UserRegisterValues) => {
      const response = await apiClient.post('/auth/register', payload);
      return response;
    },
  });
}
