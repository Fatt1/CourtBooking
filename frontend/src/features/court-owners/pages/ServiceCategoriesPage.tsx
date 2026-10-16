import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CommonTable, type ColumnDef } from '@/components/common/CommonTable';
import { OwnerPageHeader, OwnerStatusBadge } from '../components/shared';
import { ServiceCategoryFormModal } from '../components/service-categories/ServiceCategoryFormModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useServiceCategoriesQuery, useCreateServiceCategoryMutation,
  useUpdateServiceCategoryMutation, useDeleteServiceCategoryMutation,
  type ServiceCategoryDto,
} from '@/api/service-categories';
import { formatDate } from '@/lib/format';
import { getApiErrorMessage } from '@/types/api';
import type { ServiceCategoryFormValues } from '../schemas/serviceCategorySchema';

export function ServiceCategoriesPage() {
  const { data: categories = [], isLoading, isError, error, refetch, isFetching } = useServiceCategoriesQuery();
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateServiceCategoryMutation();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateServiceCategoryMutation();
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteServiceCategoryMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ServiceCategoryDto | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategoryDto | null>(null);

  const handleSave = async (values: ServiceCategoryFormValues) => {
    const payload = { ...values, description: values.description || null };
    try {
      if (categoryToEdit) await updateCategory({ id: categoryToEdit.id, ...payload });
      else await createCategory(payload);
      toast.success(categoryToEdit ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      setIsFormOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu danh mục'));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete || isDeleting) return;
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success('Đã xóa danh mục');
      setCategoryToDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa danh mục'));
    }
  };

  const columns: ColumnDef<ServiceCategoryDto>[] = [
    { header: 'TÊN DANH MỤC', cell: (item) => <span className="font-bold">{item.name}</span> },
    { header: 'TRẠNG THÁI', cell: (item) => <OwnerStatusBadge
      status={item.isActive ? 'Hoạt động' : 'Tạm ngưng'} variant={item.isActive ? 'success' : 'neutral'} /> },
    { header: 'SỐ LƯỢNG DỊCH VỤ', cell: (item) => <span>{item.serviceCount} dịch vụ</span> },
    { header: 'NGÀY TẠO', cell: (item) => formatDate(item.createdAt) },
    { header: 'CẬP NHẬT', cell: (item) => formatDate(item.updatedAt) },
    {
      header: 'THAO TÁC', headerClassName: 'text-right', className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="icon" className="size-8 rounded-lg" aria-label={`Sửa ${item.name}`}
            onClick={() => { setCategoryToEdit(item); setIsFormOpen(true); }}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="size-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
            aria-label={`Xóa ${item.name}`} onClick={() => setCategoryToDelete(item)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <OwnerPageHeader category="Quản lý dịch vụ" title="Danh mục dịch vụ" actions={
        <Button className="h-9.5 gap-1.5 rounded-xl bg-[#a3e635] font-bold text-black hover:bg-[#8ece28]"
          onClick={() => { setCategoryToEdit(null); setIsFormOpen(true); }}>
          <Plus className="size-4" /> Tạo mới danh mục
        </Button>
      } />
      {isError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p>{getApiErrorMessage(error, 'Không thể tải danh mục dịch vụ')}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Thử lại</Button>
        </div>
      ) : (
        <CommonTable columns={columns} data={categories} isLoading={isLoading}
          emptyTitle="Chưa có danh mục dịch vụ nào"
          emptyDescription="Bấm 'Tạo mới danh mục' để thêm danh mục đầu tiên." />
      )}
      <ServiceCategoryFormModal open={isFormOpen} onOpenChange={setIsFormOpen} category={categoryToEdit}
        onSubmit={handleSave} isSubmitting={isCreating || isUpdating} />
      <Dialog open={Boolean(categoryToDelete)} onOpenChange={(open) => { if (!open && !isDeleting) setCategoryToDelete(null); }}>
        <DialogContent className="rounded-2xl border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa "{categoryToDelete?.name}"? Chỉ có thể xóa danh mục chưa được sử dụng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isDeleting} onClick={() => setCategoryToDelete(null)}>Hủy</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
