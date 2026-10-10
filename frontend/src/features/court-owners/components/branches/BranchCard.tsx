import { Building2, MapPin, Clock, Phone, Star, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared/OwnerStatusBadge';
import type { OwnerBranchListItem } from '../../types/branch';

interface BranchCardProps {
  branch: OwnerBranchListItem;
  onToggleStatus: (branch: OwnerBranchListItem) => void;
  onEdit?: (branch: OwnerBranchListItem) => void;
  onDelete?: (branch: OwnerBranchListItem) => void;
  isUpdatingStatus?: boolean;
}

export function BranchCard({
  branch,
  onToggleStatus,
  onEdit,
  onDelete,
  isUpdatingStatus = false,
}: BranchCardProps) {
  const fullAddress = [branch.street, branch.district, branch.province]
    .filter(Boolean)
    .join(', ');

  const open = branch.openTime ? branch.openTime.slice(0, 5) : '00:00';
  const close = branch.closeTime ? branch.closeTime.slice(0, 5) : '24:00';

  return (
    <Card
      className="relative overflow-hidden border border-border/60 bg-card/70 hover:border-[#a3e635]/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 rounded-2xl flex flex-col justify-between group"
    >
      <div>
        <CardHeader className="flex flex-row items-start justify-between pb-3 pt-5 px-5 space-y-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="size-5.5 text-[#a3e635]" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground line-clamp-1 group-hover:text-[#a3e635] transition-colors">
                {branch.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                {branch.averageRating ? (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-xs">
                    <Star className="size-3 fill-amber-400" />
                    {branch.averageRating.toFixed(1)} / 5.0
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Chưa có đánh giá</span>
                )}
              </div>
            </div>
          </div>

          <OwnerStatusBadge
            status={branch.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
            variant={branch.isActive ? 'success' : 'warning'}
          />
        </CardHeader>

        <CardContent className="space-y-3 px-5 pb-4 pt-1 text-xs">
          {/* Địa chỉ */}
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-muted-foreground/80 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed text-foreground/90" title={fullAddress}>
              {fullAddress || 'Chưa cập nhật địa chỉ'}
            </span>
          </div>

          {/* Khung giờ mở cửa & Hotline */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <span>
                {open} - {close}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium justify-end">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{branch.hotline || 'Chưa có'}</span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer Nút Thao Tác */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-border/30 gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={isUpdatingStatus}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(branch);
          }}
          className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
            branch.isActive
              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              : 'text-[#a3e635] hover:text-[#b4f045] hover:bg-[#a3e635]/10'
          }`}
        >
          {branch.isActive ? 'Tạm dừng cơ sở' : 'Kích hoạt lại'}
        </Button>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(branch);
              }}
              title="Chỉnh sửa chi nhánh"
              className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5" />
            </button>
          )}

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
      </div>
    </Card>
  );
}
