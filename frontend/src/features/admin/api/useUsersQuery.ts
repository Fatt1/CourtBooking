import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { UserFormValues } from '../schemas/userSchema';
import type { UserRole } from '@/types/user';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  mustChangePwd?: boolean;
  createdAt: string;
}

export function useUsersQuery(page = 1, search = '') {
  return useQuery({
    queryKey: ['users', { page, search }],
    queryFn: async () => {
      const data = await apiClient.get<{ items: UserItem[]; total: number }>('/users', {
        params: { page, search },
      });
      return data as unknown as { items: UserItem[]; total: number };
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

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) =>
      apiClient.patch(`/users/${userId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
