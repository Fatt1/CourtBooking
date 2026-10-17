import React, { useState } from 'react';
import { Calendar, Clock, Star, CheckCircle2, Building2, Receipt, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
import { useAuthStore } from '@/stores/useAuthStore';
import { ReviewOrderModal } from './ReviewOrderModal';

export interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const { user } = useAuthStore();
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);

  // Trạng thái lưu tạm review của người chơi cho đơn test (sau khi gửi)
  const [reviewedData, setReviewedData] = useState<{
    rating: number;
    comment: string;
    date: string;
  } | null>(() => {
    const saved = localStorage.getItem('player_review_test_order');
    return saved ? JSON.parse(saved) : null;
  });

  // Đơn hàng hoàn thành thực tế trong Database của Player1
  const testCompletedOrder = {
    id: 'a1b2c3d4-1111-2222-3333-444444444444',
    orderCode: 'MD-ORD-COMPLETED-001',
    branchName: 'CLB Cầu Lông & Pickleball Sài Gòn Star - Chi Nhánh 1',
    branchInitials: 'SS',
    courtName: 'Sân Cầu Lông 1',
    district: 'Quận 7',
    playDate: '16/10/2026',
    timeSlot: '17:00 - 18:00',
    totalAmount: 160000,
    status: 'Completed',
  };

  const handleReviewSuccess = () => {
    const newRev = {
      rating: 5,
      comment: 'Sân cầu lông thảm mới, đèn sáng rất tốt, nhân viên thân thiện!',
      date: new Date().toLocaleDateString('vi-VN'),
    };
    setReviewedData(newRev);
    localStorage.setItem('player_review_test_order', JSON.stringify(newRev));
    setSelectedOrderForReview(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80 bg-background shadow-2xl">
          <div className="p-6 sm:p-7 space-y-6">
            {/* Header */}
            <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#397B48]">
                LỊCH SỬ ĐẶT SÂN CỦA BẠN
              </span>
              <DialogTitle className="font-heading font-black text-2xl text-foreground flex items-center gap-2">
                <Receipt className="size-6 text-[#397B48]" />
                <span>Đơn đặt sân của tôi</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Xem lại các ca chơi đã hoàn thành và gửi đánh giá trải nghiệm sân
              </DialogDescription>
            </DialogHeader>

            {/* Danh sách đơn hàng */}
            <div className="space-y-4">
              {/* Thẻ đơn hàng đã hoàn thành */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-xs transition-all hover:border-[#397B48]/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm font-mono">
                      {testCompletedOrder.orderCode}
                    </span>
                    <span className="text-xs text-muted-foreground">• 16/10/2026</span>
                  </div>
                  <span className="text-xs font-bold text-[#397B48] bg-[#397B48]/10 px-2.5 py-0.5 rounded-full border border-[#397B48]/20 self-start sm:self-auto">
                    ✓ Đã hoàn thành
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Building2 className="size-4 text-[#397B48]" />
                      <span>{testCompletedOrder.branchName}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {testCompletedOrder.courtName} • Khung giờ: {testCompletedOrder.timeSlot}
                    </p>
                    <p className="text-xs font-mono font-semibold text-foreground pt-1">
                      Tổng tiền: {formatVND(testCompletedOrder.totalAmount)}
                    </p>
                  </div>

                  {/* Khu vực Đánh giá theo đúng logic nghiệp vụ */}
                  <div className="sm:text-right shrink-0">
                    {reviewedData ? (
                      /* Nếu đã đánh giá: Xem lại đánh giá của bản thân */
                      <div className="rounded-lg bg-muted/40 p-3 border border-border/60 text-left sm:text-right space-y-1">
                        <div className="flex items-center sm:justify-end gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3.5 ${
                                s <= reviewedData.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-foreground ml-1">
                            {reviewedData.rating}/5
                          </span>
                        </div>
                        <p className="text-xs italic text-muted-foreground max-w-xs truncate">
                          "{reviewedData.comment}"
                        </p>
                        <span className="text-[10px] text-[#397B48] font-semibold block">
                          ✓ Bạn đã đánh giá ({reviewedData.date})
                        </span>
                      </div>
                    ) : (
                      /* Nếu chưa đánh giá: Nút bấm Đánh giá sân */
                      <Button
                        type="button"
                        onClick={() => setSelectedOrderForReview(testCompletedOrder)}
                        className="bg-[#18231A] hover:bg-black text-white font-bold text-xs gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                      >
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>Đánh giá sân</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Đánh giá sân (ReviewOrderModal) */}
      {selectedOrderForReview && (
        <ReviewOrderModal
          isOpen={Boolean(selectedOrderForReview)}
          onClose={() => setSelectedOrderForReview(null)}
          order={selectedOrderForReview}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}
