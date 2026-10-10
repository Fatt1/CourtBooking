import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OwnerPageHeaderProps {
  title: string;
  category?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Component Header chuẩn cho tất cả các trang quản lý của Owner.
 * Đảm bảo 100% trang có cùng font, khoảng cách, phân cấp tiêu đề và cụm nút hành động.
 */
export function OwnerPageHeader({
  title,
  category,
  actions,
  className,
}: OwnerPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        {category && (
          <p className="text-xs md:text-sm font-medium text-muted-foreground/80 tracking-wide">
            {category}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
