import React from 'react';
import { Star, MessageSquare, User, Calendar, X, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBranchReviewsQuery } from '@/api/reviews';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface BranchReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  branchName?: string;
  reviewAverage?: number | null;
}

export function BranchReviewsModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  reviewAverage = 5.0,
}: BranchReviewsModalProps) {
  const { data: reviewsData, isLoading } = useBranchReviewsQuery(branchId, 1, 20);

  const reviews = reviewsData?.items || [];
  const average = reviewsData?.averageRating ?? reviewAverage ?? 5.0;
  const totalCount = reviewsData?.totalCount ?? reviews.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl">
        <div className="p-6 sm:p-7 space-y-6">
          {/* Header */}
          <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-[#a3e635]">
              ĐÁNH GIÁ CƠ SỞ
            </span>
            <DialogTitle className="font-heading font-black text-2xl text-foreground flex items-center gap-2">
              <Building2 className="size-6 text-emerald-600 dark:text-[#a3e635]" />
              <span>{branchName || 'Chi nhánh sân'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tổng hợp nhận xét và đánh giá thực tế từ cộng đồng người chơi
            </DialogDescription>
          </DialogHeader>

          {/* Điểm tổng quan */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="font-heading font-black text-4xl text-foreground font-mono">
                  {Number(average).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground font-medium"> / 5.0</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'size-4',
                        s <= Math.round(average)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Dựa trên {totalCount} lượt đánh giá từ khách hàng
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#a3e635] self-start sm:self-auto border border-emerald-500/20 dark:border-[#a3e635]/30">
              Cơ sở được người chơi tin cậy
            </div>
          </div>

          {/* Danh sách nhận xét */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              <span>Nhận xét gần đây ({reviews.length})</span>
            </h4>

            {isLoading ? (
              <div className="space-y-3 py-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-full bg-muted/40 rounded-xl" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border/70 rounded-xl">
                <Star className="size-8 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-sm font-semibold text-foreground">Chưa có nhận xét nào</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hiện chi nhánh chưa nhận được đánh giá nào từ người chơi.
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-border/60 bg-card p-4 space-y-2 transition-all hover:border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-[#18231A] text-white flex items-center justify-center font-bold text-xs">
                          {(rev.playerName || 'P')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {rev.playerName || 'Người chơi Matchday'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'size-3.5',
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="text-xs text-foreground/90 leading-relaxed pl-9">
                        {rev.comment}
                      </p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground pl-9">
                        Khách hàng không để lại nhận xét bằng văn bản.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
