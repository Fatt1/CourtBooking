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
 * Dữ liệu mặc định hiển thị chuẩn theo ảnh thiết kế Figma / Screenshot CourtOS Admin Console
 */
export const MOCK_ADMIN_DASHBOARD_DATA: SaaSSubscriptionRevenueDto = {
  totalRevenue: 128450000,
  totalSubscriptionsSold: 148,
  averageRevenuePerSubscription: 867905,
  previousPeriodRevenue: 108305000,
  growthPercentage: 18.6,
  activeOwnersCount: 326,
  activeOwnersGrowth: 8.2,
  renewalRate: 86.4,
  renewalRateGrowth: 4.2,
  byPackage: [
    {
      packageId: '1',
      packageName: 'Gói Pro',
      revenue: 51514000,
      totalSold: 86,
      percentage: 58,
    },
    {
      packageId: '2',
      packageName: 'Gói VIP',
      revenue: 42957000,
      totalSold: 43,
      percentage: 29,
    },
    {
      packageId: '3',
      packageName: 'Gói Basic',
      revenue: 11381000,
      totalSold: 19,
      percentage: 13,
    },
  ],
  timeline: [
    { period: '01/09', startDate: '2026-09-01', revenue: 1.4, subscriptionCount: 12, previousRevenue: 1.1 },
    { period: '05/09', startDate: '2026-09-05', revenue: 2.1, subscriptionCount: 18, previousRevenue: 1.8 },
    { period: '10/09', startDate: '2026-09-10', revenue: 3.8, subscriptionCount: 26, previousRevenue: 2.3 },
    { period: '15/09', startDate: '2026-09-15', revenue: 4.6, subscriptionCount: 32, previousRevenue: 2.9 },
    { period: '20/09', startDate: '2026-09-20', revenue: 5.8, subscriptionCount: 38, previousRevenue: 3.2 },
    { period: '25/09', startDate: '2026-09-25', revenue: 6.2, subscriptionCount: 42, previousRevenue: 3.6 },
    { period: '30/09', startDate: '2026-09-30', revenue: 7.8, subscriptionCount: 52, previousRevenue: 4.8 },
  ],
};

export const MOCK_RECENT_SUBSCRIPTIONS: SubscriptionHistoryItemDto[] = [
  {
    id: 'sub-1',
    courtOwnerId: 'owner-1',
    ownerName: 'Nguyễn Minh Tuấn',
    businessName: 'Sân cầu lông Út sinh Minh',
    avatarInitial: 'MT',
    packageName: 'Pro',
    pricePaid: 599000,
    startDate: '2026-09-28',
    endDate: '2026-10-28',
    transactionCode: 'TXN-98421',
    status: 'Thành công',
    daysRemaining: 30,
  },
  {
    id: 'sub-2',
    courtOwnerId: 'owner-2',
    ownerName: 'Trần Hoàng Nam',
    businessName: 'Thảo Điền Sports',
    avatarInitial: 'HN',
    packageName: 'VIP',
    pricePaid: 999000,
    startDate: '2026-09-27',
    endDate: '2026-10-27',
    transactionCode: 'TXN-98420',
    status: 'Thành công',
    daysRemaining: 29,
  },
  {
    id: 'sub-3',
    courtOwnerId: 'owner-3',
    ownerName: 'Vũ Đức Huy',
    businessName: 'D7 Pickleball Club',
    avatarInitial: 'ĐH',
    packageName: 'Pro',
    pricePaid: 599000,
    startDate: '2026-09-26',
    endDate: '2026-10-26',
    transactionCode: 'TXN-98419',
    status: 'Thành công',
    daysRemaining: 28,
  },
];

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
 * Endpoint: GET /api/v1/service-packages/subscriptions/history
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
          '/service-packages/subscriptions/history',
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
