import { Pencil, Trash2 } from 'lucide-react';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { CourtStatus, type CourtDto } from '@/api/courts';

interface CourtTableProps {
  data: CourtDto[];
  isLoading: boolean;
  onEdit: (item: CourtDto) => void;
  onDelete: (item: CourtDto) => void;
}

export function CourtTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: CourtTableProps) {
  const columns: ColumnDef<CourtDto>[] = [
    {
      header: 'TÊN / SỐ HIỆU SÂN',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[200px]',
      cell: (item) => (
        <div className="font-bold text-foreground text-sm">
          {item.name}
        </div>
      ),
    },
    {
      header: 'LOẠI SÂN',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[160px]',
      cell: (item) => (
        <span className="text-sm text-foreground/90 font-medium">
          {item.courtTypeName || 'Thảm PVC'}
        </span>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[160px]',
      cell: (item) => {
        let badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
        let dotColor = 'bg-emerald-500';
        let label = 'Hoạt động';

        if (item.status === CourtStatus.Maintenance) {
          badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/30';
          dotColor = 'bg-amber-500';
          label = 'Bảo trì';
        } else if (item.status === CourtStatus.Inactive) {
          badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/30';
          dotColor = 'bg-rose-500';
          label = 'Không hoạt động';
        }

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}
          >
            <span className={`size-1.5 rounded-full ${dotColor}`} />
            {label}
          </span>
        );
      },
    },
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold text-muted-foreground text-right w-[110px] pr-4',
      className: 'text-right pr-4',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Chỉnh sửa sân"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
            title="Xóa sân"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <CommonTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="Chưa có sân nào"
      emptyDescription="Chi nhánh hiện tại chưa có sân nào được thêm. Hãy bấm '+ Thêm sân mới' để bắt đầu thiết lập."
    />
  );
}
