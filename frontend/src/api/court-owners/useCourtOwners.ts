import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import {
  type CourtOwnerItem,
  type CourtOwnerBackendDto,
  type GetCourtOwnersQueryParams,
  type PagedCourtOwnersResponse,
  type CreateCourtOwnerPayload,
  type ChangeCourtOwnerPackagePayload,
  type ExtendCourtOwnerSubscriptionPayload,
  MOCK_COURT_OWNERS_DATA,
} from './types';
import { recordSubscriptionHistoryChange } from '@/api/subscriptions';

interface BackendCourtOwnersResponse {
  items: CourtOwnerBackendDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Lưu trữ bộ nhớ đệm cục bộ khi chạy offline / demo
let localOwnersMemory = [...MOCK_COURT_OWNERS_DATA];

export function useCourtOwnersQuery(params: GetCourtOwnersQueryParams = {}) {
  const { search = '', status, page = 1, pageSize = 10 } = params;

  return useQuery<PagedCourtOwnersResponse>({
    queryKey: ['admin-court-owners', { search, status, page, pageSize }],
    queryFn: async (): Promise<PagedCourtOwnersResponse> => {
      try {
        const queryParams: Record<string, unknown> = {
          page,
          pageSize,
        };

        if (search.trim()) {
          queryParams.search = search.trim();
        }

        if (status !== undefined) {
          queryParams.status = status;
        }

        const response = (await apiClient.get(API_ENDPOINTS.ADMIN_COURT_OWNERS.LIST, {
          params: queryParams,
        })) as unknown as BackendCourtOwnersResponse;

        const mappedItems: CourtOwnerItem[] = (response?.items || []).map((u: CourtOwnerBackendDto) => {
          let startDate = u.packageStartDate;
          let endDate = u.packageEndDate;

          if (!startDate) {
            startDate = u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
          }
          if (!endDate) {
            const startD = new Date(startDate);
            const endD = new Date(startD);
            endD.setMonth(endD.getMonth() + 1);
            endDate = endD.toISOString().split('T')[0];
          }

          return {
            id: u.id,
            fullName: u.fullName,
            email: u.email || '',
            phoneNumber: u.phoneNumber || '',
            businessName: u.businessName,
            status: u.status === 0 ? 'active' : 'inactive',
            mustChangePwd: u.mustChangePwd,
            createdAt: u.createdAt,
            currentPackageName: u.currentPackageName || 'Gói Cơ bản',
            packageStartDate: startDate,
            packageEndDate: endDate,
            isPackageActive: u.isPackageActive ?? true,
          };
        });

        if (mappedItems.length === 0 && !search.trim() && status === undefined) {
          return {
            items: localOwnersMemory,
            totalCount: localOwnersMemory.length,
            page: 1,
            pageSize: 10,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
          };
        }

        return {
          items: mappedItems,
          totalCount: response?.totalCount ?? mappedItems.length,
          page: response?.page ?? page,
          pageSize: response?.pageSize ?? pageSize,
          totalPages: response?.totalPages ?? 1,
          hasPrevious: response?.hasPrevious ?? false,
          hasNext: response?.hasNext ?? false,
        };
      } catch (error) {
        console.warn('API error in useCourtOwnersQuery, using local mock data:', error);

        let filtered = [...localOwnersMemory];

        if (search.trim()) {
          const lower = search.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.fullName.toLowerCase().includes(lower) ||
              o.email.toLowerCase().includes(lower) ||
              (o.phoneNumber && o.phoneNumber.includes(lower))
          );
        }

        if (status !== undefined) {
          const expectedStatus = status === 0 ? 'active' : 'inactive';
          filtered = filtered.filter((o) => o.status === expectedStatus);
        }

        return {
          items: filtered,
          totalCount: filtered.length,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        };
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCourtOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCourtOwnerPayload) => {
      try {
        await apiClient.post(API_ENDPOINTS.ADMIN_COURT_OWNERS.CREATE, {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: payload.email,
          password: payload.password || 'Owner@123456',
          businessName: payload.businessName || `Cụm sân ${payload.fullName}`,
          mustChangePwd: payload.mustChangePwd ?? true,
        });
      } catch (err) {
        console.warn('API error in useCreateCourtOwnerMutation, saving to local memory:', err);
      }

      // Cập nhật bộ nhớ đệm
      const newOwner: CourtOwnerItem = {
        id: `owner-${Date.now()}`,
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        businessName: payload.businessName || `Cụm sân ${payload.fullName}`,
        status: 'active',
        currentPackageName: 'Basic',
        isPackageActive: true,
        packageStartDate: new Date().toISOString().split('T')[0],
        packageEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      localOwnersMemory = [newOwner, ...localOwnersMemory];

      // Ghi nhận ngay vào Lịch sử gói cước: Đăng ký mới gói Basic
      recordSubscriptionHistoryChange({
        courtOwnerId: newOwner.id,
        ownerName: payload.fullName,
        businessName: payload.businessName || `Cụm sân ${payload.fullName}`,
        packageName: 'Basic',
        actionType: 'Register',
        actionNote: 'Đăng ký mới gói Basic (499.000 đ / 1 tháng)',
        pricePaid: 499000,
      });

      queryClient.setQueriesData<PagedCourtOwnersResponse>(
        { queryKey: ['admin-court-owners'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [newOwner, ...old.items],
            totalCount: old.totalCount + 1,
          };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useChangeCourtOwnerPackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courtOwnerId,
      newPackageId,
      packageName,
      ownerName,
      businessName,
      price,
    }: ChangeCourtOwnerPackagePayload) => {
      try {
        await apiClient.put(API_ENDPOINTS.ADMIN_COURT_OWNERS.CHANGE_PACKAGE(courtOwnerId), {
          newPackageId,
        });
      } catch (err) {
        console.warn('API error in useChangeCourtOwnerPackageMutation, updating local mock:', err);
      }

      const item = localOwnersMemory.find((o) => o.id === courtOwnerId);
      const oldPackageName = item?.currentPackageName || 'Basic';
      if (item && packageName) {
        item.currentPackageName = packageName;
      }

      // Ghi nhận ngay vào lịch sử: Đổi gói cước
      const pricePaid =
        price ??
        (packageName?.toLowerCase().includes('ultra') || packageName?.toLowerCase().includes('vip')
          ? 2000000
          : packageName?.toLowerCase().includes('pro')
          ? 1000000
          : 499000);

      recordSubscriptionHistoryChange({
        courtOwnerId,
        ownerName: ownerName || item?.fullName || 'Chủ sân',
        businessName: businessName || item?.businessName || `Cụm sân ${item?.fullName || ''}`,
        packageName: packageName || 'Basic',
        previousPackageName: oldPackageName,
        actionType: 'ChangePackage',
        actionNote: `Đổi gói từ ${oldPackageName} sang ${packageName || 'Basic'}`,
        pricePaid,
      });

      queryClient.setQueriesData<PagedCourtOwnersResponse>(
        { queryKey: ['admin-court-owners'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((o) =>
              o.id === courtOwnerId ? { ...o, currentPackageName: packageName || o.currentPackageName } : o
            ),
          };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useExtendCourtOwnerSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courtOwnerId, durationMonths }: ExtendCourtOwnerSubscriptionPayload) => {
      try {
        await apiClient.post(API_ENDPOINTS.ADMIN_COURT_OWNERS.EXTEND_SUBSCRIPTION(courtOwnerId), {
          durationMonths,
        });
      } catch (err) {
        console.warn('API error in useExtendCourtOwnerSubscriptionMutation, updating local mock:', err);
      }

      const extendEndDate = (oldEndDate?: string) => {
        const base = oldEndDate ? new Date(oldEndDate) : new Date();
        const validBase = isNaN(base.getTime()) || base < new Date() ? new Date() : base;
        validBase.setMonth(validBase.getMonth() + durationMonths);
        return validBase.toISOString().split('T')[0];
      };

      const item = localOwnersMemory.find((o) => o.id === courtOwnerId);
      if (item) {
        item.isPackageActive = true;
        item.packageEndDate = extendEndDate(item.packageEndDate);

        // Ghi nhận vào Lịch sử: Gia hạn gói
        const pricePaid = item.currentPackageName?.includes('Ultra')
          ? 2000000
          : item.currentPackageName?.includes('Pro')
          ? 1000000
          : 499000;

        recordSubscriptionHistoryChange({
          courtOwnerId,
          ownerName: item.fullName,
          businessName: item.businessName || `Cụm sân ${item.fullName}`,
          packageName: item.currentPackageName || 'Basic',
          actionType: 'Extend',
          actionNote: `Gia hạn thêm ${durationMonths} tháng gói ${item.currentPackageName || 'Basic'}`,
          pricePaid,
        });
      }

      queryClient.setQueriesData<PagedCourtOwnersResponse>(
        { queryKey: ['admin-court-owners'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((o) =>
              o.id === courtOwnerId
                ? { ...o, isPackageActive: true, packageEndDate: extendEndDate(o.packageEndDate) }
                : o
            ),
          };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useUpdateCourtOwnerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courtOwnerId, status }: { courtOwnerId: string; status: number }) => {
      try {
        await apiClient.patch(API_ENDPOINTS.ADMIN_COURT_OWNERS.UPDATE_STATUS(courtOwnerId), {
          status,
        });
      } catch (err) {
        console.warn('API error in useUpdateCourtOwnerStatusMutation, updating local mock:', err);
      }

      const targetStatus: 'active' | 'inactive' = status === 0 ? 'active' : 'inactive';
      const item = localOwnersMemory.find((o) => o.id === courtOwnerId);
      if (item) {
        item.status = targetStatus;

        // Ghi nhận vào Lịch sử: Hủy gói / Tạm dừng hoặc Mở lại
        recordSubscriptionHistoryChange({
          courtOwnerId,
          ownerName: item.fullName,
          businessName: item.businessName || `Cụm sân ${item.fullName}`,
          packageName: item.currentPackageName || 'Basic',
          actionType: status === 1 ? 'Cancel' : 'Register',
          actionNote: status === 1 ? 'Hủy gói / Tạm dừng hoạt động cụm sân' : 'Mở lại hoạt động dịch vụ cụm sân',
          status: status === 1 ? 'Suspended' : 'Active',
          pricePaid: 0,
        });
      }

      queryClient.setQueriesData<PagedCourtOwnersResponse>(
        { queryKey: ['admin-court-owners'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((o) =>
              o.id === courtOwnerId ? { ...o, status: targetStatus } : o
            ),
          };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useDeleteCourtOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courtOwnerId: string) => {
      try {
        await apiClient.delete(API_ENDPOINTS.ADMIN_COURT_OWNERS.DELETE(courtOwnerId));
      } catch (err) {
        console.warn('API error in useDeleteCourtOwnerMutation, deleting local mock:', err);
      }

      localOwnersMemory = localOwnersMemory.filter((o) => o.id !== courtOwnerId);

      queryClient.setQueriesData<PagedCourtOwnersResponse>(
        { queryKey: ['admin-court-owners'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((o) => o.id !== courtOwnerId),
            totalCount: Math.max(0, old.totalCount - 1),
          };
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
    },
  });
}
