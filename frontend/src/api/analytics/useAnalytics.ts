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


// ── Báo cáo xuất PDF & Excel (Background Job Async) ─────────────
import type { ReportJobResponseDto, ReportExportFormat } from './types';

/**
 * Khởi tạo tiến trình xuất báo cáo (PDF hoặc Excel) chạy ngầm
 * Endpoint: POST /api/v1/owner/analytics/reports/export
 */
export async function createReportExportJob(params: {
  fromDate: string;
  toDate: string;
  branchId?: string;
  format?: ReportExportFormat;
}): Promise<ReportJobResponseDto> {
  const formatValue = params.format === 'Excel' ? 1 : 0;
  const queryParams: Record<string, string | number | undefined> = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    format: formatValue,
  };
  if (params.branchId && params.branchId !== 'all') {
    queryParams.branchId = params.branchId;
  }

  const response = await apiClient.post<ReportJobResponseDto>(
    '/owner/analytics/reports/export',
    null,
    { params: queryParams }
  );
  return response as unknown as ReportJobResponseDto;
}

/**
 * Kiểm tra trạng thái của tiến trình xuất báo cáo
 * Endpoint: GET /api/v1/owner/analytics/reports/jobs/{jobId}
 */
export async function getReportJobStatus(jobId: string): Promise<ReportJobResponseDto> {
  const response = await apiClient.get<ReportJobResponseDto>(
    `/owner/analytics/reports/jobs/${jobId}`
  );
  return response as unknown as ReportJobResponseDto;
}

/**
 * Tải trực tiếp file báo cáo PDF hoặc Excel đã hoàn thành từ Backend
 * Endpoint: GET /api/v1/owner/analytics/reports/jobs/{jobId}/download
 */
export async function downloadReportFile(jobId: string, fileName?: string): Promise<void> {
  const response = await apiClient.get<Blob>(
    `/owner/analytics/reports/jobs/${jobId}/download`,
    { responseType: 'blob' }
  );

  const blob = response as unknown as Blob;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Quy trình xuất báo cáo trọn gói: Khởi tạo Job -> Polling kiểm tra tiến trình -> Tải file về máy
 */
export async function exportReportWorkflow(params: {
  fromDate: string;
  toDate: string;
  branchId?: string;
  format: ReportExportFormat;
  onStatusChange?: (statusText: string) => void;
}): Promise<void> {
  const { fromDate, toDate, branchId, format, onStatusChange } = params;

  onStatusChange?.(`Đang gửi yêu cầu xuất file ${format}...`);
  const initialJob = await createReportExportJob({ fromDate, toDate, branchId, format });

  if (!initialJob?.jobId) {
    throw new Error('Không thể khởi tạo tiến trình xuất báo cáo.');
  }

  onStatusChange?.(`Đang xử lý dữ liệu và render báo cáo ${format}...`);

  // Polling chờ Job hoàn thành
  const maxAttempts = 30; // tối đa 30 lần * 1.5s = 45 giây
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const currentJob = await getReportJobStatus(initialJob.jobId);

    if (currentJob.status === 'Completed') {
      onStatusChange?.(`Đang tải file ${format} về thiết bị...`);
      const defaultName = format === 'Pdf'
        ? `BaoCao_DoanhThu_${fromDate}_${toDate}.pdf`
        : `BaoCao_DoanhThu_${fromDate}_${toDate}.xlsx`;
      await downloadReportFile(initialJob.jobId, currentJob.fileName || defaultName);
      return;
    }

    if (currentJob.status === 'Failed') {
      throw new Error(currentJob.errorMessage || 'Tạo báo cáo thất bại trên máy chủ.');
    }

    onStatusChange?.(`Đang xử lý dữ liệu báo cáo ${format}... (${Math.min(95, attempts * 10)}%)`);
  }

  throw new Error('Tiến trình tạo báo cáo mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra lại sau.');
}
