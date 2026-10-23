import { useState, useMemo } from 'react';
import { Plus, Trash2, Building2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  OwnerPageHeader,
  OwnerPagination,
} from '@/features/court-owners/components/shared';
import {
  CourtTable,
  CourtFormModal,
} from '@/features/court-owners/components/courts';
import {
  useCourtsQuery,
  useCreateCourtMutation,
  useUpdateCourtMutation,
  useDeleteCourtMutation,
  CourtStatus,
  type CourtDto,
} from '@/api/courts';
import { useCourtTypesQuery } from '@/api/court-types';
import { useBranchStore } from '@/stores/useBranchStore';

const PAGE_SIZE = 10;

export function CourtsPage() {
  // 1. Chi nhánh hiện tại từ Zustand store
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 2. Filter states
  const [selectedCourtType, setSelectedCourtType] = useState<string>('all'); // Tất cả loại sân
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // Mọi trạng thái
  const [currentPage, setCurrentPage] = useState(1);

  // 3. Gọi các Query
  const statusParam =
    selectedStatus === 'available'
      ? CourtStatus.Available
      : selectedStatus === 'maintenance'
      ? CourtStatus.Maintenance
      : selectedStatus === 'inactive'
      ? CourtStatus.Inactive
      : undefined;

  const courtTypeParam = selectedCourtType === 'all' ? undefined : selectedCourtType;

  const { data: courts = [], isLoading: isLoadingCourts } = useCourtsQuery({
    branchId: selectedBranchId || undefined,
    courtTypeId: courtTypeParam,
    status: statusParam,
  });

  const { data: courtTypes = [] } = useCourtTypesQuery(selectedBranchId);

  // 4. Mutations
  const { mutateAsync: createCourt, isPending: isCreating } = useCreateCourtMutation();
  const { mutateAsync: updateCourt, isPending: isUpdating } = useUpdateCourtMutation();
  const { mutateAsync: deleteCourt, isPending: isDeleting } = useDeleteCourtMutation();

  // 5. Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courtToEdit, setCourtToEdit] = useState<CourtDto | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<CourtDto | null>(null);

  // Handlers mở modal
  const handleOpenCreate = () => {
    if (!selectedBranchId) {
      toast.error('Vui lòng chọn hoặc tạo chi nhánh trước khi thêm sân!');
      return;
    }
    if (courtTypes.length === 0) {
      toast.warning('Chi nhánh này chưa có loại sân nào. Vui lòng tạo loại sân trước!');
    }
    setCourtToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: CourtDto) => {
    setCourtToEdit(item);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: CourtDto) => {
    setCourtToDelete(item);
    setIsDeleteOpen(true);
  };

  // Submit form thêm / sửa
  const handleFormSubmit = async (values: { courtTypeId: string; name: string; status?: CourtStatus }) => {
    if (courtToEdit) {
      await updateCourt({
        id: courtToEdit.id,
        data: {
          courtTypeId: values.courtTypeId,
          name: values.name,
          status: values.status,
        },
      });
      toast.success(`Cập nhật sân "${values.name}" thành công!`);
    } else {
      await createCourt({
        courtTypeId: values.courtTypeId,
        name: values.name,
      });
      toast.success(`Thêm mới sân "${values.name}" thành công!`);
    }
  };

  // Xác nhận xóa sân
  const handleConfirmDelete = async () => {
    if (!courtToDelete) return;
    try {
      await deleteCourt(courtToDelete.id);
      toast.success(`Đã xóa sân "${courtToDelete.name}" thành công!`);
      setIsDeleteOpen(false);
      setCourtToDelete(null);
    } catch (err: unknown) {
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const msg = errorObj?.detail || errorObj?.title || errorObj?.message || 'Không thể xóa sân';
      toast.error(msg, {
        description: 'Sân có thể đã có lịch sử đặt sân hoặc cấu hình khung giờ.',
      });
    }
  };

  // Phân trang
  const totalItems = courts.length;
  const paginatedCourts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return courts.slice(start, start + PAGE_SIZE);
  }, [courts, currentPage]);

  return (
    <div className="space-y-6">
      {/* KHỐI 1: Tiêu đề trang + Nút thêm mới */}
      <OwnerPageHeader
        category="Cấu hình hệ thống"
        title="Quản lý sân bãi"
        actions={
          <Button
            className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-10 px-5 rounded-xl shadow-xs cursor-pointer transition-colors"
            onClick={handleOpenCreate}
            disabled={!selectedBranchId}
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Thêm sân mới</span>
          </Button>
        }
      />

      {/* Thông báo chi nhánh đang chọn */}
      {selectedBranch && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-xs">
          <Building2 className="size-4 text-[#a3e635] shrink-0" />
          <span>
            Đang quản lý danh sách sân cho cơ sở:{' '}
            <strong className="text-foreground font-semibold">{selectedBranch.name}</strong>
          </span>
        </div>
      )}

      {/* KHỐI 2: Bộ lọc Dropdown thích ứng sáng/tối (Light & Dark mode) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Dropdown 1: Tất cả loại sân */}
        <Select
          value={selectedCourtType}
          onValueChange={(val) => {
            setSelectedCourtType(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-10 min-w-[150px] w-auto rounded-xl border border-border/70 bg-card hover:bg-accent/50 text-foreground font-semibold text-xs shadow-xs focus:ring-1 focus:ring-[#a3e635] focus:border-[#a3e635] transition-all cursor-pointer">
            <SelectValue placeholder="Tất cả loại sân" />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-max max-w-[420px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50">
            <SelectItem value="all" className="cursor-pointer font-medium text-xs">
              Tất cả loại sân
            </SelectItem>
            {courtTypes.map((ct) => (
              <SelectItem key={ct.id} value={ct.id} className="cursor-pointer font-medium text-xs">
                {ct.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dropdown 2: Mọi trạng thái (Hoạt động, Bảo trì, Không hoạt động) */}
        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-10 min-w-[140px] w-auto rounded-xl border border-border/70 bg-card hover:bg-accent/50 text-foreground font-semibold text-xs shadow-xs focus:ring-1 focus:ring-[#a3e635] focus:border-[#a3e635] transition-all cursor-pointer">
            <SelectValue placeholder="Mọi trạng thái" />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50">
            <SelectItem value="all" className="cursor-pointer font-medium text-xs">
              Mọi trạng thái
            </SelectItem>
            <SelectItem value="available" className="cursor-pointer font-medium text-xs">
              Hoạt động
            </SelectItem>
            <SelectItem value="maintenance" className="cursor-pointer font-medium text-xs">
              Bảo trì
            </SelectItem>
            <SelectItem value="inactive" className="cursor-pointer font-medium text-xs">
              Không hoạt động
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KHỐI 3: Bảng danh sách sân */}
      <CourtTable
        data={paginatedCourts}
        isLoading={isLoadingCourts}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* KHỐI 4: Phân trang */}
      {totalItems > PAGE_SIZE && (
        <OwnerPagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      )}

      {/* KHỐI 5: Modal Thêm / Chỉnh sửa sân (Figma Popup) */}
      <CourtFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        courtToEdit={courtToEdit}
        courtTypes={courtTypes}
        branchName={selectedBranch?.name}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* KHỐI 6: Modal xác nhận Xóa sân */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border/80 text-card-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Xác nhận xóa sân
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Bạn có chắc chắn muốn xóa sân{' '}
              <strong className="text-foreground font-semibold">"{courtToDelete?.name}"</strong>?
              Hành động này không thể hoàn tác nếu sân chưa có đơn đặt nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              className="rounded-xl border-border/60 bg-muted/30 text-foreground hover:bg-accent"
              onClick={() => setIsDeleteOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa sân'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
