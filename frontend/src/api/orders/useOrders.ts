import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PagedList } from '@/types/api';
import {
  type DailyOrderDto,
  type DailyOrderResponse,
  type GetDailyOrdersParams,
  type CancelOrderByOwnerPayload,
  type UpdateCustomerInfoPayload,
  type UpdateOrderServicesPayload,
  type AddPaymentTransactionPayload,
  type CreateOrderByOwnerPayload,
} from './types';

// ============================================================================
// HOOKS GỌI TRỰC TIẾP API BACKEND (KHÔNG SỬ DỤNG FALLBACK MOCK DATA)
// ============================================================================

/**
 * Hook lấy danh sách đơn hàng đặt ngày tại chi nhánh
 * Endpoint: GET /api/v1/owner/orders?branchId=...&status=...&fromDate=...&toDate=...&search=...&page=...&pageSize=...
 */
export function useDailyOrdersQuery(params: GetDailyOrdersParams) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<PagedList<DailyOrderDto>>({
    queryKey: ['owner', 'orders', 'daily', params],
    queryFn: async (): Promise<PagedList<DailyOrderDto>> => {
      if (!params.branchId) {
        return {
          items: [],
          totalCount: 0,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        };
      }

      const response = await apiClient.get<PagedList<DailyOrderDto>>(
        API_ENDPOINTS.ORDERS.OWNER_LIST,
        { params }
      );
      return (
        (response as unknown as PagedList<DailyOrderDto>) || {
          items: [],
          totalCount: 0,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        }
      );
    },
    enabled: isAuthenticated && isOwner && !!params.branchId,
    staleTime: 1000 * 30, // 30s cache
  });
}

/**
 * Hook lấy chi tiết đơn hàng ngày
 * Endpoint: GET /api/v1/owner/orders/{id}
 */
export function useDailyOrderDetailQuery(orderId: string | null) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<DailyOrderResponse>({
    queryKey: ['owner', 'orders', 'daily-detail', orderId],
    queryFn: async (): Promise<DailyOrderResponse> => {
      if (!orderId) throw new Error('orderId is required');

      const response = await apiClient.get<DailyOrderResponse>(
        API_ENDPOINTS.ORDERS.OWNER_DETAIL(orderId)
      );
      return response as unknown as DailyOrderResponse;
    },
    enabled: isAuthenticated && isOwner && !!orderId,
  });
}

/**
 * Hook xác nhận đơn đặt sân (PUT /api/v1/owner/orders/{orderId}/confirmation)
 */
export function useConfirmOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      return await apiClient.put(API_ENDPOINTS.ORDERS.CONFIRM(orderId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
    },
  });
}

/**
 * Hook hoàn thành đơn đặt sân (PUT /api/v1/owner/orders/{orderId}/completion)
 */
export function useCompleteOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      return await apiClient.put(API_ENDPOINTS.ORDERS.COMPLETE(orderId));
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', orderId],
      });
    },
  });
}

/**
 * Hook hủy đơn đặt sân bởi chủ sân (PUT /api/v1/owner/orders/{orderId}/cancellation)
 */
export function useCancelOrderByOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...payload }: CancelOrderByOwnerPayload) => {
      return await apiClient.put(API_ENDPOINTS.ORDERS.CANCEL(orderId), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
    },
  });
}

/**
 * Hook cập nhật thông tin khách hàng (PUT /api/v1/owner/orders/{id}/customer-info)
 */
export function useUpdateCustomerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...payload }: UpdateCustomerInfoPayload) => {
      return await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_CUSTOMER(orderId), {
        orderId,
        ...payload,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
    },
  });
}

/**
 * Hook cập nhật dịch vụ đính kèm của đơn hàng (PUT /api/v1/owner/orders/{orderId}/services)
 */
export function useUpdateOrderServicesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, services }: UpdateOrderServicesPayload) => {
      return await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_SERVICES(orderId), {
        orderId,
        services,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
    },
  });
}

/**
 * Hook thu thêm tiền cho đơn hàng (POST /api/v1/owner/orders/{orderId}/payments)
 */
export function useAddPaymentTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...payload }: AddPaymentTransactionPayload) => {
      return await apiClient.post(API_ENDPOINTS.ORDERS.ADD_PAYMENT(orderId), {
        orderId,
        ...payload,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
    },
  });
}

/**
 * Tạo đơn đặt sân trực tiếp từ chủ sân
 * POST /api/v1/owner/orders
 */
export async function createOrderByOwner(payload: CreateOrderByOwnerPayload): Promise<string> {
  const response = await apiClient.post<string>(API_ENDPOINTS.ORDERS.CREATE_BY_OWNER, payload);
  return response as unknown as string;
}

export function useCreateOrderByOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrderByOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'one-time-booking'] });
    },
  });
}


