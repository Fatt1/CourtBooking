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
  PublicBranchListItemDto,
  PublicBranchDetailDto,
  PagedList,
  SearchBranchesParams,
  OneTimeBookingScheduleDto,
  TimeBookingScheduleDto,
} from './types';

// ==========================================
// 1. DÀNH CHO COURT OWNER & ADMIN
// ==========================================

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

// ==========================================
// 2. DÀNH CHO NGƯỜI DÙNG CÔNG KHAI (PUBLIC)
// ==========================================

/**
 * Hook tìm kiếm chi nhánh & sân công khai
 * Gọi Endpoint: GET /api/v1/branches (SearchPublicBranches)
 */
export function usePublicBranchesQuery(params: SearchBranchesParams = { page: 1, pageSize: 6 }) {
  return useQuery<PagedList<PublicBranchListItemDto>>({
    queryKey: ['public', 'branches', params],
    queryFn: async () => {
      try {
        const response = await apiClient.get<PagedList<PublicBranchListItemDto>>(
          API_ENDPOINTS.BRANCHES.PUBLIC_SEARCH,
          { params }
        );
        return response as unknown as PagedList<PublicBranchListItemDto>;
      } catch (err) {
        console.warn('API branches chưa kết nối được backend, fallback dữ liệu mẫu:', err);
        return {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: params.pageSize || 6,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}

/**
 * Hook lấy chi tiết chi nhánh công khai
 * Endpoint: GET /api/v1/branches/{id}
 */
export async function getPublicBranchDetail(
  branchId: string,
  params?: { latitude?: number; longitude?: number }
): Promise<PublicBranchDetailDto> {
  const response = await apiClient.get<PublicBranchDetailDto>(
    API_ENDPOINTS.BRANCHES.PUBLIC_DETAIL(branchId),
    { params }
  );
  return response as unknown as PublicBranchDetailDto;
}

export function usePublicBranchDetailQuery(
  branchId?: string,
  params?: { latitude?: number; longitude?: number }
) {
  return useQuery<PublicBranchDetailDto>({
    queryKey: ['public', 'branch-detail', branchId, params],
    queryFn: () => getPublicBranchDetail(branchId!, params),
    enabled: Boolean(branchId),
    staleTime: 1000 * 60 * 3, // 3 phút cache
  });
}

/**
 * Lấy lịch đặt sân theo ngày cho chi nhánh (phục vụ timeline đặt sân)
 * GET /api/v1/branches/get-one-time-booking?branchId={branchId}&date={date}
 */
export async function getOneTimeBooking(
  branchId: string,
  date: string
): Promise<OneTimeBookingScheduleDto> {
  const response = await apiClient.get<OneTimeBookingScheduleDto>(
    API_ENDPOINTS.BRANCHES.GET_ONE_TIME_BOOKING,
    { params: { branchId, date } }
  );
  return response as unknown as OneTimeBookingScheduleDto;
}

export function useOneTimeBookingQuery(branchId?: string, date?: string) {
  return useQuery<OneTimeBookingScheduleDto>({
    queryKey: ['branches', 'one-time-booking', branchId, date],
    queryFn: () => getOneTimeBooking(branchId!, date!),
    enabled: Boolean(branchId && date),
    staleTime: 1000 * 30, // 30s cache
  });
}

/**
 * Lấy lịch đặt sân theo khoảng ngày (tối đa 1 tháng) nhóm theo Thứ và Loại sân
 * GET /api/v1/owner/branches/get-from-time-booking?branchId={branchId}&fromDate={fromDate}&toDate={toDate}
 */
export async function getFromTimeBooking(
  branchId: string,
  fromDate: string,
  toDate: string
): Promise<TimeBookingScheduleDto> {
  const response = await apiClient.get<TimeBookingScheduleDto>(
    API_ENDPOINTS.BRANCHES.OWNER_GET_FROM_TIME_BOOKING,
    { params: { branchId, fromDate, toDate } }
  );
  return response as unknown as TimeBookingScheduleDto;
}

export function useFromTimeBookingQuery(branchId?: string, fromDate?: string, toDate?: string) {
  return useQuery<TimeBookingScheduleDto>({
    queryKey: ['branches', 'from-time-booking', branchId, fromDate, toDate],
    queryFn: () => getFromTimeBooking(branchId!, fromDate!, toDate!),
    enabled: Boolean(branchId && fromDate && toDate),
    staleTime: 1000 * 30, // 30s cache
  });
}


