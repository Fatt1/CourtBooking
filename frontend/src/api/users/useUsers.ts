import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import {
  type UserItem,
  type UserSummaryBackendDto,
  type GetUsersQueryParams,
  type PagedUsersResponse,
} from './types';

interface BackendUsersResponse {
  items: UserSummaryBackendDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Hook Query lấy danh sách người dùng cho Quản trị viên (Admin)
 * Hỗ trợ phân trang, tìm kiếm, lọc trạng thái và hiển thị cả tài khoản đã xóa mềm
 */
export function useUsersQuery(params: GetUsersQueryParams = {}) {
  const {
    search = '',
    accountType = 0, // Mặc định 0 = Player (Người dùng / Người chơi)
    status,
    includeDeleted = true, // Luôn hỗ trợ xem tài khoản đã xóa mềm
    page = 1,
    pageSize = 10,
  } = params;

  return useQuery<PagedUsersResponse>({
    queryKey: ['admin-users', { search, accountType, status, includeDeleted, page, pageSize }],
    queryFn: async (): Promise<PagedUsersResponse> => {
      const queryParams: Record<string, unknown> = {
        page,
        pageSize,
        includeDeleted,
      };

      if (search.trim()) {
        queryParams.search = search.trim();
      }

      if (accountType !== undefined) {
        queryParams.accountType = accountType;
      }

      if (status !== undefined) {
        queryParams.status = status;
      }

      const response = (await apiClient.get(API_ENDPOINTS.USERS.LIST, {
        params: queryParams,
      })) as unknown as BackendUsersResponse;

      const mappedItems: UserItem[] = (response?.items || []).map((u: UserSummaryBackendDto) => ({
        id: u.id,
        name: u.fullName,
        fullName: u.fullName,
        email: u.email || '',
        phoneNumber: u.phoneNumber || '',
        role: u.role || 'Player',
        accountType: u.accountType,
        status: u.status === 0 ? 'active' : 'inactive',
        isDeleted: u.isDeleted,
        createdAt: u.createdAt,
      }));

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

/**
 * Hook Mutation thay đổi trạng thái tài khoản (Khóa / Mở khóa)
 */
export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: number }) => {
      await apiClient.patch(API_ENDPOINTS.USERS.UPDATE_STATUS(userId), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

/**
 * Hook Mutation xóa mềm người dùng (Soft Delete: isDeleted = true, status = inactive)
 * Giữ nguyên bản ghi trong cơ sở dữ liệu để bảo toàn lịch sử đặt sân và thống kê
 */
export function useSoftDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

/**
 * Hook Mutation khôi phục tài khoản người dùng đã xóa mềm (Restore: isDeleted = false, status = active)
 */
export function useRestoreUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post(API_ENDPOINTS.USERS.RESTORE(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
