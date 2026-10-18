import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OwnerPageHeaderProps {
  title: string;
  category?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  description?: string;
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
  icon,
  description,
  className,
}: OwnerPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon && <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-emerald-800 shadow-sm dark:border-white/10 dark:bg-emerald-950/70 dark:text-emerald-300">{icon}</div>}
        <div className="space-y-1">
        {category && (
          <p className="text-xs md:text-sm font-medium text-muted-foreground/80 tracking-wide">
            {category}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
