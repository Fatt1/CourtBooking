import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  OwnerBranchListItem,
  OwnerBranchDetail,
  UpdateBranchStatusPayload,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '../types/branch';

/**
 * Hook lấy danh sách chi nhánh thuộc sở hữu của Chủ sân hiện tại
 * Endpoint: GET /api/v1/owner/branches
 */
export function useOwnerBranchesQuery() {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery({
    queryKey: ['owner', 'branches'],
    queryFn: async (): Promise<OwnerBranchListItem[]> => {
      const response = await apiClient.get<OwnerBranchListItem[]>(API_ENDPOINTS.BRANCHES.OWNER_LIST);
      return (response as unknown as OwnerBranchListItem[]) || [];
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 1000 * 60 * 5, // 5 phút cache fresh
  });
}

/**
 * Hook xem chi tiết một chi nhánh của Chủ sân
 * Endpoint: GET /api/v1/owner/branches/{id}
 */
export function useOwnerBranchDetailQuery(branchId: string | null) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery({
    queryKey: ['owner', 'branches', branchId],
    queryFn: async (): Promise<OwnerBranchDetail> => {
      if (!branchId) throw new Error('branchId is required');
      const response = await apiClient.get<OwnerBranchDetail>(
        API_ENDPOINTS.BRANCHES.OWNER_DETAIL(branchId)
      );
      return response as unknown as OwnerBranchDetail;
    },
    enabled: isAuthenticated && isOwner && !!branchId,
  });
}

/**
 * Hook bật / tắt trạng thái hoạt động của chi nhánh
 * Endpoint: PUT /api/v1/owner/branches/{id}/status
 */
export function useUpdateBranchStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: UpdateBranchStatusPayload) => {
      await apiClient.put(API_ENDPOINTS.BRANCHES.UPDATE_STATUS(id), { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
    },
  });
}

/**
 * Hook xóa chi nhánh (khi chưa có dữ liệu phụ thuộc)
 * Endpoint: DELETE /api/v1/owner/branches/{id}
 */
export function useDeleteBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.BRANCHES.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
    },
  });
}

/**
 * Hook tạo chi nhánh mới cho Chủ sân
 * Endpoint: POST /api/v1/owner/branches
 */
export function useCreateBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBranchPayload) => {
      return await apiClient.post<string>(API_ENDPOINTS.BRANCHES.CREATE, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
    },
  });
}

/**
 * Hook cập nhật thông tin chi nhánh của Chủ sân
 * Endpoint: PUT /api/v1/owner/branches/{id}
 */
export function useUpdateBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateBranchPayload) => {
      return await apiClient.put(API_ENDPOINTS.BRANCHES.UPDATE(id), payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches', variables.id] });
    },
  });
}

/**
 * Hook cập nhật cấu hình VietQR thụ hưởng cho chi nhánh
 */
export function useUpdateVietQRMutation(branchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qrConfig: { bankName: string; accountNo: string; accountHolder: string }) => {
      return await apiClient.put(API_ENDPOINTS.BRANCHES.CONFIG_VIETQR(branchId), qrConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
    },
  });
}
