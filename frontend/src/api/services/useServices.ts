import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PagedList } from '@/types/api';
import type {
  BranchCategoryServicesDto,
  BranchServiceItemDto,
  ServiceByBranchDto,
  OwnerServiceDto,
  GetServicesByBranchParams,
  GetOwnerServicesParams,
  CreateServicePayload,
  UpdateServicePayload,
} from './types';

/**
 * Hook lấy danh sách dịch vụ của một chi nhánh (Public / Booking / POS)
 * Endpoint: GET /api/v1/services/{branchId}
 * Trả về danh sách loại dịch vụ kèm danh sách sản phẩm
 */
export function useServicesByBranchQuery(params: GetServicesByBranchParams) {
  const { branchId } = params;

  return useQuery<BranchCategoryServicesDto[]>({
    queryKey: ['services', 'by-branch', branchId],
    queryFn: async (): Promise<BranchCategoryServicesDto[]> => {
      if (!branchId) return [];
      try {
        const response = await apiClient.get<BranchCategoryServicesDto[]>(
          API_ENDPOINTS.SERVICES.PUBLIC_BY_BRANCH(branchId)
        );
        return (response as unknown as BranchCategoryServicesDto[]) || [];
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
export function useOwnerServicesQuery(params?: GetOwnerServicesParams, enabled = true) {
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
    enabled: enabled && isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOwnerServiceDetailQuery(id: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['owner', 'services', 'detail', id],
    queryFn: async (): Promise<OwnerServiceDto> => {
      const response = await apiClient.get<OwnerServiceDto>(API_ENDPOINTS.SERVICES.OWNER_DETAIL(id!));
      return response as unknown as OwnerServiceDto;
    },
    enabled: isAuthenticated && Boolean(id),
    staleTime: 0,
  });
}

function useInvalidateServices() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['owner', 'services'] }),
      client.invalidateQueries({ queryKey: ['services', 'by-branch'] }),
      client.invalidateQueries({ queryKey: ['owner', 'service-categories'] }),
    ]);
  };
}

export function useCreateServiceMutation() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (payload: CreateServicePayload): Promise<string> => {
      const response = await apiClient.post<string>(API_ENDPOINTS.SERVICES.CREATE, payload);
      return response as unknown as string;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateServiceMutation() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateServicePayload) => {
      await apiClient.put(API_ENDPOINTS.SERVICES.UPDATE(id), payload);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateServiceStatusMutation() {
  const client = useQueryClient();
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async ({ id, branchId, isActive }: { id: string; branchId: string; isActive: boolean }) => {
      await apiClient.put(API_ENDPOINTS.SERVICES.UPDATE_STATUS(id, branchId), { isActive });
    },
    onMutate: async ({ id, branchId, isActive }) => {
      const listFilter = { queryKey: ['owner', 'services'], predicate: (query: { queryKey: readonly unknown[] }) =>
        query.queryKey.length === 3 && typeof query.queryKey[2] === 'object' };
      await client.cancelQueries(listFilter);
      const previousLists = client.getQueriesData<PagedList<OwnerServiceDto>>(listFilter);
      const detailKey = ['owner', 'services', 'detail', id];
      await client.cancelQueries({ queryKey: detailKey });
      const previousDetail = client.getQueryData<OwnerServiceDto>(detailKey);
      const updateItem = (item: OwnerServiceDto): OwnerServiceDto => item.id !== id ? item : {
        ...item,
        branches: item.branches.map((branch) => branch.branchId === branchId ? { ...branch, isActive } : branch),
      };
      client.setQueriesData<PagedList<OwnerServiceDto>>(listFilter,
        (data) => data ? { ...data, items: data.items.map(updateItem) } : data);
      client.setQueryData<OwnerServiceDto>(detailKey, (data) => data ? updateItem(data) : data);
      return { previousLists, previousDetail, detailKey };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([key, data]) => client.setQueryData(key, data));
      if (context?.previousDetail) client.setQueryData(context.detailKey, context.previousDetail);
    },
    onSettled: invalidate,
  });
}
