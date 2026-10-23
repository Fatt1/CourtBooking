import { useState } from 'react';
import { toast } from 'sonner';
import {
  useSubscriptionHistoryQuery,
  useServicePackagesConfigQuery,
  useExtendSubscriptionMutation,
  useToggleSubscriptionStatusMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  type SubscriptionHistoryItem,
  type UpdatePackagePayload,
} from '@/api/subscriptions';
import {
  SubscriptionExtendDialog,
  PauseConfirmDialog,
  PackageConfigTab,
  SubscriptionHistoryTab,
} from '../components/subscriptions';

type TabKey = 'packages' | 'history';

/**
 * Trang Gói cước & Đăng ký - Cổng Quản Trị Hệ Thống CourtOS Admin Console
 * Thiết kế pixel-perfect khớp chuẩn xác theo giao diện mẫu người dùng cung cấp.
 */
export function SubscriptionsPage() {
  // Mặc định hiển thị tab Cấu hình gói dịch vụ như trên ảnh người dùng cung cấp
  const [activeTab, setActiveTab] = useState<TabKey>('packages');

  // Modals Lịch sử đăng ký
  const [selectedSub, setSelectedSub] = useState<SubscriptionHistoryItem | null>(null);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);

  // Queries & Mutations
  const { data: historyData, isLoading: isLoadingHistory } = useSubscriptionHistoryQuery({
    page: 1,
    pageSize: 10,
  });

  const { data: packagesData = [], isLoading: isLoadingPackages } = useServicePackagesConfigQuery();

  const { mutateAsync: extendSub, isPending: isExtending } = useExtendSubscriptionMutation();
  const { mutateAsync: toggleStatus, isPending: isTogglingStatus } = useToggleSubscriptionStatusMutation();
  const { mutateAsync: updatePackage, isPending: isUpdatingPackage } = useUpdatePackageMutation();
  const { mutateAsync: deletePackage, isPending: isDeletingPackage } = useDeletePackageMutation();

  const subscriptions = historyData?.items || [];
  const expiringSoonCount = historyData?.expiringSoonCount ?? 2;
  const totalCount = historyData?.totalCount ?? subscriptions.length;
  const totalPages = historyData?.totalPages || 1;
  const currentPage = historyData?.page || 1;

  // Xử lý gia hạn thuê bao cho chủ sân
  const handleOpenExtend = (sub: SubscriptionHistoryItem) => {
    setSelectedSub(sub);
    setExtendModalOpen(true);
  };

  const handleConfirmExtend = async (courtOwnerId: string, durationMonths: number) => {
    try {
      await extendSub({ courtOwnerId, durationMonths });
      toast.success(
        `Đã gia hạn thành công thêm ${durationMonths} tháng cho ${selectedSub?.ownerName || 'chủ sân'}!`
      );
    } catch {
      toast.error('Có lỗi xảy ra khi gia hạn gói cước.');
    }
  };

  // Xử lý tạm dừng / mở lại sân
  const handleOpenPauseToggle = (sub: SubscriptionHistoryItem) => {
    setSelectedSub(sub);
    setPauseModalOpen(true);
  };

  const handleConfirmPauseToggle = async (courtOwnerId: string, newStatus: 0 | 1) => {
    try {
      await toggleStatus({ courtOwnerId, status: newStatus });
      toast.success(
        newStatus === 1
          ? `Đã tạm dừng hoạt động cụm sân của ${selectedSub?.ownerName}.`
          : `Đã mở lại hoạt động cụm sân của ${selectedSub?.ownerName}.`
      );
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái cụm sân.');
    }
  };

  // Xử lý cập nhật gói cước SaaS
  const handleUpdatePackage = async (payload: UpdatePackagePayload) => {
    try {
      await updatePackage(payload);
      toast.success(`Đã cập nhật thành công gói dịch vụ "${payload.name}"!`);
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật gói dịch vụ.');
    }
  };

  // Xử lý xóa gói cước
  const handleDeletePackage = async (id: string) => {
    try {
      await deletePackage(id);
      toast.success('Đã xóa gói dịch vụ thành công.');
    } catch {
      toast.error('Có lỗi xảy ra khi xóa gói dịch vụ.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
          WORKSPACE / SERVICES
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Gói cước & đăng ký
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Quản lý dịch vụ SaaS và lịch sử biến động gói của chủ sân.
        </p>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#141b16] pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'packages'
              ? 'text-white border-b-2 border-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Cấu hình gói dịch vụ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition-colors relative inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'text-white border-b-2 border-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Lịch sử</span>
          {expiringSoonCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#39280d] px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
              {expiringSoonCount} sắp hết hạn
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'packages' ? (
        <PackageConfigTab
          packages={packagesData}
          onUpdatePackage={handleUpdatePackage}
          onDeletePackage={handleDeletePackage}
          isUpdating={isUpdatingPackage}
          isDeleting={isDeletingPackage}
        />
      ) : (
        <SubscriptionHistoryTab
          subscriptions={subscriptions}
          isLoading={isLoadingHistory}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          onExtend={handleOpenExtend}
          onTogglePause={handleOpenPauseToggle}
        />
      )}

      {/* 4. Bottom Footer Info (Khớp góc dưới cùng ảnh) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-zinc-500">
        <div>© 2026 CourtOS. Không gian quản trị hệ thống.</div>
        <div>Bản UI tương tác · Dữ liệu minh họa</div>
      </div>

      {/* Modals Lịch sử đăng ký */}
      <SubscriptionExtendDialog
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
        subscription={selectedSub}
        onSubmit={handleConfirmExtend}
        isSubmitting={isExtending}
      />

      <PauseConfirmDialog
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        subscription={selectedSub}
        onConfirm={handleConfirmPauseToggle}
        isSubmitting={isTogglingStatus}
      />
    </div>
  );
}
