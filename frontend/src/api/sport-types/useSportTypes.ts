import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  SportTypeItem,
  AdminSportTypeDto,
  CreateSportTypeRequest,
  UpdateSportTypeRequest,
} from './types';

/**
 * Hook lấy danh sách các môn thể thao hệ thống hỗ trợ
 * Dùng chung cho cả Public (trang chủ, tìm kiếm) và Court Owner (tạo/sửa chi nhánh, lọc sân)
 * Endpoint: GET /api/v1/sport-types (AllowAnonymous)
 */
export function useSportTypesQuery() {
  return useQuery<SportTypeItem[]>({
    queryKey: ['sport-types'],
    queryFn: async (): Promise<SportTypeItem[]> => {
      try {
        const response = await apiClient.get<SportTypeItem[]>(API_ENDPOINTS.SPORT_TYPES.LIST);
        return (response as unknown as SportTypeItem[]) || [];
      } catch (err) {
        console.warn('API sport-types lỗi hoặc chưa có dữ liệu, trả về danh sách rỗng:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 phút cache
  });
}

/**
 * Hook lấy danh sách tất cả môn thể thao dành cho Quản trị viên (CourtOS Admin)
 * Endpoint: GET /api/v1/admin/sport-types
 */
export function useAdminSportTypesQuery() {
  return useQuery<AdminSportTypeDto[]>({
    queryKey: ['admin-sport-types'],
    queryFn: async (): Promise<AdminSportTypeDto[]> => {
      const response = await apiClient.get<AdminSportTypeDto[]>(API_ENDPOINTS.SPORT_TYPES.ADMIN_LIST);
      return (response as unknown as AdminSportTypeDto[]) || [];
    },
    staleTime: 1000 * 60 * 2, // 2 phút cache
  });
}

/**
 * Hook tạo mới môn thể thao dành cho Admin
 * Endpoint: POST /api/v1/admin/sport-types
 */
export function useCreateSportTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSportTypeRequest): Promise<string> => {
      const response = await apiClient.post<string>(API_ENDPOINTS.SPORT_TYPES.CREATE, payload);
      return response as unknown as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sport-types'] });
      queryClient.invalidateQueries({ queryKey: ['sport-types'] });
    },
  });
}

/**
 * Hook cập nhật môn thể thao dành cho Admin
 * Endpoint: PUT /api/v1/admin/sport-types/{id}
 */
export function useUpdateSportTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSportTypeRequest }): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.SPORT_TYPES.UPDATE(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sport-types'] });
      queryClient.invalidateQueries({ queryKey: ['sport-types'] });
    },
  });
}

/**
 * Hook xóa môn thể thao dành cho Admin
 * Endpoint: DELETE /api/v1/admin/sport-types/{id}
 */
export function useDeleteSportTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.SPORT_TYPES.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sport-types'] });
      queryClient.invalidateQueries({ queryKey: ['sport-types'] });
    },
  });
}
