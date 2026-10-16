import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ServiceCategoryDto, CreateServiceCategoryPayload, UpdateServiceCategoryPayload } from './types';

const categoryKey = ['owner', 'service-categories'] as const;
const categoryUrl = API_ENDPOINTS.SERVICES.CATEGORIES;

/**
 * Hook lấy danh sách loại dịch vụ của chủ sân (Court Owner)
 * Endpoint: GET /api/v1/owner/service-categories
 */
export function useServiceCategoriesQuery() {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<ServiceCategoryDto[]>({
    queryKey: categoryKey,
    queryFn: async (): Promise<ServiceCategoryDto[]> => {
        const response = await apiClient.get<ServiceCategoryDto[]>(
          categoryUrl
        );
        return (response as unknown as ServiceCategoryDto[]) || [];
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}

export function useCreateServiceCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateServiceCategoryPayload): Promise<string> => {
      const response = await apiClient.post<string>(categoryUrl, payload);
      return response as unknown as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKey }),
  });
}

export function useUpdateServiceCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateServiceCategoryPayload) => {
      await apiClient.put(`${categoryUrl}/${id}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKey }),
  });
}

export function useDeleteServiceCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${categoryUrl}/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKey }),
  });
}
