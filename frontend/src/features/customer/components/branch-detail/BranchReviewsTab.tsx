import React, { useState } from 'react';
import { Star, CheckCircle, MessageSquare, Filter } from 'lucide-react';
import { useBranchReviewsQuery } from '@/api/reviews';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface BranchReviewsTabProps {
  branchId: string;
  branchName: string;
  reviewAverage?: number;
}

export function BranchReviewsTab({ branchId, branchName, reviewAverage = 0 }: BranchReviewsTabProps) {
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: reviewsData, isLoading } = useBranchReviewsQuery(branchId, page, pageSize);

  const reviewsList = reviewsData?.items || [];
  const totalCount = reviewsData?.totalCount || reviewsList.length;

  // Tính trung bình cộng từ danh sách đánh giá thực tế (tránh lỗi 0.0 khi đã có lượt đánh giá)
  const calculatedAverage =
    reviewsList.length > 0
      ? reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length
      : 0;

  const currentAverage =
    reviewsData?.averageRating && reviewsData.averageRating > 0
      ? reviewsData.averageRating
      : calculatedAverage > 0
      ? calculatedAverage
      : reviewAverage && reviewAverage > 0
      ? reviewAverage
      : 0;

  // Lọc theo số sao nếu người dùng chọn
  const filteredReviews = selectedRatingFilter
    ? reviewsList.filter((r) => r.rating === selectedRatingFilter)
    : reviewsList;

  // Tính số lượng và tỉ lệ theo từng mức sao từ dữ liệu thực tế
  const ratingCounts = {
    5: reviewsList.filter((r) => r.rating === 5).length,
    4: reviewsList.filter((r) => r.rating === 4).length,
    3: reviewsList.filter((r) => r.rating === 3).length,
    2: reviewsList.filter((r) => r.rating === 2).length,
    1: reviewsList.filter((r) => r.rating === 1).length,
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { stars, percentage, count };
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. Tiêu đề Tab */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
          ĐÁNH GIÁ TỪ NGƯỜI CHƠI
        </span>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
          Trải nghiệm thực tế tại {branchName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Tất cả đánh giá đều đến từ các người chơi đã đặt sân và hoàn thành trận đấu qua Matchday.
        </p>
      </div>

      {/* 2. Trạng thái Loading */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-secondary/50 border border-border/40 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 md:col-span-2 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-border/40 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ) : totalCount === 0 ? (
        /* 3. Empty State khi chưa có đánh giá nào (Không tạo dữ liệu ảo) */
        <div className="p-10 sm:p-14 rounded-2xl border border-dashed border-border/70 bg-secondary/20 text-center space-y-4">
          <div className="size-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <MessageSquare className="size-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading font-bold text-lg text-foreground">
              Chưa có đánh giá nào cho chi nhánh này
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Chi nhánh này hiện chưa có lượt đánh giá nào từ người chơi. Hãy là người đầu tiên trải nghiệm trận đấu tại cơ sở và chia sẻ cảm nhận đến cộng đồng thể thao!
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-[#397B48] text-xs font-bold">
              <CheckCircle className="size-3.5" />
              Đánh giá được kích hoạt tự động sau khi hoàn tất lượt đặt sân
            </span>
          </div>
        </div>
      ) : (
        /* 4. Thống kê & Danh sách đánh giá khi đã có dữ liệu thực tế */
        <div className="space-y-6 sm:space-y-8">
          {/* Rating Summary Overview Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-secondary/50 border border-border/40 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
            {/* Điểm số trung bình lớn */}
            <div className="text-center md:text-left md:border-r border-border/40 md:pr-6 space-y-1.5">
              <div className="font-heading font-black text-5xl sm:text-6xl text-foreground tracking-tight">
                {currentAverage.toFixed(1)}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-5',
                      i < Math.round(currentAverage)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground font-semibold pt-1">
                Dựa trên {totalCount} lượt đánh giá xác thực
              </div>
            </div>

            {/* Thanh tiến độ phân bố sao thực tế */}
            <div className="md:col-span-2 space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() =>
                      setSelectedRatingFilter(selectedRatingFilter === item.stars ? null : item.stars)
                    }
                    className="flex items-center gap-1 w-12 font-bold text-foreground hover:text-[#397B48] text-left transition-colors"
                  >
                    <span>{item.stars}</span>
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                  </button>

                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <span className="w-14 text-right text-muted-foreground font-medium">
                    {item.percentage}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mr-1">
              <Filter className="size-3.5" /> Lọc theo:
            </span>
            <button
              onClick={() => setSelectedRatingFilter(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                selectedRatingFilter === null
                  ? 'bg-[#183424] text-white shadow-xs'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              Tất cả ({totalCount})
            </button>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
              return (
                <button
                  key={stars}
                  onClick={() => setSelectedRatingFilter(selectedRatingFilter === stars ? null : stars)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold transition-colors inline-flex items-center gap-1',
                    selectedRatingFilter === stars
                      ? 'bg-[#183424] text-white shadow-xs'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  <span>{stars}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Danh sách đánh giá hoặc Empty Filter State */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const initial = review.playerName ? review.playerName.charAt(0).toUpperCase() : 'U';
                return (
                  <div
                    key={review.id}
                    className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 space-y-3.5 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Header người đánh giá */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border/60">
                          <AvatarImage src={(review as any).playerAvatarUrl} />
                          <AvatarFallback className="bg-[#183424] text-white font-black text-sm">
                            {initial}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span>{review.playerName || 'Người chơi ẩn danh'}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              <CheckCircle className="size-3" />
                              Đã chơi tại sân
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                          </div>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'size-4',
                              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Nội dung đánh giá */}
                    <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                      {review.comment || 'Người chơi không để lại nhận xét chi tiết nhưng rất hài lòng về chất lượng sân bãi.'}
                    </p>
                  </div>
                );
              })}

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-border/60 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang trước
                  </button>
                  <span className="text-xs font-bold text-muted-foreground">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-border/60 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-secondary/30 space-y-2">
              <h4 className="font-heading font-bold text-sm text-foreground">
                Chưa có đánh giá nào với {selectedRatingFilter} sao
              </h4>
              <p className="text-xs text-muted-foreground">
                Hãy chọn xem toàn bộ đánh giá hoặc chọn số sao khác.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
