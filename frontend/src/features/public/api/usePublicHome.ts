import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  SportTypeDto,
  PublicBranchListItemDto,
  PagedList,
  SearchBranchesParams,
} from '../types/public.types';

/**
 * 1. Hook lấy danh sách môn thể thao công khai
 * Gọi Endpoint: GET /api/v1/sport-types (AllowAnonymous)
 */
export function useSportTypesQuery() {
  return useQuery<SportTypeDto[]>({
    queryKey: ['public', 'sport-types'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<SportTypeDto[]>(API_ENDPOINTS.SPORT_TYPES.LIST);
        return (response as unknown as SportTypeDto[]) || [];
      } catch (err) {
        console.warn('API sport-types chưa kết nối được backend, fallback dữ liệu mẫu:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 phút cache
  });
}

/**
 * 2. Hook tìm kiếm chi nhánh & sân công khai
 * Gọi Endpoint: GET /api/v1/branches (SearchPublicBranches)
 */
export function usePublicBranchesQuery(params: SearchBranchesParams = { page: 1, pageSize: 6 }) {
  return useQuery<PagedList<PublicBranchListItemDto>>({
    queryKey: ['public', 'branches', params],
    queryFn: async () => {
      try {
        const response = await apiClient.get<PagedList<PublicBranchListItemDto>>(
          API_ENDPOINTS.BRANCHES.PUBLIC_SEARCH,
          { params }
        );
        return response as unknown as PagedList<PublicBranchListItemDto>;
      } catch (err) {
        console.warn('API branches chưa kết nối được backend, fallback dữ liệu mẫu:', err);
        return {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: params.pageSize || 6,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}
