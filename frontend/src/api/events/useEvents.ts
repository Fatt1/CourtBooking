import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { PagedList, ProblemDetails } from '@/types/api';
import type {
  OwnerEventItemDto,
  OwnerEventDetailDto,
  GetOwnerEventsParams,
  CreateEventPayload,
  UpdateEventPayload,
  CancelEventPayload,
  EventParticipantsResponse,
  EventTicketStatus,
} from './types';

/**
 * Hook lấy danh sách sự kiện thể thao tại chi nhánh
 * Endpoint: GET /api/v1/owner/events
 */
export function useOwnerEventsQuery(
  params: GetOwnerEventsParams,
  options?: { enabled?: boolean }
) {
  return useQuery<PagedList<OwnerEventItemDto>>({
    queryKey: ['owner', 'events', params],
    queryFn: async (): Promise<PagedList<OwnerEventItemDto>> => {
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

      const response = await apiClient.get<PagedList<OwnerEventItemDto>>(
        API_ENDPOINTS.EVENTS.OWNER_LIST,
        { params }
      );

      return (
        (response as unknown as PagedList<OwnerEventItemDto>) || {
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
    enabled: (options?.enabled ?? true) && !!params.branchId,
  });
}

/**
 * Hook lấy chi tiết một sự kiện của Chủ sân
 * Endpoint: GET /api/v1/owner/events/{id}
 */
export function useOwnerEventDetailQuery(eventId?: string | null) {
  return useQuery<OwnerEventDetailDto>({
    queryKey: ['owner', 'events', 'detail', eventId],
    queryFn: async (): Promise<OwnerEventDetailDto> => {
      if (!eventId) throw new Error('Missing eventId');
      const response = await apiClient.get<OwnerEventDetailDto>(
        API_ENDPOINTS.EVENTS.DETAIL(eventId)
      );
      return response as unknown as OwnerEventDetailDto;
    },
    enabled: !!eventId,
  });
}

/**
 * Hook tạo sự kiện mới kèm khóa sân trên Time Grid
 * Endpoint: POST /api/v1/owner/events
 */
export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CreateEventPayload>({
    mutationFn: async (payload): Promise<string> => {
      const response = await apiClient.post<string>(
        API_ENDPOINTS.EVENTS.CREATE,
        payload
      );
      return response as unknown as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'branches'] });
    },
  });
}

/**
 * Hook cập nhật thông tin sự kiện
 * Endpoint: PUT /api/v1/owner/events/{id}
 */
export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { eventId: string; payload: UpdateEventPayload }>({
    mutationFn: async ({ eventId, payload }): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.EVENTS.UPDATE(eventId), payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'events', 'detail', variables.eventId],
      });
    },
  });
}

/**
 * Hook hủy sự kiện và giải phóng các slot sân trên Time Grid
 * Endpoint: PUT /api/v1/owner/events/{id}/cancel
 */
export function useCancelEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { eventId: string; payload: CancelEventPayload }>({
    mutationFn: async ({ eventId, payload }): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.EVENTS.CANCEL(eventId), payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
      queryClient.invalidateQueries({
        queryKey: ['owner', 'events', 'detail', variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

/**
 * Hook lấy danh sách người tham gia & vé trong Modal của Chủ sân
 * Endpoint: GET /api/v1/owner/events/{id}/participants?status=...
 */
export function useEventParticipantsQuery(
  eventId?: string | null,
  status?: EventTicketStatus
) {
  return useQuery<EventParticipantsResponse, ProblemDetails>({
    queryKey: ['owner', 'events', 'participants', eventId, status],
    queryFn: async (): Promise<EventParticipantsResponse> => {
      if (!eventId) throw new Error('Missing eventId');
      const response = await apiClient.get<EventParticipantsResponse>(
        API_ENDPOINTS.EVENTS.PARTICIPANTS(eventId),
        status !== undefined ? { params: { status } } : undefined
      );
      return response as unknown as EventParticipantsResponse;
    },
    enabled: !!eventId,
  });
}

/**
 * Hook duyệt vé tham gia sự kiện
 * Endpoint: PUT /api/v1/owner/events/{id}/tickets/{ticketId}/approve
 */
export function useApproveTicketMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ProblemDetails, string>({
    mutationFn: async (ticketId: string): Promise<void> => {
      await apiClient.put(
        API_ENDPOINTS.EVENTS.APPROVE_TICKET(eventId, ticketId)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'events', 'participants', eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
    },
  });
}

/**
 * Hook từ chối / hủy vé tham gia sự kiện
 * Endpoint: PUT /api/v1/owner/events/{id}/tickets/{ticketId}/reject
 */
export function useRejectTicketMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ProblemDetails, { ticketId: string; reason: string }>({
    mutationFn: async ({ ticketId, reason }): Promise<void> => {
      await apiClient.put(
        API_ENDPOINTS.EVENTS.REJECT_TICKET(eventId, ticketId),
        { reason }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'events', 'participants', eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
    },
  });
}
