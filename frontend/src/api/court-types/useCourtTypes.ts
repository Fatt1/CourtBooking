import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  CourtTypeDto,
  CreateCourtTypePayload,
  UpdateCourtTypePayload,
} from './types';

/**
 * Hook lấy danh sách Loại sân theo chi nhánh của Chủ sân
 * Endpoint: GET /api/v1/owner/court-types?branchId={branchId}
 */
export function useCourtTypesQuery(branchId: string | null | undefined) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin' || user?.role === 'SystemAdmin';

  return useQuery({
    queryKey: ['owner', 'court-types', branchId],
    queryFn: async (): Promise<CourtTypeDto[]> => {
      if (!branchId) return [];
      const response = await apiClient.get<CourtTypeDto[]>(API_ENDPOINTS.COURTS.COURT_TYPES, {
        params: { branchId },
      });
      return (response as unknown as CourtTypeDto[]) || [];
    },
    enabled: isAuthenticated && isOwner && !!branchId,
    staleTime: 1000 * 60 * 3, // 3 phút cache fresh
  });
}

/**
 * Hook tạo Loại sân mới cho chi nhánh
 * Endpoint: POST /api/v1/owner/court-types
 */
export function useCreateCourtTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCourtTypePayload): Promise<string> => {
      const response = await apiClient.post<string>(API_ENDPOINTS.COURTS.CREATE_TYPE, payload);
      return response as unknown as string;
    },
    onSuccess: () => {
      // Invalidate danh sách loại sân
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
    },
  });
}

/**
 * Hook cập nhật Loại sân
 * Endpoint: PUT /api/v1/owner/court-types/{id}
 */
export function useUpdateCourtTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, minutesConfig }: UpdateCourtTypePayload): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.COURTS.UPDATE_TYPE(id), {
        name,
        minutesConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
    },
  });
}

/**
 * Hook xóa Loại sân (chỉ xóa khi chưa có sân con trực thuộc hoặc bảng giá)
 * Endpoint: DELETE /api/v1/owner/court-types/{id}
 */
export function useDeleteCourtTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.COURTS.DELETE_TYPE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'court-types'],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'courts'],
      });
    },
  });
}
