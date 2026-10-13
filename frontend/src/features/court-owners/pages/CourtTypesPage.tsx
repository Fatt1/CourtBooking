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
  OwnerPageHeader,
  OwnerFilterBar,
  OwnerPagination,
} from '@/features/court-owners/components/shared';
import {
  CourtTypeTable,
  CourtTypeFormModal,
} from '@/features/court-owners/components/court-types';
import {
  useCourtTypesQuery,
  useCreateCourtTypeMutation,
  useUpdateCourtTypeMutation,
  useDeleteCourtTypeMutation,
  type CourtTypeDto,
} from '@/api/court-types';
import { useBranchStore } from '@/stores/useBranchStore';

const PAGE_SIZE = 10;

export function CourtTypesPage() {
  // 1. Lấy chi nhánh hiện tại đang được chọn từ Header Switcher
  const { selectedBranchId, selectedBranch } = useBranchStore();

  // 2. Tầng API TanStack Query
  const { data: courtTypes = [], isLoading } = useCourtTypesQuery(selectedBranchId);
  const { mutateAsync: createCourtType, isPending: isCreating } = useCreateCourtTypeMutation();
  const { mutateAsync: updateCourtType, isPending: isUpdating } = useUpdateCourtTypeMutation();
  const { mutateAsync: deleteCourtType, isPending: isDeleting } = useDeleteCourtTypeMutation();

  // 3. States giao diện
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // States modal thêm / sửa
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courtTypeToEdit, setCourtTypeToEdit] = useState<CourtTypeDto | null>(null);

  // States modal xác nhận xóa
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courtTypeToDelete, setCourtTypeToDelete] = useState<CourtTypeDto | null>(null);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    if (!selectedBranchId) {
      toast.error('Vui lòng chọn hoặc tạo chi nhánh trước khi thêm loại sân!');
      return;
    }
    setCourtTypeToEdit(null);
    setIsFormOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (item: CourtTypeDto) => {
    setCourtTypeToEdit(item);
    setIsFormOpen(true);
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (item: CourtTypeDto) => {
    setCourtTypeToDelete(item);
    setIsDeleteOpen(true);
  };

  // Xử lý lưu form (Tạo mới hoặc Sửa)
  const handleFormSubmit = async (values: { name: string; minutesConfig: number }) => {
    if (courtTypeToEdit) {
      await updateCourtType({
        id: courtTypeToEdit.id,
        name: values.name,
        minutesConfig: values.minutesConfig,
      });
      toast.success(`Cập nhật loại sân "${values.name}" thành công!`);
    } else {
      if (!selectedBranchId) return;
      await createCourtType({
        branchId: selectedBranchId,
        name: values.name,
        minutesConfig: values.minutesConfig,
      });
      toast.success(`Thêm mới loại sân "${values.name}" thành công!`);
    }
  };

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!courtTypeToDelete) return;
    try {
      await deleteCourtType(courtTypeToDelete.id);
      toast.success(`Đã xóa loại sân "${courtTypeToDelete.name}" thành công!`);
      setIsDeleteOpen(false);
      setCourtTypeToDelete(null);
    } catch (err: unknown) {
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const msg = errorObj?.detail || errorObj?.title || errorObj?.message || 'Không thể xóa loại sân';
      toast.error(msg, {
        description: 'Loại sân có thể đang có sân con trực thuộc hoặc bảng giá hoạt động.',
      });
    }
  };

  // 4. Lọc tìm kiếm theo từ khóa
  const filteredCourtTypes = useMemo(() => {
    if (!search.trim()) return courtTypes;
    const query = search.trim().toLowerCase();
    return courtTypes.filter((ct) => ct.name.toLowerCase().includes(query));
  }, [courtTypes, search]);

  // Phân trang trên client
  const totalItems = filteredCourtTypes.length;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCourtTypes.slice(start, start + PAGE_SIZE);
  }, [filteredCourtTypes, currentPage]);

  return (
    <div className="space-y-6">
      {/* KHỐI 1: Tiêu đề trang + Nút thêm mới */}
      <OwnerPageHeader
        category="Cơ sở sân bãi"
        title="Quản lý loại sân"
        actions={
          <Button
            className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs cursor-pointer"
            onClick={handleOpenCreate}
            disabled={!selectedBranchId}
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Thêm loại sân</span>
          </Button>
        }
      />

      {/* Thông báo chi nhánh hiện tại */}
      {selectedBranch && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-xs">
          <Building2 className="size-4 text-[#a3e635] shrink-0" />
          <span>
            Đang quản lý cấu hình loại sân cho cơ sở:{' '}
            <strong className="text-foreground font-semibold">{selectedBranch.name}</strong>
            {selectedBranch.street && ` (${selectedBranch.street}, ${selectedBranch.district}, ${selectedBranch.province})`}
          </span>
        </div>
      )}

      {/* KHỐI 2: Thanh tìm kiếm */}
      <OwnerFilterBar
        searchPlaceholder="Tìm theo tên loại sân..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
      />

      {/* KHỐI 3: Bảng dữ liệu tự động có Skeleton và EmptyState */}
      <CourtTypeTable
        data={paginatedData}
        isLoading={isLoading}
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

      {/* KHỐI 5: Modal Thêm / Chỉnh sửa loại sân */}
      <CourtTypeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        courtTypeToEdit={courtTypeToEdit}
        branchName={selectedBranch?.name}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* KHỐI 6: Modal xác nhận Xóa loại sân */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Xác nhận xóa loại sân
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1.5">
              Bạn có chắc chắn muốn xóa loại sân{' '}
              <strong className="text-foreground">"{courtTypeToDelete?.name}"</strong>?
              Hành động này không thể hoàn tác nếu loại sân chưa có sân con nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border-border/60"
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5 rounded-xl font-semibold"
            >
              <Trash2 className="size-4" />
              <span>{isDeleting ? 'Đang xóa...' : 'Xóa loại sân'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
