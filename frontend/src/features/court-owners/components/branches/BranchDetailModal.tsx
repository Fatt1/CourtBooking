import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Star,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Loader2,
  Pencil,
} from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared/OwnerModal';
import { OwnerStatusBadge } from '@/features/court-owners/components/shared/OwnerStatusBadge';
import { getImageUrl } from '@/api/storage';
import { useOwnerBranchDetailQuery } from '../../api/useBranches';
import type { OwnerBranchListItem } from '../../types/branch';

interface BranchDetailModalProps {
  branch: OwnerBranchListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleStatus?: (branch: OwnerBranchListItem) => void;
  onEdit?: (branch: OwnerBranchListItem) => void;
}

export function BranchDetailModal({
  branch,
  open,
  onOpenChange,
  onToggleStatus,
  onEdit,
}: BranchDetailModalProps) {
  const { data: detail, isLoading } = useOwnerBranchDetailQuery(branch?.id || null);

  if (!branch) return null;

  const current = detail || branch;
  const fullAddress = [current.street, current.district, current.province]
    .filter(Boolean)
    .join(', ');

  const openTime = current.openTime ? current.openTime.slice(0, 5) : '00:00';
  const closeTime = current.closeTime ? current.closeTime.slice(0, 5) : '24:00';

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={current.name}
      maxWidth="max-w-xl"
      cancelText="Đóng"
      submitText={current.isActive ? 'Tạm dừng hoạt động' : 'Kích hoạt lại'}
      onSubmit={
        onToggleStatus
          ? () => {
              onToggleStatus(branch);
              onOpenChange(false);
            }
          : undefined
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-[#a3e635]" />
          <span className="text-xs">Đang tải thông tin chi tiết chi nhánh...</span>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {/* Header trạng thái & đánh giá */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-card/60 border border-border/50">
            <div className="flex items-center gap-2">
              <OwnerStatusBadge
                status={current.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                variant={current.isActive ? 'success' : 'warning'}
              />
              <span className="text-muted-foreground text-[11px]">
                {current.isActive
                  ? '• Sẵn sàng tiếp nhận đơn đặt'
                  : '• Đang tạm ngưng nhận đặt sân'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(branch);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="size-3" />
                  <span>Sửa cơ sở</span>
                </button>
              )}

              {current.averageRating ? (
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="size-3.5 fill-amber-400" />
                  <span>{current.averageRating.toFixed(1)} / 5.0</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-[11px]">Chưa có đánh giá</span>
              )}
            </div>
          </div>

          {/* Nhóm thông tin cơ sở */}
          <div className="space-y-3 p-4 rounded-xl bg-card/40 border border-border/40">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <Building2 className="size-4 text-[#a3e635]" />
              <span>Thông tin cơ sở sân</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Địa chỉ */}
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[11px] text-muted-foreground">Địa chỉ:</span>
                <div className="flex items-start gap-1.5 text-foreground font-medium">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{fullAddress || 'Chưa cập nhật'}</span>
                </div>
              </div>

              {/* Giờ mở cửa */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Khung giờ mở cửa:</span>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{openTime} - {closeTime}</span>
                </div>
              </div>

              {/* Hotline */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Hotline liên hệ:</span>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{current.hotline || 'Chưa cập nhật'}</span>
                </div>
              </div>

              {/* Google Maps link nếu có */}
              {detail?.ggMapUrl && (
                <div className="sm:col-span-2 pt-1">
                  <a
                    href={detail.ggMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#a3e635] hover:underline font-semibold"
                  >
                    <span>Xem vị trí trên Google Maps</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin VietQR tài khoản ngân hàng (nếu có trong detail) */}
          {detail?.accountNumber && (
            <div className="space-y-2 p-3.5 rounded-xl bg-card/40 border border-border/40">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <CreditCard className="size-4 text-emerald-400" />
                <span>Tài khoản VietQR thụ hưởng</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Số tài khoản: </span>
                  <span className="font-mono font-bold text-foreground">{detail.accountNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chủ tài khoản: </span>
                  <span className="font-bold text-foreground">{detail.accountName}</span>
                </div>
              </div>

              {/* QR Image nếu có */}
              {detail?.qrImage && (
                <div className="pt-2 flex items-center gap-3">
                  <img
                    src={getImageUrl(detail.qrImage.key)}
                    alt="VietQR Code"
                    className="size-16 rounded-lg object-contain bg-white p-1 border border-border/50 shrink-0"
                  />
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-slate-200">Mã QR chuyển khoản ngân hàng</span>
                    <p className="text-[10px] text-[#a3e635]">Quét mã VietQR để thanh toán tiền sân</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thư viện hình ảnh cơ sở */}
          {detail?.images && detail.images.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-card/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground">
                Hình ảnh chi nhánh ({detail.images.length} ảnh):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {detail.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="aspect-[3/2] rounded-lg overflow-hidden border border-border/50 bg-slate-900 group relative"
                  >
                    <img
                      src={getImageUrl(img.key)}
                      alt={`Branch image ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                      {idx === 0 ? 'Ảnh bìa' : `#${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Môn thể thao hỗ trợ */}
          {detail?.sports && detail.sports.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-card/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground">Các môn thể thao tại cơ sở:</span>
              <div className="flex flex-wrap gap-1.5">
                {detail.sports.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chính sách nếu có */}
          {detail?.policy && (
            <div className="space-y-1 p-3.5 rounded-xl bg-card/40 border border-border/40">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <ShieldCheck className="size-3.5 text-[#a3e635]" />
                <span>Chính sách đặt & hủy sân:</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {detail.policy}
              </p>
            </div>
          )}
        </div>
      )}
    </OwnerModal>
  );
}
