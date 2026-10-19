import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CourtOwnerRevenueDto, CourtOwnerRevenueParams } from './types';

/**
 * Hook Query lấy dữ liệu thống kê doanh thu và vận hành của Chủ Sân
 * Endpoint: GET /api/v1/owner/analytics/revenue
 */
export function useCourtOwnerRevenueQuery(params: CourtOwnerRevenueParams = {}) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  const { fromDate, toDate, branchId, groupBy = 'Day' } = params;

  return useQuery<CourtOwnerRevenueDto>({
    queryKey: ['owner', 'analytics', 'revenue', { fromDate, toDate, branchId, groupBy }],
    queryFn: async (): Promise<CourtOwnerRevenueDto> => {
      const response = await apiClient.get<CourtOwnerRevenueDto>(
        API_ENDPOINTS.ANALYTICS.COURT_OWNER_REVENUE,
        {
          params: {
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            branchId: branchId || undefined,
            groupBy: groupBy || undefined,
          },
        }
      );
      return response as unknown as CourtOwnerRevenueDto;
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 2, // 2 phút cache
    refetchOnWindowFocus: false,
  });
}
