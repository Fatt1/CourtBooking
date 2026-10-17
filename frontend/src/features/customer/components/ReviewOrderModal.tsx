import React, { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateReviewMutation } from '@/api/reviews';
import { createReviewSchema } from '../schemas/reviewSchema';
import { cn } from '@/lib/utils';

export interface ReviewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderCode: string;
    branchName: string;
    branchInitials?: string;
    courtName?: string;
    playDate?: string;
    timeSlot?: string;
    sportType?: string;
  };
  onSuccess?: (reviewId: string) => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường, tạm ổn',
  4: 'Hài lòng',
  5: 'Tuyệt vời, rất hài lòng!',
};

export function ReviewOrderModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReviewOrderModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Hook Mutation gọi API POST /api/v1/reviews
  const createReviewMutation = useCreateReviewMutation({
    onSuccess: (reviewId) => {
      setIsSubmitted(true);
      onSuccess?.(reviewId);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra dữ liệu bằng Zod Schema
    const validationResult = createReviewSchema.safeParse({
      orderId: order.id,
      rating,
      comment: comment.trim() || null,
    });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || 'Dữ liệu đánh giá không hợp lệ.';
      toast.error(firstError);
      return;
    }

    // 2. Gửi dữ liệu hợp lệ đến API Backend
    createReviewMutation.mutate(validationResult.data);
  };

  const activeStar = hoverRating ?? rating;
  const initials =
    order.branchInitials ||
    order.branchName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl">
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="size-14 rounded-full bg-[#397B48]/10 text-[#397B48] flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-heading font-black text-2xl text-foreground">
              Đánh giá thành công!
            </h3>
            <p className="text-sm text-muted-foreground">
              Cảm ơn bạn đã đóng góp ý kiến giúp cộng đồng người chơi chọn sân tốt hơn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {/* 1. Header Popup */}
            <DialogHeader className="space-y-1 text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#397B48]">
                CHIA SẺ TRẢI NGHIỆM
              </span>
              <DialogTitle className="font-heading font-black text-2xl text-foreground tracking-tight">
                Bạn cảm thấy thế nào?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Đánh giá chất lượng sân, dịch vụ và không gian thực tế ca chơi của bạn.
              </DialogDescription>
            </DialogHeader>

            {/* 2. Thẻ tóm tắt ca chơi (Tái hiện cột trái Figma dạng compact) */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-[#18231A] text-white flex items-center justify-center font-black text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {order.branchName}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.courtName ? `${order.courtName} • ` : ''}
                    {order.timeSlot ? `${order.timeSlot}` : ''}
                    {order.playDate ? ` (${order.playDate})` : ''}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground/80 mt-0.5">
                    Mã: {order.orderCode}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-[11px] font-bold text-[#397B48] bg-[#397B48]/10 px-2.5 py-1 rounded-full border border-[#397B48]/20">
                Đã hoàn thành
              </span>
            </div>

            {/* 3. Khối chọn số sao (5 thẻ vuông chuẩn Figma) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  CHỌN SỐ SAO
                </label>
                <span className="text-xs font-bold text-[#397B48]">
                  {RATING_DESCRIPTIONS[activeStar]}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isSelected = rating === starValue;
                  const isHighlighted = activeStar >= starValue;

                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      className={cn(
                        'flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'border-[#397B48] bg-[#397B48]/10 ring-2 ring-[#397B48]/30 shadow-xs'
                          : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                      )}
                    >
                      <Star
                        className={cn(
                          'size-5 transition-transform',
                          isHighlighted
                            ? 'fill-amber-400 text-amber-400 scale-110'
                            : 'text-muted-foreground/40'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-bold mt-1',
                          isSelected ? 'text-[#397B48]' : 'text-muted-foreground'
                        )}
                      >
                        {starValue}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Nhận xét của bạn */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                NHẬN XÉT CỦA BẠN
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ về mặt sân, ánh sáng, nhân viên hoặc tiện ích..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-border/80 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#397B48] resize-none"
              />
              <div className="text-right text-[11px] text-muted-foreground">
                {comment.length}/1000 ký tự
              </div>
            </div>

            {/* 5. Khung lưu ý "Đánh giá hữu ích" chuẩn Matchday */}
            <div className="rounded-r-xl border-l-4 border-[#397B48] bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-0.5">Đánh giá hữu ích</p>
              <p>Viết trung thực, tập trung vào trải nghiệm tại sân và tôn trọng mọi người.</p>
            </div>

            {/* 6. Footer: Để sau & Gửi đánh giá */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={createReviewMutation.isPending}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Để sau
              </Button>

              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="bg-[#18231A] hover:bg-black text-white font-bold text-xs px-6 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                {createReviewMutation.isPending && (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                )}
                <span>{createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
