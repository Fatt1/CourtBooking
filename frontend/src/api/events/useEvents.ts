import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { PagedList } from '@/types/api';
import type {
  OwnerEventItemDto,
  OwnerEventDetailDto,
  GetOwnerEventsParams,
  CreateEventPayload,
  UpdateEventPayload,
  CancelEventPayload,
} from './types';

/**
 * Hook lấy danh sách sự kiện thể thao tại chi nhánh
 * Endpoint: GET /api/v1/owner/events
 */
export function useOwnerEventsQuery(params: GetOwnerEventsParams) {
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
    enabled: !!params.branchId,
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
