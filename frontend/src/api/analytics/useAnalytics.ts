import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  CourtOwnerRevenueDto,
  CourtOwnerRevenueParams,
  SaaSSubscriptionRevenueDto,
  SubscriptionHistoryItemDto,
  TimeGrouping,
} from './types';

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

export interface SaaSSubscriptionQueryParams {
  fromDate?: string;
  toDate?: string;
  groupBy?: TimeGrouping;
  packageId?: string;
}

/**
 * Hook Query lấy dữ liệu doanh thu gói SaaS Admin Console
 * Endpoint: GET /api/v1/admin/analytics/revenue hoặc GET /api/v1/analytics/saas-revenue
 */
export function useSaaSSubscriptionRevenueQuery(params: SaaSSubscriptionQueryParams = {}) {
  const { fromDate, toDate, groupBy = 'Day', packageId } = params;

  return useQuery<SaaSSubscriptionRevenueDto>({
    queryKey: ['analytics', 'admin', 'saas-revenue', { fromDate, toDate, groupBy, packageId }],
    queryFn: async (): Promise<SaaSSubscriptionRevenueDto> => {
      const queryParams: Record<string, string | undefined> = {
        groupBy: groupBy || 'Day',
      };
      if (fromDate) queryParams.fromDate = fromDate;
      if (toDate) queryParams.toDate = toDate;
      if (packageId) queryParams.packageId = packageId;

      const response = await apiClient.get<SaaSSubscriptionRevenueDto>(
        '/admin/analytics/revenue',
        { params: queryParams }
      );
      const data = response as unknown as SaaSSubscriptionRevenueDto;

      return {
        totalRevenue: data?.totalRevenue ?? 0,
        totalSubscriptionsSold: data?.totalSubscriptionsSold ?? 0,
        averageRevenuePerSubscription: data?.averageRevenuePerSubscription ?? 0,
        previousPeriodRevenue: data?.previousPeriodRevenue ?? 0,
        growthPercentage: data?.growthPercentage ?? 0,
        activeOwnersCount: data?.activeOwnersCount ?? 0,
        activeOwnersGrowth: data?.activeOwnersGrowth ?? 0,
        renewalRate: data?.renewalRate ?? 0,
        renewalRateGrowth: data?.renewalRateGrowth ?? 0,
        byPackage: data?.byPackage ?? [],
        timeline: data?.timeline ?? [],
      };
    },
    staleTime: 1000 * 30, // 30s cache
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook Query lấy các đăng ký thuê bao gần đây & số lượng sắp hết hạn thực tế từ Database
 * Endpoint: GET /api/v1/admin/service-packages/subscriptions/history
 */
export function useRecentSubscriptionsQuery() {
  return useQuery<{
    items: SubscriptionHistoryItemDto[];
    expiringSoonCount: number;
  }>({
    queryKey: ['admin', 'subscriptions', 'recent'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>(
          API_ENDPOINTS.SUBSCRIPTIONS.ADMIN_HISTORY,
          { params: { page: 1, pageSize: 5 } }
        );
        const data = response as any;
        const items = data?.subscriptions?.items || data?.subscriptions || [];
        return {
          items: Array.isArray(items) ? items : [],
          expiringSoonCount: data?.expiringSoonCount ?? 0,
        };
      } catch (err) {
        console.error('Error fetching recent subscriptions:', err);
        return {
          items: [],
          expiringSoonCount: 0,
        };
      }
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
