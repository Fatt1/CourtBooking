import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { SportTypeItem } from './types';

/**
 * Hook lấy danh sách các môn thể thao hệ thống hỗ trợ
 * Dùng chung cho cả Public (trang chủ, tìm kiếm) và Court Owner (tạo/sửa chi nhánh, lọc sân)
 * Endpoint: GET /api/v1/sport-types (AllowAnonymous)
 */
export function useSportTypesQuery() {
  return useQuery<SportTypeItem[]>({
    queryKey: ['sport-types'],
    queryFn: async (): Promise<SportTypeItem[]> => {
      try {
        const response = await apiClient.get<SportTypeItem[]>(API_ENDPOINTS.SPORT_TYPES.LIST);
        return (response as unknown as SportTypeItem[]) || [];
      } catch (err) {
        console.warn('API sport-types lỗi hoặc chưa có dữ liệu, trả về danh sách rỗng:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 phút cache
  });
}
