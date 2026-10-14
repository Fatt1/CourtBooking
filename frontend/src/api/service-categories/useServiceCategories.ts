import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ServiceCategoryDto } from './types';

/**
 * Hook lấy danh sách loại dịch vụ của chủ sân (Court Owner)
 * Endpoint: GET /api/v1/owner/service-categories
 */
export function useServiceCategoriesQuery() {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<ServiceCategoryDto[]>({
    queryKey: ['owner', 'service-categories'],
    queryFn: async (): Promise<ServiceCategoryDto[]> => {
      try {
        const response = await apiClient.get<ServiceCategoryDto[]>(
          API_ENDPOINTS.SERVICES.CATEGORIES
        );
        return (response as unknown as ServiceCategoryDto[]) || [];
      } catch (err) {
        console.warn('Lỗi lấy danh sách service-categories:', err);
        return [];
      }
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}
