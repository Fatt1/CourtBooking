import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import type { SubscriptionHistoryItem } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionHistoryItem | null;
  onConfirm: (courtOwnerId: string, newStatus: 0 | 1) => Promise<void>;
  isSubmitting?: boolean;
}

export function PauseConfirmDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
  isSubmitting,
}: Props) {
  if (!subscription) return null;

  const isCurrentlyPaused = subscription.status === 'Suspended';
  const targetStatus = isCurrentlyPaused ? 0 : 1; // 0 = Active, 1 = Suspended

  const handleAction = async () => {
    await onConfirm(subscription.courtOwnerId, targetStatus);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-[#1b2d22] bg-[#0c1410] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isCurrentlyPaused
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              {isCurrentlyPaused ? (
                <CheckCircle className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {isCurrentlyPaused ? 'Mở lại hoạt động cụm sân' : 'Xác nhận tạm dừng cụm sân'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
            {isCurrentlyPaused ? (
              <span>
                Cụm sân của chủ sân <strong>{subscription.ownerName}</strong> ({subscription.businessName}) sẽ được mở lại để khách hàng có thể tiếp tục đặt sân trực tuyến.
              </span>
            ) : (
              <span>
                Bạn có chắc chắn muốn tạm dừng hoạt động cụm sân <strong>{subscription.businessName}</strong> của chủ sân <strong>{subscription.ownerName}</strong>? Sau khi tạm dừng, khách hàng sẽ không thể đặt sân cho tới khi được kích hoạt lại.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-4 border-t border-[#1b2d22]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border-[#1b2d22] bg-[#111915] text-zinc-300 hover:text-white hover:bg-[#16241c] text-xs cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleAction}
            className={`h-9 rounded-xl font-bold text-xs gap-1.5 cursor-pointer ${
              isCurrentlyPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>
              {isCurrentlyPaused
                ? isSubmitting
                  ? 'Đang mở lại...'
                  : 'Xác nhận mở lại'
                : isSubmitting
                ? 'Đang tạm dừng...'
                : 'Tạm dừng sân'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
