import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OwnerPaginationProps {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (newPage: number) => void;
  className?: string;
}

/**
 * Component phân trang chuẩn cho tất cả danh sách của Owner theo phong cách Figma.
 * Hiển thị dòng tóm tắt số kết quả và các nút điều hướng "Trước" / "Tiếp".
 */
export function OwnerPagination({
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  className,
}: OwnerPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-muted-foreground',
        className
      )}
    >
      <div>
        Hiển thị <span className="font-medium text-foreground">{from}</span> -{' '}
        <span className="font-medium text-foreground">{to}</span> trong{' '}
        <span className="font-medium text-foreground">{totalItems}</span> kết quả
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="border-border/60 bg-card/60 hover:bg-accent px-4 py-1.5 h-8.5 rounded-lg text-xs font-semibold"
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="border-border/60 bg-card/60 hover:bg-accent px-4 py-1.5 h-8.5 rounded-lg text-xs font-semibold"
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
