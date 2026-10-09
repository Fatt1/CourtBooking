import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';

export interface ColumnDef<T> {
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface CommonTableProps<T> {
  columns: ColumnDef<T>[];
  data?: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  getRowKey?: (item: T, index: number) => string | number;
}

/**
 * Reusable Data Table Component xây dựng trên nền Shadcn Table.
 * Dùng chung cho tất cả các trang (Users, Orders, Branches,...)
 * Hỗ trợ tự động: Skeleton Loading, Empty State, Custom Cell Renderers và Type Safety.
 */
export function CommonTable<T>({
  columns,
  data = [],
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = 'Không tìm thấy dữ liệu',
  emptyDescription = 'Hiện chưa có bản ghi nào để hiển thị.',
  onRowClick,
  getRowKey,
}: CommonTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {Array.from({ length: skeletonRows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0"
          >
            {columns.map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-5 flex-1 max-w-[140px]" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, idx) => (
            <TableHead key={idx} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, rowIndex) => {
          const key = getRowKey ? getRowKey(item, rowIndex) : (item as any)?.id || rowIndex;
          return (
            <TableRow
              key={key}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/60 transition-colors' : ''}
            >
              {columns.map((col, colIndex) => {
                let content: ReactNode = null;
                if (col.cell) {
                  content = col.cell(item, rowIndex);
                } else if (col.accessorKey) {
                  content = String(item[col.accessorKey] ?? '—');
                }

                return (
                  <TableCell key={colIndex} className={col.className}>
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
