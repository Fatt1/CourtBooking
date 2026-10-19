import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { PagedList } from '@/types/api';
import type {
  MatchDto,
  MatchDetailDto,
  GetMatchesParams,
  CreateMatchPayload,
  UpdateMatchPayload,
  CreateMatchResponse,
  JoinMatchResponse,
} from './types';

/**
 * Hook lấy danh sách kèo giao lưu (GET /api/v1/matches)
 */
export function useMatchesQuery(params: GetMatchesParams = {}) {
  return useQuery<PagedList<MatchDto>>({
    queryKey: ['matches', params],
    queryFn: async (): Promise<PagedList<MatchDto>> => {
      const response = await apiClient.get<PagedList<MatchDto>>(
        API_ENDPOINTS.MATCHES.LIST,
        { params }
      );
      return (
        (response as unknown as PagedList<MatchDto>) || {
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
  });
}

/**
 * Hook lấy chi tiết một kèo giao lưu (GET /api/v1/matches/:id)
 */
export function useMatchDetailQuery(id?: string) {
  return useQuery<MatchDetailDto>({
    queryKey: ['matches', 'detail', id],
    queryFn: async (): Promise<MatchDetailDto> => {
      if (!id) throw new Error('Match ID is required');
      const response = await apiClient.get<MatchDetailDto>(
        API_ENDPOINTS.MATCHES.DETAIL(id)
      );
      return response as unknown as MatchDetailDto;
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook mở kèo giao lưu mới (POST /api/v1/matches)
 */
export function useCreateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMatchPayload): Promise<CreateMatchResponse> => {
      const response = await apiClient.post<CreateMatchResponse>(
        API_ENDPOINTS.MATCHES.CREATE,
        payload
      );
      return response as unknown as CreateMatchResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my-orders'] });
    },
  });
}

/**
 * Hook sửa thông tin kèo giao lưu (PUT /api/v1/matches/:id)
 */
export function useUpdateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateMatchPayload): Promise<void> => {
      await apiClient.put(API_ENDPOINTS.MATCHES.UPDATE(id), payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', variables.id] });
    },
  });
}

/**
 * Hook xin tham gia kèo (POST /api/v1/matches/:id/join)
 */
export function useJoinMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string): Promise<JoinMatchResponse> => {
      const response = await apiClient.post<JoinMatchResponse>(
        API_ENDPOINTS.MATCHES.JOIN(matchId)
      );
      return response as unknown as JoinMatchResponse;
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
  });
}

/**
 * Hook chủ phòng duyệt thành viên (POST /api/v1/matches/:id/participants/:pId/approve)
 */
export function useApproveParticipantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, participantId }: { matchId: string; participantId: string }): Promise<void> => {
      await apiClient.post(API_ENDPOINTS.MATCHES.APPROVE_PARTICIPANT(matchId, participantId));
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
  });
}

/**
 * Hook chủ phòng từ chối thành viên (POST /api/v1/matches/:id/participants/:pId/reject)
 */
export function useRejectParticipantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, participantId }: { matchId: string; participantId: string }): Promise<void> => {
      await apiClient.post(API_ENDPOINTS.MATCHES.REJECT_PARTICIPANT(matchId, participantId));
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
  });
}

/**
 * Hook người tham gia rút lui khỏi kèo (POST /api/v1/matches/:id/leave)
 */
export function useLeaveMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string): Promise<void> => {
      await apiClient.post(API_ENDPOINTS.MATCHES.LEAVE(matchId));
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
  });
}

/**
 * Hook chủ phòng hủy kèo (POST /api/v1/matches/:id/cancel)
 */
export function useCancelMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string): Promise<void> => {
      await apiClient.post(API_ENDPOINTS.MATCHES.CANCEL(matchId));
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'detail', matchId] });
    },
  });
}
