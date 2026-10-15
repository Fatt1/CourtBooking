import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCreateReviewMutation } from '@/api/reviews';
import { createReviewSchema } from '../schemas/reviewSchema';
import { cn } from '@/lib/utils';

// Mô tả cảm xúc theo từng mức sao
const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời, rất hài lòng!',
};

export function CreateReviewPage() {
  const navigate = useNavigate();
  const { orderId: routeOrderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  // Mã đơn hàng ưu tiên từ param URL hoặc fallback
  const effectiveOrderId =
    routeOrderId || queryOrderId || '01990c74-c363-7eb9-92c8-3610055ce8c0';

  const { isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Thông tin đơn hàng (Dữ liệu hiển thị thẻ tóm tắt)
  const orderSummary = useMemo(() => {
    return {
      orderCode: 'MD-TN-0984',
      sportType: 'TENNIS',
      branchName: 'Tennis Phú Thọ',
      branchInitials: 'TP',
      courtName: 'Sân Tennis 1',
      district: 'Quận 11',
      playDate: '17/09/2026',
      timeSlot: '17:00 - 18:00',
      status: 'Đã hoàn thành',
    };
  }, []);

  // Hook Mutation gọi API POST /api/v1/reviews
  const createReviewMutation = useCreateReviewMutation({
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  // Xử lý gửi đánh giá
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi đánh giá.');
      navigate('/login');
      return;
    }

    // 1. Kiểm tra dữ liệu bằng Zod Schema (Tuân thủ nghiêm ngặt theo chỉ đạo của Sếp)
    const validationResult = createReviewSchema.safeParse({
      orderId: effectiveOrderId,
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

  const activeStarCount = hoverRating ?? rating;

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-background py-8 sm:py-12 transition-colors">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>Lịch đặt sân</span>
        </button>

        {/* Tiêu đề chính của trang */}
        <div className="mb-8 space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest text-[#2D5A27] dark:text-[#a3e635]">
            CHIA SẺ TRẢI NGHIỆM
          </p>
          <h1 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            ĐÁNH GIÁ SÂN
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Ý kiến của bạn giúp cộng đồng chọn được sân phù hợp hơn.
          </p>
        </div>

        {/* Màn hình thông báo khi gửi thành công */}
        {isSubmitted ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-9" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Cảm ơn bạn đã đánh giá!
            </h2>
            <p className="text-sm text-muted-foreground">
              Đánh giá của bạn đã được ghi nhận và sẽ giúp ích rất nhiều cho các người chơi khác khi chọn sân.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl font-bold h-10 px-6 border-border/80"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>
              <Button
                className="rounded-xl bg-[#2D5A27] hover:bg-[#22441d] dark:bg-[#a3e635] dark:text-black dark:hover:bg-[#8ece28] text-white font-bold h-10 px-6"
                onClick={() => navigate('/courts')}
              >
                Tiếp tục tìm sân
              </Button>
            </div>
          </div>
        ) : (
          /* Bố cục 2 cột: Cột trái (Thông tin đơn) + Cột phải (Form đánh giá) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── CỘT TRÁI: THẺ TÓM TẮT ĐƠN ĐẶT SÂN ────────────────── */}
            <div className="lg:col-span-4 rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-6">
              {/* Badge trạng thái */}
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {orderSummary.status}
                </span>
              </div>

              {/* Logo / Chữ viết tắt của chi nhánh */}
              <div className="flex size-16 items-center justify-center rounded-full bg-[#265330] text-white text-2xl font-black shadow-xs">
                {orderSummary.branchInitials}
              </div>

              {/* Tên cơ sở & Chi tiết sân */}
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-[#2D5A27] dark:text-[#a3e635]">
                  {orderSummary.sportType}
                </p>
                <h3 className="font-heading text-2xl font-black tracking-tight text-foreground leading-snug">
                  {orderSummary.branchName}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {orderSummary.courtName} · {orderSummary.district}
                </p>
              </div>

              <hr className="border-border/60" />

              {/* Bảng thông số chi tiết */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Ngày chơi</span>
                  <span className="font-bold text-foreground">{orderSummary.playDate}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Thời gian</span>
                  <span className="font-bold text-foreground">{orderSummary.timeSlot}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Mã lịch đặt</span>
                  <span className="font-bold font-mono text-foreground">{orderSummary.orderCode}</span>
                </div>
              </div>
            </div>

            {/* ── CỘT PHẢI: FORM ĐÁNH GIÁ SÂN ───────────────────────── */}
            <div className="lg:col-span-8 rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header phần form */}
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-[#2D5A27] dark:text-[#a3e635]">
                    TRẢI NGHIỆM CỦA BẠN
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    Bạn cảm thấy thế nào?
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Đánh giá chất lượng sân, dịch vụ và không gian thực tế.
                  </p>
                </div>

                {/* 1. CHỌN SỐ SAO (1 - 5) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      CHỌN SỐ SAO <span className="text-rose-500">*</span>
                    </label>
                    {activeStarCount > 0 && (
                      <span className="text-xs font-bold text-[#2D5A27] dark:text-[#a3e635] transition-all">
                        {RATING_DESCRIPTIONS[activeStarCount]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((starNum) => {
                      const isSelected = rating === starNum;
                      const isHighlighted = activeStarCount >= starNum;

                      return (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => setRating(starNum)}
                          onMouseEnter={() => setHoverRating(starNum)}
                          onMouseLeave={() => setHoverRating(null)}
                          className={cn(
                            'group flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 px-2 sm:py-3.5 transition-all cursor-pointer select-none',
                            isSelected
                              ? 'border-amber-400 bg-amber-500/10 text-amber-500 font-bold ring-1 ring-amber-400'
                              : 'border-border/80 bg-background/60 hover:border-amber-400/70 hover:bg-amber-500/5 text-muted-foreground'
                          )}
                        >
                          <Star
                            className={cn(
                              'size-5 sm:size-6 transition-all',
                              isHighlighted
                                ? 'fill-amber-400 text-amber-400 scale-110'
                                : 'text-muted-foreground/40'
                            )}
                          />
                          <span className="text-xs sm:text-sm font-bold font-heading">
                            {starNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. NHẬN XÉT CỦA BẠN */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      NHẬN XÉT CỦA BẠN
                    </label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {comment.length}/1000
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ về mặt sân, ánh sáng, nhân viên hoặc tiện ích..."
                    maxLength={1000}
                    className="w-full rounded-xl border border-border/80 bg-background/60 p-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#2D5A27] dark:focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#2D5A27] dark:focus:ring-[#a3e635] transition-all resize-none shadow-2xs"
                  />
                </div>

                {/* 3. KHUNG MẸO HƯỚNG DẪN ĐÁNH GIÁ */}
                <div className="rounded-xl border-l-4 border-[#2D5A27] dark:border-[#a3e635] bg-[#F4F6F4] dark:bg-muted/40 p-4 text-xs space-y-1">
                  <p className="font-bold text-foreground">Đánh giá hữu ích</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Viết trung thực, tập trung vào trải nghiệm tại sân và tôn trọng mọi người.
                  </p>
                </div>

                {/* 4. CỤM NÚT HÀNH ĐỘNG */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-xl font-bold h-10 px-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Để sau
                  </Button>
                  <Button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="rounded-xl bg-[#2D5A27] hover:bg-[#22441d] dark:bg-[#a3e635] dark:text-black dark:hover:bg-[#8ece28] text-white font-bold h-10 px-6 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {createReviewMutation.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    <span>Gửi đánh giá</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
