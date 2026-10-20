import { useState } from 'react';
import type {
  ServicePackageConfigItem,
  UpdatePackagePayload,
} from '@/api/subscriptions';
import { EditServicePackageDialog } from './EditServicePackageDialog';
import { DeletePackageDialog } from './DeletePackageDialog';

interface Props {
  packages: ServicePackageConfigItem[];
  onUpdatePackage?: (payload: UpdatePackagePayload) => Promise<void>;
  onDeletePackage?: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

// Hàm format giá số dạng 299.000
function formatPriceVN(num: number): string {
  return num.toLocaleString('vi-VN');
}

export function PackageConfigTab({
  packages,
  onUpdatePackage,
  onDeletePackage,
  isUpdating,
  isDeleting,
}: Props) {
  const [editingPkg, setEditingPkg] = useState<ServicePackageConfigItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deletingPkg, setDeletingPkg] = useState<ServicePackageConfigItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenEdit = (pkg: ServicePackageConfigItem) => {
    setEditingPkg(pkg);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (pkg: ServicePackageConfigItem) => {
    setDeletingPkg(pkg);
    setDeleteDialogOpen(true);
  };

  const handleConfirmUpdate = async (payload: UpdatePackagePayload) => {
    if (onUpdatePackage) {
      await onUpdatePackage(payload);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    if (onDeletePackage) {
      await onDeletePackage(id);
    }
  };

  return (
    <div className="pt-2">
      {/* 3 Cột Card Gói Cước Khớp 100% Theo Ảnh Giao Diện */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {packages.map((pkg) => {
          const isPro = pkg.code === 'Pro' || pkg.popular;
          const isUltra = pkg.code === 'Ultra' || pkg.code === 'VIP';
          const isBasic = !isPro && !isUltra;

          // Huy hiệu chuẩn: Basic -> KHỞI ĐẦU, Pro -> PHỔ BIẾN NHẤT, Ultra -> TOÀN DIỆN
          const badgeText =
            pkg.badge ||
            (isPro ? 'PHỔ BIẾN NHẤT' : isUltra ? 'TOÀN DIỆN' : 'KHỞI ĐẦU');

          const periodText = `/ ${pkg.durationMonths || 1} tháng · Đang mở bán`;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl bg-[#0c1410] border p-6 flex flex-col justify-between min-h-[280px] transition-all duration-200 ${
                isPro
                  ? 'border-[#1b3024] hover:border-emerald-500/50 shadow-xl shadow-emerald-950/20'
                  : 'border-[#17231b] hover:border-[#223528]'
              }`}
            >
              {/* Phần Nội Dung Trên */}
              <div>
                {/* 1. Hàng đầu: Badge */}
                <div className="flex items-center justify-start">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                      isPro
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isUltra
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-[#141d18] text-zinc-400 border-[#1e2c22]'
                    }`}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* 2. Tiêu đề gói */}
                <div className="mt-5">
                  <h3 className="text-3xl font-bold tracking-tight text-white">
                    {pkg.name}
                  </h3>
                </div>

                {/* 3. Giá & Trạng thái chu kỳ */}
                <div className="mt-5 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                      {formatPriceVN(pkg.price)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      đ
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1.5 font-medium">
                    {periodText}
                  </div>
                </div>
              </div>

              {/* Phần 2 Nút Hành Động Xếp Dọc Dưới Cùng */}
              <div className="pt-2 space-y-2.5">
                {/* Nút 1: Chỉnh sửa gói dịch vụ (Gói Pro là màu xanh lục đặc trưng) */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(pkg)}
                  className={`w-full h-11 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isPro
                      ? 'bg-[#00875a] hover:bg-[#00754e] text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-[#121c16] hover:bg-[#18271e] text-zinc-200 hover:text-white border border-[#1e2d22]'
                  }`}
                >
                  Chỉnh sửa gói dịch vụ
                </button>

                {/* Nút 2: Xóa gói dịch vụ */}
                <button
                  type="button"
                  onClick={() => handleOpenDelete(pkg)}
                  className="w-full h-11 rounded-xl bg-[#111713] hover:bg-[#1a1415] text-zinc-400 hover:text-rose-400 border border-[#1b251e] hover:border-rose-900/40 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
                >
                  Xóa gói dịch vụ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog Chỉnh sửa gói */}
      <EditServicePackageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        servicePackage={editingPkg}
        onSubmit={handleConfirmUpdate}
        isSubmitting={isUpdating}
      />

      {/* Dialog Xác nhận xóa gói */}
      <DeletePackageDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        servicePackage={deletingPkg}
        onConfirm={handleConfirmDelete}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
