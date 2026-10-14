import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PagedList } from '@/types/api';
import type {
  ServiceByBranchDto,
  OwnerServiceDto,
  GetServicesByBranchParams,
  GetOwnerServicesParams,
} from './types';

/**
 * Hook lấy danh sách dịch vụ của một chi nhánh (Public / Booking / POS)
 * Endpoint: GET /api/v1/services/{branchId}
 */
export function useServicesByBranchQuery(params: GetServicesByBranchParams) {
  const { branchId, search, categoryId } = params;

  return useQuery<ServiceByBranchDto[]>({
    queryKey: ['services', 'by-branch', branchId, { search, categoryId }],
    queryFn: async (): Promise<ServiceByBranchDto[]> => {
      if (!branchId) return [];
      try {
        const response = await apiClient.get<ServiceByBranchDto[]>(
          API_ENDPOINTS.SERVICES.PUBLIC_BY_BRANCH(branchId),
          {
            params: {
              search: search || undefined,
              categoryId: categoryId || undefined,
            },
          }
        );
        return (response as unknown as ServiceByBranchDto[]) || [];
      } catch (err) {
        console.warn(`Lỗi lấy danh sách dịch vụ chi nhánh ${branchId}:`, err);
        return [];
      }
    },
    enabled: Boolean(branchId),
    staleTime: 1000 * 60 * 2, // 2 phút cache
  });
}

/**
 * Hook lấy danh sách dịch vụ thuộc quản lý của chủ sân (Court Owner)
 * Endpoint: GET /api/v1/owner/services
 */
export function useOwnerServicesQuery(params?: GetOwnerServicesParams) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<PagedList<OwnerServiceDto>>({
    queryKey: ['owner', 'services', params],
    queryFn: async (): Promise<PagedList<OwnerServiceDto>> => {
      const response = await apiClient.get<PagedList<OwnerServiceDto>>(
        API_ENDPOINTS.SERVICES.OWNER_LIST,
        { params }
      );
      return (
        (response as unknown as PagedList<OwnerServiceDto>) || {
          items: [],
          totalCount: 0,
          page: params?.page || 1,
          pageSize: params?.pageSize || 10,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        }
      );
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 2,
  });
}
