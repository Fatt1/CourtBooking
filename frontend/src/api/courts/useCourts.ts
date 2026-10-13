import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  CourtDto,
  GetCourtsParams,
  CreateCourtRequest,
  UpdateCourtRequest,
  UpdateCourtStatusRequest,
} from './types';

/**
 * Hook lấy danh sách sân theo chi nhánh của chủ sân
 * Endpoint: GET /api/v1/owner/courts?branchId={branchId}&courtTypeId={courtTypeId}&status={status}&search={search}
 */
export function useCourtsQuery(params: Partial<GetCourtsParams>) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin' || user?.role === 'SystemAdmin';
  const branchId = params.branchId;

  return useQuery({
    queryKey: ['owner', 'courts', params],
    queryFn: async (): Promise<CourtDto[]> => {
      if (!branchId) return [];
      const response = await apiClient.get<CourtDto[]>(API_ENDPOINTS.COURTS.LIST, {
        params: {
          branchId,
          ...(params.courtTypeId ? { courtTypeId: params.courtTypeId } : {}),
          ...(params.status !== undefined ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
        },
      });
      return (response as unknown as CourtDto[]) || [];
    },
    enabled: isAuthenticated && isOwner && Boolean(branchId),
    staleTime: 1000 * 60 * 2, // 2 phút cache
  });
}

/**
 * Hook lấy thông tin chi tiết một sân
 * Endpoint: GET /api/v1/owner/courts/{id}
 */
export function useCourtDetailQuery(id: string | null | undefined) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin' || user?.role === 'SystemAdmin';

  return useQuery({
    queryKey: ['owner', 'courts', 'detail', id],
    queryFn: async (): Promise<CourtDto | null> => {
      if (!id) return null;
      const response = await apiClient.get<CourtDto>(API_ENDPOINTS.COURTS.DETAIL(id));
      return (response as unknown as CourtDto) || null;
    },
    enabled: isAuthenticated && isOwner && Boolean(id),
  });
}

/**
 * Hook tạo sân mới
 * Endpoint: POST /api/v1/owner/courts
 */
export function useCreateCourtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCourtRequest): Promise<string> => {
      const response = await apiClient.post<string>(API_ENDPOINTS.COURTS.CREATE, payload);
      return response as unknown as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
    },
  });
}

/**
 * Hook cập nhật thông tin sân (tên hoặc loại sân)
 * Endpoint: PUT /api/v1/owner/courts/{id}
 */
export function useUpdateCourtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCourtRequest }): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.COURTS.UPDATE(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
    },
  });
}

/**
 * Hook đổi trạng thái sân (Hoạt động / Bảo trì)
 * Endpoint: PUT /api/v1/owner/courts/{id}/status
 */
export function useUpdateCourtStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCourtStatusRequest }): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.COURTS.UPDATE_STATUS(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
    },
  });
}

/**
 * Hook xóa sân
 * Endpoint: DELETE /api/v1/owner/courts/{id}
 */
export function useDeleteCourtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.COURTS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
    },
  });
}
