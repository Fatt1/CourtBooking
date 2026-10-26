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
} from './types';

interface BackendCourtOwnersResponse {
  items: CourtOwnerBackendDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function useCourtOwnersQuery(params: GetCourtOwnersQueryParams = {}) {
  const { search = '', status, page = 1, pageSize = 10 } = params;

  return useQuery<PagedCourtOwnersResponse>({
    queryKey: ['admin-court-owners', { search, status, page, pageSize }],
    queryFn: async (): Promise<PagedCourtOwnersResponse> => {
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
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email || '',
          phoneNumber: u.phoneNumber || '',
          businessName: u.businessName,
          status: u.status === 0 ? 'active' : 'inactive',
          mustChangePwd: u.mustChangePwd,
          createdAt: u.createdAt,
          currentPackageName: u.currentPackageName || '—',
          packageStartDate: u.packageStartDate || undefined,
          packageEndDate: u.packageEndDate || undefined,
          isPackageActive: u.isPackageActive ?? false,
          remainingDays: u.remainingDays ?? 0,
        };
      });

      return {
        items: mappedItems,
        totalCount: response?.totalCount ?? mappedItems.length,
        page: response?.page ?? page,
        pageSize: response?.pageSize ?? pageSize,
        totalPages: response?.totalPages ?? 1,
        hasPrevious: response?.hasPrevious ?? false,
        hasNext: response?.hasNext ?? false,
      };
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCourtOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCourtOwnerPayload) => {
      const packageId = payload.servicePackageId || payload.packageId;
      return await apiClient.post(API_ENDPOINTS.ADMIN_COURT_OWNERS.CREATE, {
        fullName: payload.fullName.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        email: payload.email.trim(),
        password: payload.password,
        servicePackageId: packageId,
        businessName: payload.businessName?.trim() || `Cụm sân ${payload.fullName.trim()}`,
        mustChangePwd: payload.mustChangePwd ?? true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'admin', 'saas-revenue'] });
    },
  });
}

export function useChangeCourtOwnerPackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courtOwnerId,
      newPackageId,
    }: ChangeCourtOwnerPackagePayload) => {
      return await apiClient.put(API_ENDPOINTS.ADMIN_COURT_OWNERS.CHANGE_PACKAGE(courtOwnerId), {
        newPackageId,
      });
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
      return await apiClient.post(API_ENDPOINTS.ADMIN_COURT_OWNERS.EXTEND_SUBSCRIPTION(courtOwnerId), {
        durationMonths,
      });
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
      return await apiClient.patch(API_ENDPOINTS.ADMIN_COURT_OWNERS.UPDATE_STATUS(courtOwnerId), {
        status,
      });
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
      return await apiClient.delete(API_ENDPOINTS.ADMIN_COURT_OWNERS.DELETE(courtOwnerId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-court-owners'] });
    },
  });
}
