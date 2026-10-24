import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PagedList } from '@/types/api';
import type { OwnerServiceDto } from '@/api/services';
import type { CreateRetailOrderPayload, RetailOrderDto } from './types';
import type { RetailOrderFilters, RetailOrderListItemDto, RetailOrderSummaryDto } from './types';

export const retailOrderCode = (id: string) => `HD-${id.slice(0, 8).toUpperCase()}`;

export async function fetchAllRetailOrders(filters: RetailOrderFilters, signal?: AbortSignal) {
  const { search, ...params } = filters;
  const items: RetailOrderListItemDto[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get<PagedList<RetailOrderListItemDto>>(API_ENDPOINTS.POS.ORDER_LIST, {
      params: {
        ...params,
        search: search?.trim() || undefined,
        page,
        pageSize: 100,
      },
      signal,
    });
    const data = response as unknown as PagedList<RetailOrderListItemDto>;
    items.push(...data.items);
    totalPages = data.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

export function summarizeRetailOrders(items: RetailOrderListItemDto[]): RetailOrderSummaryDto {
  return items.reduce((sum, item) => ({ totalOrders: sum.totalOrders + 1, totalItems: sum.totalItems + item.totalQuantity,
    grossRevenue: sum.grossRevenue + item.subtotal, totalDiscount: sum.totalDiscount + item.discountAmount,
    netRevenue: sum.netRevenue + item.totalAmount }), { totalOrders: 0, totalItems: 0, grossRevenue: 0, totalDiscount: 0, netRevenue: 0 });
}

export function useRetailOrdersQuery(filters: RetailOrderFilters, page: number, pageSize: number, enabled: boolean) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const { branchId, fromDate, toDate, search } = filters;
  return useQuery({
    queryKey: ['owner', 'retail-orders', 'list', filters, page, pageSize],
    queryFn: async ({ signal }): Promise<PagedList<RetailOrderListItemDto>> => {
      const response = await apiClient.get<PagedList<RetailOrderListItemDto>>(API_ENDPOINTS.POS.ORDER_LIST, {
        params: {
          branchId,
          fromDate,
          toDate,
          search: search?.trim() || undefined,
          page,
          pageSize,
        },
        signal,
      });
      return response as unknown as PagedList<RetailOrderListItemDto>;
    },
    enabled: enabled && authenticated && Boolean(filters.branchId),
  });
}

export function useRetailOrderSummaryQuery(filters: RetailOrderFilters, enabled: boolean) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const { search: _search, ...params } = filters;
  return useQuery({
    queryKey: ['owner', 'retail-orders', 'summary', params],
    queryFn: async ({ signal }): Promise<RetailOrderSummaryDto> => {
      const response = await apiClient.get<RetailOrderSummaryDto>(API_ENDPOINTS.POS.ORDER_SUMMARY, { params, signal });
      return response as unknown as RetailOrderSummaryDto;
    },
    enabled: enabled && authenticated && Boolean(params.branchId),
  });
}

export function useRetailOrderDetailQuery(id: string | null, branchId: string) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['owner', 'retail-orders', 'detail', branchId, id],
    queryFn: async ({ signal }): Promise<RetailOrderDto> => {
      const response = await apiClient.get<RetailOrderDto>(API_ENDPOINTS.POS.ORDER_DETAIL(id!), { signal });
      const receipt = response as unknown as RetailOrderDto;
      if (receipt.branchId !== branchId) throw new Error('Hóa đơn không thuộc chi nhánh đang chọn.');
      return receipt;
    },
    enabled: authenticated && Boolean(id && branchId),
  });
}

export interface PosProductsParams {
  branchId: string;
  search?: string;
  categoryId?: string;
}

export function usePosProductsQuery(params: string | PosProductsParams) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const branchId = typeof params === 'string' ? params : params.branchId;
  const search = typeof params === 'string' ? undefined : (params.search?.trim() || undefined);
  const categoryId = typeof params === 'string' ? undefined : (params.categoryId || undefined);

  return useQuery({
    queryKey: ['owner', 'services', 'pos', branchId, search, categoryId],
    queryFn: async (): Promise<OwnerServiceDto[]> => {
      const items: OwnerServiceDto[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const queryParams: Record<string, unknown> = {
          branchId,
          page,
          pageSize: 100,
        };
        if (search) queryParams.search = search;
        if (categoryId) queryParams.categoryId = categoryId;

        const response = await apiClient.get<PagedList<OwnerServiceDto>>(API_ENDPOINTS.POS.SERVICES, {
          params: queryParams,
        });
        const data = response as unknown as PagedList<OwnerServiceDto>;
        items.push(...data.items);
        totalPages = data.totalPages;
        page += 1;
      } while (page <= totalPages);
      return items;
    },
    enabled: authenticated && Boolean(branchId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateRetailOrderMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRetailOrderPayload): Promise<RetailOrderDto> => {
      const response = await apiClient.post<RetailOrderDto>(API_ENDPOINTS.POS.CREATE_ORDER, payload);
      return response as unknown as RetailOrderDto;
    },
    onSuccess: () => {
      // Do not make a saved payment depend on a later refetch succeeding.
      void client.invalidateQueries({ queryKey: ['owner', 'retail-orders'] });
      void client.invalidateQueries({ queryKey: ['owner', 'analytics'] });
    },
    retry: false,
  });
}
