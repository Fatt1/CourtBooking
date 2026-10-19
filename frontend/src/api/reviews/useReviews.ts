import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { CreateReviewPayload, ReviewDto, BranchReviewsResponse } from './types';

/**
 * Hook Mutation gửi đánh giá sân sau khi hoàn thành đơn đặt
 * Endpoint: POST /api/v1/reviews
 */
export function useCreateReviewMutation(options?: {
  onSuccess?: (reviewId: string) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload): Promise<string> => {
      const response = await apiClient.post<string>(API_ENDPOINTS.REVIEWS.CREATE, payload);
      return response as unknown as string;
    },
    onSuccess: (reviewId, variables) => {
      toast.success('Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.');
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      options?.onSuccess?.(reviewId);
    },
    onError: (error: any) => {
      const message =
        error?.detail || error?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
      toast.error(message);
      options?.onError?.(error);
    },
  });
}

/**
 * Hook Query lấy danh sách đánh giá của một chi nhánh
 * Endpoint: GET /api/v1/reviews?branchId={branchId}&page={page}&pageSize={pageSize}
 */
export function useBranchReviewsQuery(branchId?: string, page = 1, pageSize = 10) {
  return useQuery<BranchReviewsResponse>({
    queryKey: ['reviews', 'branch', branchId, page, pageSize],
    queryFn: async (): Promise<BranchReviewsResponse> => {
      if (!branchId) {
        return { items: [], totalCount: 0, page, pageSize, averageRating: 5.0 };
      }
      try {
        const response = await apiClient.get<any>('/reviews', {
          params: { branchId, page, pageSize },
        const res = response as any;
        const paged = res?.reviews || res;
        const items = paged?.items || [];
        const totalCount = paged?.totalCount ?? items.length;
        const averageRating = res?.averageRating ?? res?.reviewAverage ?? 5.0;

        return {
          branchId: res?.branchId || branchId,
          averageRating,
          items,
          totalCount,
          page: paged?.page || page,
          pageSize: paged?.pageSize || pageSize,
        };
      } catch (err) {
        console.warn('Lỗi lấy danh sách đánh giá chi nhánh:', err);
        return { items: [], totalCount: 0, page, pageSize, averageRating: 5.0 };
      }
    },
    enabled: Boolean(branchId),
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}
