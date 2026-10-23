import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import {
  type SubscriptionHistoryItem,
  type AdminSubscriptionHistoryResponse,
  type GetSubscriptionsQueryParams,
  type ServicePackageConfigItem,
  type CreatePackagePayload,
  type UpdatePackagePayload,
  type ExtendSubscriptionPayload,
  type ToggleSubscriptionStatusPayload,
  type OwnerSubscriptionMeResponse,
} from './types';

export const SUBSCRIPTIONS_QUERY_KEYS = {
  all: ['subscriptions'] as const,
  history: (params: GetSubscriptionsQueryParams) => ['subscriptions', 'history', params] as const,
  packages: ['subscriptions', 'packages'] as const,
  me: ['subscriptions', 'me'] as const,
};

/**
 * Ghi nhận thay đổi lịch sử đăng ký (Giữ tương thích ngược cho giao diện, gọi refresh query thực tế từ backend)
 */
export function recordSubscriptionHistoryChange(_params?: Record<string, unknown>) {
  // Không cần lưu vào mảng mock in-memory nữa vì dữ liệu được quản lý đồng bộ từ backend API
}

// 1. Hook lấy lịch sử biến động & đăng ký gói của các chủ sân (Dành cho Quản trị viên Admin)
export function useSubscriptionHistoryQuery(params: GetSubscriptionsQueryParams = {}) {
  const { search = '', page = 1, pageSize = 10 } = params;

  return useQuery<AdminSubscriptionHistoryResponse>({
    queryKey: SUBSCRIPTIONS_QUERY_KEYS.history(params),
    queryFn: async () => {
      const res = await apiClient.get<any>(API_ENDPOINTS.SUBSCRIPTIONS.ADMIN_HISTORY, {
        params: {
          search: search.trim() || undefined,
          page,
          pageSize,
        },
      });

      // Backend trả về: { subscriptions: { items: [...], totalCount, page, pageSize, totalPages }, expiringSoonCount }
      const data = (res as any)?.subscriptions ? res : (res as any)?.data ?? res;
      if (data && data.subscriptions && Array.isArray(data.subscriptions.items)) {
        const items: SubscriptionHistoryItem[] = data.subscriptions.items.map((it: any) => ({
          id: it.id || it.subscriptionId,
          courtOwnerId: it.courtOwnerId,
          ownerName: it.ownerName,
          businessName: it.businessName,
          packageName: it.packageName || 'Basic',
          pricePaid: it.pricePaid,
          startDate: it.startDate ? formatDateVN(it.startDate) : '',
          endDate: it.endDate ? formatDateVN(it.endDate) : '',
          createdAt: it.createdAt,
          status: it.status || 'Active',
          statusLabel: mapStatusLabel(it.status),
          daysRemaining: it.daysRemaining ?? 0,
        }));

        return {
          items,
          totalCount: data.subscriptions.totalCount,
          page: data.subscriptions.page,
          pageSize: data.subscriptions.pageSize,
          totalPages: data.subscriptions.totalPages,
          expiringSoonCount: data.expiringSoonCount ?? 0,
        };
      }

      return {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        expiringSoonCount: 0,
      };
    },
    staleTime: 1000 * 60 * 3, // 3 phút
  });
}

