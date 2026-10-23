import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ServicePackageConfigItem } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicePackage: ServicePackageConfigItem | null;
  onConfirm: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeletePackageDialog({
  open,
  onOpenChange,
  servicePackage,
  onConfirm,
  isSubmitting,
}: Props) {
  if (!servicePackage) return null;

  const handleConfirm = async () => {
    await onConfirm(servicePackage.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0c1410] border border-[#2b181c] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto sm:mx-0">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-base sm:text-lg font-bold text-white">
            Xác nhận xóa gói dịch vụ {servicePackage.name}?
          </DialogTitle>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hành động này sẽ gỡ bỏ gói <strong className="text-white font-semibold">{servicePackage.name}</strong> khỏi danh mục SaaS. Các chủ sân đang sử dụng gói này trước đó vẫn giữ nguyên thời hạn đăng ký hiện tại.
          </p>
        </DialogHeader>

        <DialogFooter className="pt-4 border-t border-[#1b251e] gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9.5 px-4 rounded-xl border-[#1d2c23] bg-[#121c16] text-zinc-300 hover:text-white hover:bg-[#18261e] text-xs cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="h-9.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Đang xóa...' : 'Xác Nhận Xóa'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
