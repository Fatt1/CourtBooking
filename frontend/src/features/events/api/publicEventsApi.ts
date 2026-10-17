import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { PagedList } from '@/types/api';
import type {
  EventCardDto,
  EventDetailDto,
  BookEventTicketPayload,
  BookEventTicketResponse,
  GetPublicEventsParams,
} from '../types';

/**
 * Hook lấy danh sách sự kiện công khai (Lọc & Phân trang)
 * Endpoint: GET /api/v1/events
 */
export function usePublicEventsQuery(params: GetPublicEventsParams = { page: 1, pageSize: 12 }) {
  return useQuery<PagedList<EventCardDto>>({
    queryKey: ['public', 'events', params],
    queryFn: async (): Promise<PagedList<EventCardDto>> => {
      // Làm sạch params trước khi gửi
      const cleanParams: Record<string, string | number> = {};
      if (params.search?.trim()) cleanParams.search = params.search.trim();
      if (params.sportTypeId) cleanParams.sportTypeId = params.sportTypeId;
      if (params.branchId) cleanParams.branchId = params.branchId;
      if (params.date) cleanParams.date = params.date;
      cleanParams.page = params.page || 1;
      cleanParams.pageSize = params.pageSize || 12;

      const response = await apiClient.get<PagedList<EventCardDto>>(
        API_ENDPOINTS.EVENTS.PUBLIC_LIST,
        { params: cleanParams }
      );
      return (
        (response as unknown as PagedList<EventCardDto>) || {
          items: [],
          totalCount: 0,
          page: cleanParams.page as number,
          pageSize: cleanParams.pageSize as number,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        }
      );
    },
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Hook xem chi tiết sự kiện
 * Endpoint: GET /api/v1/events/{id}
 */
export function usePublicEventDetailQuery(id?: string) {
  return useQuery<EventDetailDto>({
    queryKey: ['public', 'events', 'detail', id],
    queryFn: async (): Promise<EventDetailDto> => {
      if (!id) throw new Error('Missing event id');
      const response = await apiClient.get<EventDetailDto>(
        API_ENDPOINTS.EVENTS.PUBLIC_DETAIL(id)
      );
      return response as unknown as EventDetailDto;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook đặt mua vé sự kiện (Cần Auth & Pessimistic Lock)
 * Endpoint: POST /api/v1/events/{id}/tickets
 */
export function useBookEventTicketMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<BookEventTicketResponse, Error, BookEventTicketPayload>({
    mutationFn: async (payload): Promise<BookEventTicketResponse> => {
      const response = await apiClient.post<BookEventTicketResponse>(
        API_ENDPOINTS.EVENTS.BUY_TICKETS(eventId),
        payload
      );
      return response as unknown as BookEventTicketResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events', 'detail', eventId] });
    },
  });
}

/**
 * Hook hủy đơn vé sự kiện đang chờ thanh toán
 * Endpoint: POST /api/v1/events/{id}/tickets/{ticketId}/cancel
 */
export function useCancelEventTicketMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (ticketId: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.EVENTS.CANCEL_TICKET(eventId, ticketId)
      );
      return response as unknown as { success: boolean; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events', 'detail', eventId] });
    },
  });
}

