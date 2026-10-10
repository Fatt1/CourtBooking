import { useState, useMemo } from 'react';
import { Plus, LayoutGrid, LayoutList, Building2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  OwnerPageHeader,
  OwnerFilterBar,
} from '@/features/court-owners/components/shared';
import {
  BranchTable,
  BranchCard,
  BranchFormModal,
} from '@/features/court-owners/components/branches';
import {
  useOwnerBranchesQuery,
  useUpdateBranchStatusMutation,
  useDeleteBranchMutation,
} from '@/features/court-owners/api/useBranches';
import type { OwnerBranchListItem } from '@/features/court-owners/types/branch';

export function BranchesPage() {
  // 1. Gọi API lấy danh sách chi nhánh của Chủ sân từ Backend
  const { data: branches = [], isLoading } = useOwnerBranchesQuery();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateBranchStatusMutation();
  const { mutateAsync: deleteBranch, isPending: isDeleting } = useDeleteBranchMutation();

  // 2. States quản lý giao diện
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // 3. States quản lý Modal tạo/sửa chi nhánh
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<OwnerBranchListItem | null>(null);

  // States quản lý xác nhận Xóa chi nhánh chuẩn ServiceCategoriesPage
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<OwnerBranchListItem | null>(null);

  // Mở modal tạo chi nhánh mới
  const handleCreateBranch = () => {
    setBranchToEdit(null);
    setIsFormOpen(true);
  };

  // Mở modal chỉnh sửa chi nhánh
  const handleEditBranch = (branch: OwnerBranchListItem) => {
    setBranchToEdit(branch);
    setIsFormOpen(true);
  };

  // Mở modal xác nhận xóa chi nhánh
  const handleOpenDelete = (branch: OwnerBranchListItem) => {
    setBranchToDelete(branch);
    setIsDeleteOpen(true);
  };

  // Xác nhận xóa chi nhánh
  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    try {
      await deleteBranch(branchToDelete.id);
      toast.success(`Đã xóa chi nhánh "${branchToDelete.name}" thành công!`);
      setIsDeleteOpen(false);
      setBranchToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa chi nhánh';
      toast.error(msg, {
        description: 'Chi nhánh có thể đang có sân hoặc đơn đặt sân hoạt động.',
      });
    }
  };

  // 4. Lọc và tìm kiếm theo dữ liệu trả về từ Backend
  // Chỉ lọc theo các field thực tế có: name, hotline, province, district, street, isActive
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      // Lọc theo Tab trạng thái
      if (activeTab === 'active' && !branch.isActive) return false;
      if (activeTab === 'inactive' && branch.isActive) return false;

      // Tìm kiếm theo từ khóa
      if (!search.trim()) return true;
      const query = search.trim().toLowerCase();
      const matchName = branch.name?.toLowerCase().includes(query);
      const matchHotline = branch.hotline?.toLowerCase().includes(query);
      const matchProvince = branch.province?.toLowerCase().includes(query);
      const matchDistrict = branch.district?.toLowerCase().includes(query);
      const matchStreet = branch.street?.toLowerCase().includes(query);

      return matchName || matchHotline || matchProvince || matchDistrict || matchStreet;
    });
  }, [branches, activeTab, search]);

  // Đếm số lượng cho các Tabs
  const totalCount = branches.length;
  const activeCount = branches.filter((b) => b.isActive).length;
  const inactiveCount = branches.filter((b) => !b.isActive).length;

  const tabs = [
    { id: 'all', label: 'Tất cả cơ sở', count: totalCount },
    { id: 'active', label: 'Đang hoạt động', count: activeCount },
    { id: 'inactive', label: 'Tạm dừng', count: inactiveCount },
  ];

  // Thao tác đổi trạng thái Hoạt động / Tạm dừng
  const handleToggleStatus = async (branch: OwnerBranchListItem) => {
    try {
      const nextStatus = !branch.isActive;
      await updateStatus({
        id: branch.id,
        isActive: nextStatus,
      });

      toast.success(
        nextStatus
          ? `Đã kích hoạt lại chi nhánh "${branch.name}"`
          : `Đã tạm dừng nhận đơn tại chi nhánh "${branch.name}"`
      );
    } catch {
      toast.error('Không thể cập nhật trạng thái chi nhánh. Vui lòng thử lại!');
    }
  };

  return (
    <div className="space-y-6">
      {/* KHỐI 1: Tiêu đề trang + Nút chuyển chế độ xem & Thêm mới */}
      <OwnerPageHeader
        category="Cơ sở sân bãi"
        title="Quản lý chi nhánh"
        actions={
          <div className="flex items-center gap-2.5">
            {/* Chuyển đổi xem Bảng / xem Lưới Card */}
            <div className="flex items-center rounded-xl border border-border/60 bg-card/60 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={`size-8 p-0 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#a3e635] text-black shadow-xs font-bold hover:bg-[#8ece28]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Xem dạng bảng"
              >
                <LayoutList className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`size-8 p-0 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#a3e635] text-black shadow-xs font-bold hover:bg-[#8ece28]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Xem dạng thẻ"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>

            {/* Nút Thêm mới chuẩn Matchday Lego button */}
            <Button
              className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs cursor-pointer"
              onClick={handleCreateBranch}
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Thêm chi nhánh</span>
            </Button>
          </div>
        }
      />

      {/* KHỐI 2: Thanh tìm kiếm & Tabs lọc trạng thái */}
      <OwnerFilterBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as 'all' | 'active' | 'inactive');
        }}
        searchPlaceholder="Tìm theo tên chi nhánh, địa chỉ, hotline..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
      />

      {/* KHỐI 3: Danh sách Chi nhánh (chế độ Table hoặc Grid không phân trang) */}
      {viewMode === 'table' ? (
        <BranchTable
          data={filteredBranches}
          isLoading={isLoading}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEditBranch}
          onDelete={handleOpenDelete}
          isUpdatingStatus={isUpdatingStatus}
        />
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-48 rounded-2xl border border-border/60 bg-card/40 animate-pulse p-5"
                />
              ))}
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center space-y-3">
              <div className="mx-auto size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Building2 className="size-6" />
              </div>
              <h3 className="font-bold text-foreground text-base">Không tìm thấy chi nhánh nào</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? `Không có cơ sở nào phù hợp với từ khóa "${search}".`
                  : 'Chủ sân chưa tạo cơ sở nào trong mục này.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEditBranch}
                  onDelete={handleOpenDelete}
                  isUpdatingStatus={isUpdatingStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* KHỐI 4: Modal Thêm / Cập nhật chi nhánh dùng chung */}
      <BranchFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        branchToEdit={branchToEdit}
      />

      {/* KHỐI 5: Modal xác nhận xóa chi nhánh chuẩn ServiceCategoriesPage */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-[#0B1324] border-border/70 rounded-2xl p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 text-lg font-bold">
              <Trash2 className="size-5" /> Xác nhận xóa chi nhánh
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 text-sm">
              Bạn có chắc chắn muốn xóa chi nhánh{' '}
              <span className="font-bold text-white">"{branchToDelete?.name}"</span>? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="h-10 rounded-xl bg-[#131d31] border-border/60 text-white hover:bg-[#1a2742] cursor-pointer"
            >
              Không, giữ lại
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-10 rounded-xl font-bold cursor-pointer"
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
