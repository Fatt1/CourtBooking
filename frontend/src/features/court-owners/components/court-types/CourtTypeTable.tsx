import { Pencil, Trash2, Clock, Grid3X3, Layers } from 'lucide-react';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import type { CourtTypeDto } from '@/api/court-types';

interface CourtTypeTableProps {
  data: CourtTypeDto[];
  isLoading: boolean;
  onEdit: (item: CourtTypeDto) => void;
  onDelete: (item: CourtTypeDto) => void;
}

export function CourtTypeTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: CourtTypeTableProps) {
  const columns: ColumnDef<CourtTypeDto>[] = [
    {
      header: 'TÊN LOẠI SÂN',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[220px]',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
            <Layers className="size-4.5" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">{item.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Mã: CT-{item.id.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'THỜI LƯỢNG SLOT ĐẶT',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[160px]',
      cell: (item) => (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-xs font-medium text-foreground">
          <Clock className="size-3.5 text-[#a3e635]" />
          <span>{item.minutesConfig} phút / lượt</span>
        </div>
      ),
    },
    {
      header: 'SỐ SÂN CON TRỰC THUỘC',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[170px]',
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Grid3X3 className="size-3.5 text-muted-foreground" />
          <span>
            {item.courtCount > 0 ? (
              <span className="font-semibold text-foreground">{item.courtCount} sân</span>
            ) : (
              <span className="text-muted-foreground">Chưa có sân</span>
            )}
          </span>
        </div>
      ),
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
            title="Chỉnh sửa loại sân"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
            title="Xóa loại sân"
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
      emptyTitle="Chưa có loại sân nào"
      emptyDescription="Chi nhánh hiện tại chưa có cấu hình loại sân nào. Hãy bấm 'Thêm loại sân' để bắt đầu cấu hình."
    />
  );
}
