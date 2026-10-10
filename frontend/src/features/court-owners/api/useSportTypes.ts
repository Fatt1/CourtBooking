import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export interface SportTypeItem {
  id: string;
  name: string;
  image?: { key: string; id: string } | null;
  branchCount?: number;
}

/**
 * Hook lấy danh sách các môn thể thao hệ thống hỗ trợ
 * Endpoint: GET /api/v1/sport-types
 */
export function useSportTypesQuery() {
  return useQuery({
    queryKey: ['sport-types'],
    queryFn: async (): Promise<SportTypeItem[]> => {
      const response = await apiClient.get<SportTypeItem[]>(API_ENDPOINTS.SPORT_TYPES.LIST);
      return (response as unknown as SportTypeItem[]) || [];
    },
    staleTime: 1000 * 60 * 30, // 30 phút
  });
}
