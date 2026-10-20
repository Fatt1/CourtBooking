import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import {
  MOCK_SUBSCRIPTION_HISTORY,
  MOCK_SERVICE_PACKAGES_CONFIG,
  type SubscriptionHistoryItem,
  type AdminSubscriptionHistoryResponse,
  type GetSubscriptionsQueryParams,
  type ServicePackageConfigItem,
  type CreatePackagePayload,
  type UpdatePackagePayload,
  type ExtendSubscriptionPayload,
  type ToggleSubscriptionStatusPayload,
} from './types';

export const SUBSCRIPTIONS_QUERY_KEYS = {
  all: ['subscriptions'] as const,
  history: (params: GetSubscriptionsQueryParams) => ['subscriptions', 'history', params] as const,
  packages: ['subscriptions', 'packages'] as const,
};

// Bộ nhớ đệm lịch sử đăng ký cục bộ (hỗ trợ lưu vết ngay cả trong chế độ offline / fallback)
let localHistoryMemory: SubscriptionHistoryItem[] = [...MOCK_SUBSCRIPTION_HISTORY];

export function recordSubscriptionHistoryChange(params: {
  courtOwnerId: string;
  ownerName: string;
  businessName: string;
  packageName: string;
  previousPackageName?: string;
  actionType?: import('./types').SubscriptionActionType;
  actionNote?: string;
  status?: import('./types').SubscriptionStatusType;
  pricePaid: number;
}) {
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = today.getFullYear();
  const startDateStr = `${dayStr}/${monthStr}/${yearStr}`;

  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 1);
  const endDayStr = String(endDate.getDate()).padStart(2, '0');
  const endMonthStr = String(endDate.getMonth() + 1).padStart(2, '0');
  const endYearStr = endDate.getFullYear();
  const endDateStr = `${endDayStr}/${endMonthStr}/${endYearStr}`;

  const yy = String(yearStr).slice(-2);
  const codeSuffix = Math.floor(100 + Math.random() * 900);
  const transactionCode = `PAY-${yy}${monthStr}${dayStr}-${codeSuffix}`;

  const pkgLower = params.packageName.toLowerCase();
  const normalizedCode =
    pkgLower.includes('ultra') || pkgLower.includes('vip') || pkgLower.includes('doanh nghiệp')
      ? 'Ultra'
      : pkgLower.includes('pro') || pkgLower.includes('nâng cao') || pkgLower.includes('tiêu chuẩn')
      ? 'Pro'
      : 'Basic';

  const avatarInitial =
    params.ownerName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'CS';

  const actionType = params.actionType || 'ChangePackage';
  const actionNote =
    params.actionNote ||
    (actionType === 'ChangePackage'
      ? `Đổi sang gói ${normalizedCode}`
      : actionType === 'Register'
      ? `Đăng ký mới gói ${normalizedCode}`
      : actionType === 'Cancel'
      ? 'Hủy gói / Tạm dừng dịch vụ'
      : `Gia hạn gói ${normalizedCode}`);

  const newHistoryItem: SubscriptionHistoryItem = {
    id: `sub-${Date.now()}`,
    courtOwnerId: params.courtOwnerId,
    ownerName: params.ownerName,
    businessName: params.businessName,
    avatarInitial,
    packageName: normalizedCode,
    previousPackageName: params.previousPackageName,
    actionType,
    actionNote,
    pricePaid: params.pricePaid,
    startDate: startDateStr,
    endDate: endDateStr,
    createdAt: today.toISOString(),
    transactionCode,
    status: params.status || (actionType === 'Cancel' ? 'Suspended' : 'Active'),
    statusLabel: actionType === 'Cancel' ? 'Đã hủy / Tạm dừng' : 'Hoạt động',
    daysRemaining: actionType === 'Cancel' ? 0 : 30,
  };

  localHistoryMemory = [newHistoryItem, ...localHistoryMemory];
  return newHistoryItem;
}

// 1. Hook lấy lịch sử biến động & đăng ký gói của các chủ sân
export function useSubscriptionHistoryQuery(params: GetSubscriptionsQueryParams = {}) {
  const { search = '', status = 'all', actionType = 'all', page = 1, pageSize = 10 } = params;

  return useQuery<AdminSubscriptionHistoryResponse>({
    queryKey: SUBSCRIPTIONS_QUERY_KEYS.history(params),
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/service-packages/subscriptions/history', {
          params: {
            search: search.trim() || undefined,
            status: status !== 'all' ? status : undefined,
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
            avatarInitial: it.avatarInitial || it.ownerName?.substring(0, 2).toUpperCase() || 'CS',
            packageName: it.packageName || 'Basic',
            actionType: it.actionType || (it.status === 'Suspended' ? 'Cancel' : 'Register'),
            actionNote: it.actionNote,
            pricePaid: it.pricePaid,
            startDate: it.startDate ? formatDateVN(it.startDate) : '',
            endDate: it.endDate ? formatDateVN(it.endDate) : '',
            createdAt: it.createdAt,
            transactionCode: it.transactionCode || `PAY-${it.id?.substring(0, 8) || '001'}`,
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
      } catch (err) {
        console.warn('API /service-packages/subscriptions/history failed, using mock data:', err);
      }

      // Fallback: Sử dụng dữ liệu bộ nhớ cục bộ (bao gồm các sự kiện Đăng ký, Đổi gói, Hủy gói, Gia hạn)
      let filtered = [...localHistoryMemory];
      if (search.trim()) {
        const term = search.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.ownerName.toLowerCase().includes(term) ||
            item.businessName.toLowerCase().includes(term) ||
            item.transactionCode.toLowerCase().includes(term) ||
            (item.actionNote && item.actionNote.toLowerCase().includes(term))
        );
      }

      if (status !== 'all') {
        filtered = filtered.filter((item) => item.status.toLowerCase() === status.toLowerCase());
      }

      if (actionType !== 'all') {
        filtered = filtered.filter(
          (item) => (item.actionType || 'Register').toLowerCase() === actionType.toLowerCase()
        );
      }

      const expiringSoonCount = localHistoryMemory.filter(
        (it) => it.status === 'ExpiringSoon'
      ).length;

      return {
        items: filtered,
        totalCount: filtered.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        expiringSoonCount,
      };
    },
    staleTime: 1000 * 60 * 3, // 3 phút
  });
}

