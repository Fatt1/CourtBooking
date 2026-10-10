import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

interface OwnerStatusBadgeProps {
  status?: string;
  variant?: StatusVariant;
  children?: ReactNode;
  className?: string;
}

/**
 * Component hiển thị Badge Trạng thái chuẩn hóa màu sắc theo Figma.
 * Đồng bộ toàn bộ các trạng thái: Đang sử dụng, Chờ duyệt hủy, Hoàn thành, Đã hủy, Chờ thanh toán...
 */
export function OwnerStatusBadge({
  status,
  variant,
  children,
  className,
}: OwnerStatusBadgeProps) {
  // Chuẩn hóa tên trạng thái
  const normalizedStatus = status?.trim().toLowerCase();

  // Tự động nhận diện variant nếu chưa truyền
  let finalVariant: StatusVariant = variant || 'neutral';
  let label = children || status;

  if (!variant && normalizedStatus) {
    if (
      normalizedStatus.includes('đang sử dụng') ||
      normalizedStatus.includes('in_use') ||
      normalizedStatus.includes('active') ||
      normalizedStatus.includes('hoạt động') ||
      normalizedStatus.includes('đã thanh toán')
    ) {
      finalVariant = 'success';
    } else if (
      normalizedStatus.includes('hủy') ||
      normalizedStatus.includes('cancel') ||
      normalizedStatus.includes('chưa thanh toán') ||
      normalizedStatus.includes('từ chối')
    ) {
      finalVariant = 'danger';
    } else if (
      normalizedStatus.includes('chờ') ||
      normalizedStatus.includes('pending') ||
      normalizedStatus.includes('waiting')
    ) {
      finalVariant = 'warning';
    } else if (
      normalizedStatus.includes('hoàn thành') ||
      normalizedStatus.includes('completed') ||
      normalizedStatus.includes('xong')
    ) {
      finalVariant = 'neutral';
    }
  }

  const variantStyles: Record<StatusVariant, string> = {
    // Xanh Neon đặc trưng thể thao của Figma
    success: 'bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/30 font-semibold',
    // Đỏ nổi bật (Chờ duyệt hủy, Đã hủy)
    danger: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-medium',
    // Vàng hổ phách (Chờ xử lý, Đang giữ chỗ)
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium',
    // Xám trung tính (Hoàn thành, Lịch sử)
    neutral: 'bg-muted/80 text-muted-foreground border-border/60 font-medium',
    // Xanh dương
    info: 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs transition-colors',
        variantStyles[finalVariant],
        className
      )}
    >
      {label}
    </span>
  );
}
