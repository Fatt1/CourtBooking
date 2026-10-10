import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  maxWidth?: string;
  className?: string;
}

/**
 * Modal chuẩn cho tất cả các màn hình của Owner theo Figma Matchday.
 * Đảm bảo 100% modal thêm mới/chỉnh sửa có cùng giao diện nền tối sang trọng,
 * bo góc mềm mại, font tiêu đề và cụm nút [Hủy] + [Lưu danh mục / Lưu thay đổi].
 */
export function OwnerModal({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  onCancel,
  submitText = 'Lưu danh mục',
  cancelText = 'Hủy',
  isSubmitting = false,
  maxWidth = 'max-w-md',
  className,
}: OwnerModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[92vw] rounded-2xl border border-border/70 bg-[#0B1324] p-6 text-foreground shadow-2xl backdrop-blur-md sm:p-7',
          maxWidth,
          className
        )}
      >
        <DialogHeader className="space-y-0 pb-1 text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Nội dung Form */}
        <div className="space-y-5 py-2 text-sm">{children}</div>

        {/* Footer Cụm Nút Hành Động chuẩn Figma */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-11 rounded-xl border border-border/60 bg-[#131d31] px-6 text-sm font-bold text-white hover:bg-[#1a2742] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-[#a3e635] px-6 text-sm font-bold text-black hover:bg-[#8ece28] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : submitText}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
