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
  type CreateFixedOrderByOwnerPayload,
  type UpdateOrderItemsPayload,
  type CreateOrderOnlinePayload,
  type CreateOrderOnlineResponse,
  type SubmitPaymentProofPayload,
  type CancelOrderOnlinePayload,
  type MyOrderDetailResponse,
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

/**
 * Cập nhật danh sách ca sân (OrderDetails / Items) của đơn hàng
 * PUT /api/v1/owner/orders/{id}/items
 */
export async function updateOrderItems(payload: UpdateOrderItemsPayload): Promise<void> {
  await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_ITEMS(payload.orderId), {
    orderId: payload.orderId,
    courtBookingSlots: payload.courtBookingSlots,
  });
}

export function useUpdateOrderItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderItems,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['branches', 'one-time-booking'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
    },
  });
}

/**
 * Tạo đơn đặt lịch cố định từ chủ sân
 * POST /api/v1/owner/orders/fixed
 */
export async function createFixedOrderByOwner(payload: CreateFixedOrderByOwnerPayload): Promise<string> {
  const response = await apiClient.post<string>(API_ENDPOINTS.ORDERS.FIXED_LIST, payload);
  return response as unknown as string;
}

export function useCreateFixedOrderByOwnerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFixedOrderByOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'one-time-booking'] });
    },
  });
}

/**
 * Hook lấy danh sách đơn đặt lịch cố định tại chi nhánh (GET /api/v1/owner/orders/fixed)
 */
export function useFixedOrdersQuery(params: import('./types').GetFixedOrdersParams) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<PagedList<import('./types').FixedOrderDto>>({
    queryKey: ['owner', 'orders', 'fixed-list', params],
    queryFn: async (): Promise<PagedList<import('./types').FixedOrderDto>> => {
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

      const response = await apiClient.get<PagedList<import('./types').FixedOrderDto>>(
        API_ENDPOINTS.ORDERS.FIXED_LIST,
        { params }
      );
      return (
        (response as unknown as PagedList<import('./types').FixedOrderDto>) || {
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
    staleTime: 1000 * 30,
  });
}

/**
 * Hook lấy chi tiết đơn đặt lịch cố định (GET /api/v1/owner/orders/fixed/{id})
 */
export function useFixedOrderDetailQuery(orderId: string | null) {
  const { isAuthenticated, user } = useAuthStore();
  const isOwner = user?.role === 'CourtOwner' || user?.role === 'Admin';

  return useQuery<import('./types').FixedOrderResponse>({
    queryKey: ['owner', 'orders', 'fixed-detail', orderId],
    queryFn: async (): Promise<import('./types').FixedOrderResponse> => {
      if (!orderId) throw new Error('orderId is required');

      const response = await apiClient.get<import('./types').FixedOrderResponse>(
        API_ENDPOINTS.ORDERS.FIXED_DETAIL(orderId)
      );
      return response as unknown as import('./types').FixedOrderResponse;
    },
    enabled: isAuthenticated && isOwner && !!orderId,
  });
}

/**
 * Hook hủy / xóa 1 ca sân lẻ trong đơn hàng kèm hoàn tiền nếu có
 * PUT /api/v1/owner/orders/{orderId}/slots/{orderDetailId}/cancellation
 */
export function useCancelOrderSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      orderDetailId,
      ...payload
    }: import('./types').CancelOrderSlotPayload) => {
      return await apiClient.put(
        API_ENDPOINTS.ORDERS.CANCEL_SLOT(orderId, orderDetailId),
        payload
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'fixed-detail', variables.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
    },
  });
}

/**
 * Hook thêm ca sân lẻ vào đơn hàng (đơn ngày hoặc đơn cố định)
 * POST /api/v1/owner/orders/{orderId}/slots
 */
export function useAddOrderSlotsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      courtSlots,
    }: import('./types').AddOrderSlotsPayload) => {
      return await apiClient.post(API_ENDPOINTS.ORDERS.ADD_SLOTS(orderId), {
        orderId,
        courtSlots,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'fixed-detail', variables.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'daily-detail', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'one-time-booking'] });
    },
  });
}

/**
 * Hook thêm chu kì cố định mới vào đơn hàng
 * POST /api/v1/owner/orders/fixed/{orderId}/cycles
 */
export function useAddFixedOrderCycleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      ...payload
    }: import('./types').AddFixedOrderCyclePayload) => {
      return await apiClient.post(
        API_ENDPOINTS.ORDERS.ADD_FIXED_CYCLE(orderId),
        payload
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'fixed-detail', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
    },
  });
}

/**
 * Hook cập nhật chu kì cố định của đơn hàng
 * PUT /api/v1/owner/orders/fixed/{orderId}/cycles/{cycleId}
 */
export function useUpdateFixedOrderCycleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      cycleId,
      ...payload
    }: import('./types').UpdateFixedOrderCyclePayload) => {
      return await apiClient.put(
        API_ENDPOINTS.ORDERS.UPDATE_FIXED_CYCLE(orderId, cycleId),
        payload
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'fixed-detail', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
    },
  });
}

/**
 * Hook xóa một chu kì cố định khỏi đơn hàng
 * DELETE /api/v1/owner/orders/fixed/{orderId}/cycles/{cycleId}
 */
export function useDeleteFixedOrderCycleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      cycleId,
    }: import('./types').DeleteFixedOrderCyclePayload) => {
      return await apiClient.delete(
        API_ENDPOINTS.ORDERS.DELETE_FIXED_CYCLE(orderId, cycleId)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'orders'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'orders', 'fixed-detail', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
    },
  });
}

/**
 * Hook lấy danh sách đơn đặt sân của người chơi có phân trang (GET /api/v1/orders/my-orders)
 */
export function useMyOrdersPagedQuery(params: import('./types').GetMyOrdersParams = {}) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<PagedList<import('./types').MyOrderDto>>({
    queryKey: ['orders', 'my-orders-paged', params],
    queryFn: async (): Promise<PagedList<import('./types').MyOrderDto>> => {
      const response = await apiClient.get<PagedList<import('./types').MyOrderDto>>(
        API_ENDPOINTS.ORDERS.MY_ORDERS,
        {
          params: {
            status: params.status,
            page: params.page || 1,
            pageSize: params.pageSize || 5,
          },
        }
      );
      return (
        (response as unknown as PagedList<import('./types').MyOrderDto>) || {
          items: [],
          totalCount: 0,
          page: params.page || 1,
          pageSize: params.pageSize || 5,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        }
      );
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 15,
  });
}

/**
 * Hook lấy toàn bộ danh sách đơn đặt sân của người chơi (dành cho modal chọn đơn mở kèo)
 */
export function useMyOrdersQuery(status?: import('./types').OrderStatus) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<import('./types').MyOrderDto[]>({
    queryKey: ['orders', 'my-orders', { status }],
    queryFn: async (): Promise<import('./types').MyOrderDto[]> => {
      const response = await apiClient.get<PagedList<import('./types').MyOrderDto> | import('./types').MyOrderDto[]>(
        API_ENDPOINTS.ORDERS.MY_ORDERS,
        { params: { status, page: 1, pageSize: 100 } }
      );
      if (Array.isArray(response)) return response;
      if (response && 'items' in (response as any) && Array.isArray((response as any).items)) {
        return (response as any).items;
      }
      return [];
    },
    enabled: isAuthenticated,
  });
}

/**
 * Hook lấy chi tiết đơn đặt sân của người chơi
 * Endpoint: GET /api/v1/orders/my-orders/{id}
 */
export function useMyOrderDetailQuery(orderId: string | null | undefined, enabled: boolean = true) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<MyOrderDetailResponse>({
    queryKey: ['orders', 'my-orders', 'detail', orderId],
    queryFn: async (): Promise<MyOrderDetailResponse> => {
      if (!orderId) throw new Error('orderId is required');

      const response = await apiClient.get<MyOrderDetailResponse>(
        API_ENDPOINTS.ORDERS.MY_ORDER_DETAIL(orderId)
      );
      return response as unknown as MyOrderDetailResponse;
    },
    enabled: isAuthenticated && !!orderId && enabled,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook tạo đơn đặt sân online (POST /api/v1/orders)
 */
export function useCreateOrderOnlineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderOnlinePayload): Promise<CreateOrderOnlineResponse> => {
      const response = await apiClient.post<CreateOrderOnlineResponse>(
        API_ENDPOINTS.ORDERS.CREATE_ONLINE,
        payload
      );
      return response as unknown as CreateOrderOnlineResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
    },
  });
}

/**
 * Hook nộp ảnh biên lai thanh toán (PUT /api/v1/orders/{id}/payment-proof)
 */
export function useSubmitPaymentProofMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, imageId }: SubmitPaymentProofPayload) => {
      return await apiClient.put(
        API_ENDPOINTS.ORDERS.SUBMIT_PAYMENT_PROOF(orderId),
        { orderId, imageId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook hủy đơn online đang chờ thanh toán (PUT /api/v1/orders/{id}/cancel)
 */
export function useCancelOrderOnlineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: CancelOrderOnlinePayload) => {
      return await apiClient.put(
        API_ENDPOINTS.ORDERS.CANCEL_ONLINE(orderId),
        { orderId, reason }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['branches', 'from-time-booking'] });
    },
  });
}