// 2. Hook lấy danh sách các gói cước SaaS khả dụng trên hệ thống (Public)
export function useServicePackagesConfigQuery() {
  return useQuery<ServicePackageConfigItem[]>({
    queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages,
    queryFn: async () => {
      const res: any = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.PACKAGES);
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map((pkg: any) => {
        const name = String(pkg.name || '').trim();
        const nameLower = name.toLowerCase();
        const isUltra =
          nameLower.includes('ultra') ||
          nameLower.includes('vip') ||
          nameLower.includes('toàn diện') ||
          nameLower.includes('doanh nghiệp');
        const isPro =
          nameLower.includes('pro') ||
          nameLower.includes('phổ biến') ||
          nameLower.includes('nâng cao');
        const code = isUltra ? 'Ultra' : isPro ? 'Pro' : 'Basic';
        const badge = isUltra ? 'TOÀN DIỆN' : isPro ? 'PHỔ BIẾN NHẤT' : 'KHỞI ĐẦU';

        return {
          id: String(pkg.id),
          code,
          name, // Tên gói từ backend database
          badge,
          popular: isPro,
          price: Number(pkg.price), // Giá gói từ database
          durationMonths: Number(pkg.durationMonths ?? (isUltra ? 6 : isPro ? 3 : 1)),
          description: pkg.description || '',
          maxCourts: isUltra ? 999 : isPro ? 20 : 5,
          maxBranches: isUltra ? 999 : isPro ? 3 : 1,
          isActive: true,
          features: [],
        };
      });
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 3. Hook lấy thông tin gói cước hiện tại & lịch sử gói của Chủ sân (Court Owner)
export function useOwnerSubscriptionMeQuery() {
  return useQuery<OwnerSubscriptionMeResponse>({
    queryKey: SUBSCRIPTIONS_QUERY_KEYS.me,
    queryFn: async (): Promise<OwnerSubscriptionMeResponse> => {
      const res = await apiClient.get<OwnerSubscriptionMeResponse>(
        API_ENDPOINTS.SUBSCRIPTIONS.OWNER_ME
      );
      const data = (res as any)?.data ?? res;
      return {
        currentSubscription: data?.currentSubscription ?? null,
        history: Array.isArray(data?.history)
          ? data.history.map((it: any) => ({
              ...it,
              statusLabel: mapStatusLabel(it.status),
              startDate: it.startDate ? formatDateVN(it.startDate) : '',
              endDate: it.endDate ? formatDateVN(it.endDate) : '',
            }))
          : [],
      };
    },
    staleTime: 1000 * 60 * 3,
  });
}

// 4. Hook Chủ sân đăng ký hoặc gia hạn gói cước SaaS
export function useSubscribePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      return await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE(packageId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.me });
    },
  });
}

// 5. Hook gia hạn gói cước cho chủ sân (Dành cho Admin)
export function useExtendSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExtendSubscriptionPayload) => {
      return await apiClient.post(`/admin/court-owners/${payload.courtOwnerId}/extend`, {
        durationMonths: payload.durationMonths,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
    },
  });
}

// 6. Hook tạm dừng / kích hoạt lại cụm sân của chủ sân (Dành cho Admin)
export function useToggleSubscriptionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ToggleSubscriptionStatusPayload) => {
      return await apiClient.patch(`/admin/court-owners/${payload.courtOwnerId}/status`, {
        status: payload.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
    },
  });
}

// 7. Hook tạo gói dịch vụ SaaS mới (Dành cho Admin: POST /api/v1/admin/service-packages)
export function useCreatePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePackagePayload) => {
      return await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CREATE_PACKAGE, {
        name: payload.name,
        price: payload.price,
        description: payload.description,
        durationMonths: payload.durationMonths,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages });
    },
  });
}

// 8. Hook cập nhật chỉnh sửa gói dịch vụ SaaS (Dành cho Admin: PUT /api/v1/admin/service-packages/{id})
export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdatePackagePayload) => {
      return await apiClient.put(API_ENDPOINTS.SUBSCRIPTIONS.UPDATE_PACKAGE(payload.id), {
        name: payload.name,
        price: payload.price,
        description: payload.description,
        durationMonths: payload.durationMonths,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages });
    },
  });
}

// 9. Hook xóa gói dịch vụ SaaS (Dành cho Admin: DELETE /api/v1/admin/service-packages/{id})
export function useDeletePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(API_ENDPOINTS.SUBSCRIPTIONS.DELETE_PACKAGE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages });
    },
  });
}

// Helper formats
function formatDateVN(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function mapStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case 'expiringsoon':
      return 'Sắp hết hạn';
    case 'active':
      return 'Hoạt động';
    case 'suspended':
      return 'Tạm dừng';
    case 'expired':
      return 'Hết hạn';
    default:
      return status || 'Hoạt động';
  }
}
