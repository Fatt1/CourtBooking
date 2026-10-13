import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface OwnerPaginationProps {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Component phân trang chuẩn cho tất cả danh sách của Owner theo phong cách Figma.
 * Hỗ trợ:
 * - Dòng tóm tắt kết quả
 * - Dropdown chọn số dòng trên trang (pageSize: 25, 50, 100...)
 * - Danh sách số trang thông minh với dấu "..." khi vượt quá số lượng
 * - Nút điều hướng "Trước" / "Tiếp"
 */
export function OwnerPagination({
  currentPage = 1,
  pageSize = 25,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: OwnerPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // Đảm bảo pageSize hiện tại luôn nằm trong options
  const options = useMemo(() => {
    if (!pageSizeOptions.includes(pageSize)) {
      return [...pageSizeOptions, pageSize].sort((a, b) => a - b);
    }
    return pageSizeOptions;
  }, [pageSize, pageSizeOptions]);

  // Thuật toán hiển thị số trang với dấu "..."
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        items.push(i);
      }
      items.push('ellipsis-end');
      items.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      items.push(1);
      items.push('ellipsis-start');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      items.push('ellipsis-start');
      items.push(currentPage - 1);
      items.push(currentPage);
      items.push(currentPage + 1);
      items.push('ellipsis-end');
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-center justify-between gap-4 pt-4 text-xs md:text-sm text-muted-foreground',
        className
      )}
    >
      {/* Vế trái: Tóm tắt kết quả & Dropdown PageSize */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          Hiển thị <span className="font-semibold text-foreground">{from}</span> -{' '}
          <span className="font-semibold text-foreground">{to}</span> trong{' '}
          <span className="font-semibold text-foreground">{totalItems}</span> kết quả
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-border/50 text-xs">
            <span className="text-muted-foreground whitespace-nowrap">Hiển thị:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[76px] rounded-lg border-border/60 bg-card/60 text-xs font-semibold cursor-pointer">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60 z-50">
                {options.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs cursor-pointer">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground whitespace-nowrap">/ trang</span>
          </div>
        )}
      </div>

      {/* Vế phải: Nút Trước, Danh sách số trang (...), Nút Tiếp */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Nút Trước */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="border-border/60 bg-card/60 hover:bg-accent px-3 h-8.5 rounded-lg text-xs font-semibold gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        {/* Danh sách số trang */}
        {paginationItems.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="size-8.5 flex items-center justify-center text-xs text-muted-foreground select-none"
              >
                <MoreHorizontal className="size-4" />
              </span>
            );
          }

          const isCurrent = item === currentPage;
          return (
            <Button
              key={`page-${item}`}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange?.(item)}
              className={cn(
                'size-8.5 p-0 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                isCurrent
                  ? 'bg-[#a3e635] text-black hover:bg-[#8ece28] border-[#a3e635] font-bold shadow-xs'
                  : 'border-border/60 bg-card/60 hover:bg-accent text-foreground'
              )}
            >
              {item}
            </Button>
          );
        })}

        {/* Nút Tiếp */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="border-border/60 bg-card/60 hover:bg-accent px-3 h-8.5 rounded-lg text-xs font-semibold gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Tiếp</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