export function useServicePackagesConfigQuery() {
  return useQuery<ServicePackageConfigItem[]>({
    queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages,
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/service-packages');
        const list = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          return list.map((pkg: any) => {
            const name = String(pkg.name || '').trim();
            const nameLower = name.toLowerCase();
            const isUltra = nameLower.includes('ultra') || nameLower.includes('vip') || nameLower.includes('toàn diện') || nameLower.includes('doanh nghiệp');
            const isPro = nameLower.includes('pro') || nameLower.includes('phổ biến') || nameLower.includes('nâng cao');
            const code = isUltra ? 'Ultra' : isPro ? 'Pro' : 'Basic';
            const badge = isUltra ? 'TOÀN DIỆN' : isPro ? 'PHỔ BIẾN NHẤT' : 'KHỞI ĐẦU';

            return {
              id: String(pkg.id),
              code,
              name, // Lấy đúng tên từ backend database
              badge,
              popular: isPro,
              price: Number(pkg.price), // Lấy đúng giá từ backend database
              durationMonths: Number(pkg.durationMonths ?? (isUltra ? 6 : isPro ? 3 : 1)), // Lấy đúng chu kỳ từ backend database
              description: '', // Xóa description theo yêu cầu người dùng
              maxCourts: isUltra ? 999 : isPro ? 20 : 5,
              maxBranches: isUltra ? 999 : isPro ? 3 : 1,
              isActive: true,
              features: [],
            };
          });
        }
      } catch (err) {
        console.warn('API /service-packages failed, using mock packages:', err);
      }

      return MOCK_SERVICE_PACKAGES_CONFIG;
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 3. Hook gia hạn gói cước cho chủ sân
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

// 4. Hook tạm dừng / kích hoạt lại cụm sân của chủ sân
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

// 5. Hook tạo gói dịch vụ SaaS mới
export function useCreatePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePackagePayload) => {
      try {
        return await apiClient.post('/service-packages', {
          name: payload.name,
          price: payload.price,
          description: payload.description,
          durationMonths: payload.durationMonths,
        });
      } catch (err) {
        console.warn('API create package fallback to local update', err);
        return payload;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEYS.packages });
    },
  });
}

// 6. Hook cập nhật chỉnh sửa gói dịch vụ SaaS
export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdatePackagePayload) => {
      try {
        await apiClient.put(`/service-packages/${payload.id}`, payload);
      } catch (err) {
        console.warn('API update package fallback to local cache update', err);
      }
      return payload;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ServicePackageConfigItem[]>(
        SUBSCRIPTIONS_QUERY_KEYS.packages,
        (prev) => {
          if (!prev) return prev;
          return prev.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  name: updated.name,
                  price: updated.price,
                  description: updated.description,
                  durationMonths: updated.durationMonths,
                  badge: updated.badge ?? item.badge,
                  features: updated.features ?? item.features,
                  isActive: updated.isActive ?? item.isActive,
                }
              : item
          );
        }
      );
    },
  });
}

// 7. Hook bật / tắt mở bán gói dịch vụ
export function useTogglePackageActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      try {
        await apiClient.patch(`/service-packages/${id}/status`, { isActive });
      } catch (err) {
        console.warn('API toggle package status fallback to local cache update', err);
      }
      return { id, isActive };
    },
    onSuccess: ({ id, isActive }) => {
      queryClient.setQueryData<ServicePackageConfigItem[]>(
        SUBSCRIPTIONS_QUERY_KEYS.packages,
        (prev) => {
          if (!prev) return prev;
          return prev.map((item) => (item.id === id ? { ...item, isActive } : item));
        }
      );
    },
  });
}

// 8. Hook xóa gói dịch vụ SaaS
export function useDeletePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(`/service-packages/${id}`);
      } catch (err) {
        console.warn('API delete package fallback to local cache update', err);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<ServicePackageConfigItem[]>(
        SUBSCRIPTIONS_QUERY_KEYS.packages,
        (prev) => {
          if (!prev) return prev;
          return prev.filter((item) => item.id !== deletedId);
        }
      );
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
