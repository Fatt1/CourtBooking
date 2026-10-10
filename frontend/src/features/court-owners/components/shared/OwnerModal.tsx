import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface OwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  hideFooter?: boolean;
}

/**
 * Modal chuẩn dùng chung cho tất cả các màn hình của Owner theo Figma Matchday.
 * Hỗ trợ giao diện nền tối sang trọng #0B1324, ẩn thanh cuộn xấu (no-scrollbar),
 * linh hoạt hỗ trợ icon badge, mô tả phụ đề, và kích thước maxWidth đa dạng.
 */
export function OwnerModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  onSubmit,
  onCancel,
  submitText = 'Lưu danh mục',
  cancelText = 'Hủy',
  isSubmitting = false,
  maxWidth = 'max-w-md',
  className,
  bodyClassName,
  hideFooter = false,
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
          'w-[95vw] max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl border border-border/70 bg-[#0B1324] p-6 text-foreground shadow-2xl backdrop-blur-md sm:p-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          maxWidth,
          className
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 text-left">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="size-9 rounded-xl bg-lime-400/10 flex items-center justify-center text-[#a3e635] shrink-0">
                {icon}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Nội dung Form */}
        <div className={cn('py-2 text-sm', bodyClassName)}>{children}</div>

        {/* Footer Cụm Nút Hành Động chuẩn Figma (nếu không ẩn) */}
        {!hideFooter && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
