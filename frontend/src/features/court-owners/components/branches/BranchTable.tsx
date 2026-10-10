import { MapPin, Clock, Phone, Building2, Star, Pencil, Trash2 } from 'lucide-react';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared/OwnerStatusBadge';
import { Button } from '@/components/ui/button';
import type { OwnerBranchListItem } from '../../types/branch';

interface BranchTableProps {
  data: OwnerBranchListItem[];
  isLoading: boolean;
  onToggleStatus: (branch: OwnerBranchListItem) => void;
  onEdit?: (branch: OwnerBranchListItem) => void;
  onDelete?: (branch: OwnerBranchListItem) => void;
  isUpdatingStatus?: boolean;
}

export function BranchTable({
  data,
  isLoading,
  onToggleStatus,
  onEdit,
  onDelete,
  isUpdatingStatus = false,
}: BranchTableProps) {
  const columns: ColumnDef<OwnerBranchListItem>[] = [
    {
      header: 'CƠ SỞ SÂN BÃI',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[280px]',
      cell: (branch) => {
        const fullAddress = [branch.street, branch.district, branch.province]
          .filter(Boolean)
          .join(', ');

        return (
          <div className="flex items-start gap-3 py-1">
            <div className="size-10 rounded-xl bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="size-5 text-[#a3e635]" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-bold text-foreground text-sm block truncate" title={branch.name}>
                {branch.name}
              </span>
              <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-md">
                <MapPin className="size-3.5 text-muted-foreground/80 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed text-slate-300" title={fullAddress}>
                  {fullAddress || 'Chưa cập nhật địa chỉ'}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'ĐÁNH GIÁ',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[140px]',
      cell: (branch) => (
        <div className="flex items-center gap-1.5">
          {branch.averageRating ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-xs">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{branch.averageRating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground font-normal">/ 5.0</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Chưa có đánh giá</span>
          )}
        </div>
      ),
    },
    {
      header: 'KHUNG GIỜ MỞ CỬA',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[160px]',
      cell: (branch) => {
        const open = branch.openTime ? branch.openTime.slice(0, 5) : '00:00';
        const close = branch.closeTime ? branch.closeTime.slice(0, 5) : '24:00';

        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              {open} - {close}
            </span>
          </div>
        );
      },
    },
    {
      header: 'HOTLINE LIÊN HỆ',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[150px]',
      cell: (branch) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Phone className="size-3.5 text-muted-foreground shrink-0" />
          <span>{branch.hotline || 'Chưa có'}</span>
        </div>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[140px]',
      cell: (branch) => (
        <OwnerStatusBadge
          status={branch.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
          variant={branch.isActive ? 'success' : 'warning'}
        />
      ),
    },
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground text-right w-[180px] pr-4',
      className: 'text-right pr-4',
      cell: (branch) => (
        <div className="flex items-center justify-end gap-2">
          {/* Nút Bật/Tắt trạng thái hoạt động (Giữ lại nút tạm dừng) */}
          <Button
            variant="ghost"
            size="sm"
            disabled={isUpdatingStatus}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(branch);
            }}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              branch.isActive
                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                : 'text-[#a3e635] hover:text-[#b4f045] hover:bg-[#a3e635]/10'
            }`}
          >
            {branch.isActive ? 'Tạm dừng' : 'Kích hoạt'}
          </Button>

          {/* Nút sửa (Pencil) giống hệt ServiceCategoriesPage */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(branch);
              }}
              title="Chỉnh sửa thông tin chi nhánh"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5" />
            </button>
          )}

          {/* Nút xóa (Trash) giống hệt ServiceCategoriesPage */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(branch);
              }}
              title="Xóa chi nhánh"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <CommonTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="Chưa có chi nhánh nào"
      emptyDescription="Bấm nút 'Thêm chi nhánh' để tạo cơ sở đầu tiên cho cụm sân của bạn."
    />
  );
}
