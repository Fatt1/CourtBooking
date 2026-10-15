/**
 * Request payload tạo đánh giá sân sau khi hoàn thành đơn đặt
 */
export interface CreateReviewPayload {
  orderId: string;
  rating: number; // 1 đến 5 sao
  comment?: string | null;
}

/**
 * Thông tin chi tiết một đánh giá
 */
export interface ReviewDto {
  id: string;
  orderId: string;
  branchId: string;
  playerId: string;
  playerName?: string;
  playerAvatarUrl?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

/**
 * Phản hồi danh sách đánh giá của chi nhánh
 */
export interface BranchReviewsResponse {
  items: ReviewDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  averageRating?: number;
}
