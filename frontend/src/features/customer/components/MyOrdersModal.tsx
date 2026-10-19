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

import { useMyOrdersQuery } from '@/api/orders';

export interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);

  // Lấy danh sách đơn đặt sân thực tế của người chơi
  const { data: myOrders = [], isLoading } = useMyOrdersQuery();

  // Trạng thái lưu tạm review của người chơi (sau khi gửi)
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, {
    rating: number;
    comment: string;
    date: string;
  }>>(() => {
    const saved = localStorage.getItem('player_reviewed_orders');
    return saved ? JSON.parse(saved) : {};
  });

  const handleReviewSuccess = () => {
    if (selectedOrderForReview) {
      const newRev = {
        rating: 5,
        comment: 'Sân đẹp, phục vụ tận tình chu đáo!',
        date: new Date().toLocaleDateString('vi-VN'),
      };
      const updated = { ...reviewedOrders, [selectedOrderForReview.id]: newRev };
      setReviewedOrders(updated);
      localStorage.setItem('player_reviewed_orders', JSON.stringify(updated));
    }
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
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Đang tải danh sách đơn đặt sân...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Bạn chưa có đơn đặt sân nào.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sau khi hoàn thành ca chơi đặt online, bạn có thể quay lại đây để đánh giá sân!
                  </p>
                </div>
              ) : (
                myOrders.map((order) => {
                  const isCompleted = order.status === 3 || String(order.status).toLowerCase() === 'completed';
                  const reviewed = reviewedOrders[order.id];

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-xs transition-all hover:border-[#397B48]/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm font-mono">
                            {order.orderCode}
                          </span>
                          <span className="text-xs text-muted-foreground">• {order.date}</span>
                        </div>
                        {isCompleted ? (
                          <span className="text-xs font-bold text-[#397B48] bg-[#397B48]/10 px-2.5 py-0.5 rounded-full border border-[#397B48]/20 self-start sm:self-auto">
                            ✓ Đã hoàn thành
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                            {order.status === 2 || String(order.status).toLowerCase() === 'confirmed'
                              ? 'Đã xác nhận'
                              : 'Đang xử lý'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                            <Building2 className="size-4 text-[#397B48]" />
                            <span>{order.branchName}</span>
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {order.courtName} • Khung giờ: {order.startTime} - {order.endTime}
                          </p>
                          <p className="text-xs font-mono font-semibold text-foreground pt-1">
                            Tổng tiền: {formatVND(order.totalAmount)}
                          </p>
                        </div>

                        {/* Chỉ đơn đã hoàn thành mới có chức năng Đánh giá */}
                        <div className="sm:text-right shrink-0">
                          {isCompleted ? (
                            reviewed ? (
                              <div className="rounded-lg bg-muted/40 p-3 border border-border/60 text-left sm:text-right space-y-1">
                                <div className="flex items-center sm:justify-end gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`size-3.5 ${
                                        s <= reviewed.rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs font-bold text-foreground ml-1">
                                    {reviewed.rating}/5
                                  </span>
                                </div>
                                <p className="text-xs italic text-muted-foreground max-w-xs truncate">
                                  "{reviewed.comment}"
                                </p>
                                <span className="text-[10px] text-[#397B48] font-semibold block">
                                  ✓ Bạn đã đánh giá ({reviewed.date})
                                </span>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={() =>
                                  setSelectedOrderForReview({
                                    id: order.id,
                                    orderCode: order.orderCode,
                                    branchName: order.branchName,
                                    branchInitials: order.branchName.slice(0, 2).toUpperCase(),
                                    courtName: order.courtName,
                                    district: order.district,
                                    playDate: order.date,
                                    timeSlot: `${order.startTime} - ${order.endTime}`,
                                    totalAmount: order.totalAmount,
                                    status: 'Completed',
                                  })
                                }
                                className="bg-[#18231A] hover:bg-black text-white font-bold text-xs gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                              >
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                <span>Đánh giá sân</span>
                              </Button>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Đánh giá khả dụng sau khi hoàn thành ca
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
