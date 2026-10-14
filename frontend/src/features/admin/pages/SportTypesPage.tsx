import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAdminSportTypesQuery,
  useCreateSportTypeMutation,
  useUpdateSportTypeMutation,
  useDeleteSportTypeMutation,
  type AdminSportTypeDto,
} from '@/api/sport-types';
import type { SportTypeFormValues } from '../schemas/sportTypeSchema';
import { SportTypeCard } from '../components/sport-types/SportTypeCard';
import { SportTypeFormModal } from '../components/sport-types/SportTypeFormModal';
import { DeleteSportTypeDialog } from '../components/sport-types/DeleteSportTypeDialog';

export function SportTypesPage() {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSportType, setEditingSportType] = useState<AdminSportTypeDto | null>(null);
  const [deletingSportType, setDeletingSportType] = useState<AdminSportTypeDto | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  // Queries & Mutations
  const { data: sportTypes = [], isLoading } = useAdminSportTypesQuery();
  const createMutation = useCreateSportTypeMutation();
  const updateMutation = useUpdateSportTypeMutation();
  const deleteMutation = useDeleteSportTypeMutation();

  // Lọc theo từ khóa tìm kiếm (nếu có nhập)
  const filteredSportTypes = useMemo(() => {
    if (!debouncedSearch.trim()) return sportTypes;
    return sportTypes.filter((item) =>
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
    );
  }, [sportTypes, debouncedSearch]);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingSportType(null);
    setIsFormOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (item: AdminSportTypeDto) => {
    setEditingSportType(item);
    setIsFormOpen(true);
  };

  // Mở dialog xác nhận xóa
  const handleOpenDelete = (item: AdminSportTypeDto) => {
    setDeletingSportType(item);
  };

  // Submit tạo mới / cập nhật
  const handleSubmitForm = async (values: SportTypeFormValues) => {
    try {
      if (editingSportType) {
        await updateMutation.mutateAsync({
          id: editingSportType.id,
          data: {
            name: values.name,
            imageId: values.imageId,
          },
        });
        toast.success(`Cập nhật môn "${values.name}" thành công!`);
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          imageId: values.imageId,
        });
        toast.success(`Đã thêm môn thể thao "${values.name}" thành công!`);
      }
      setIsFormOpen(false);
      setEditingSportType(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { detail?: string })?.detail ||
        (err as { message?: string })?.message ||
        'Không thể lưu môn thể thao';
      toast.error('Thao tác không thành công', { description: errorMsg });
      throw err;
    }
  };

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deletingSportType) return;
    try {
      await deleteMutation.mutateAsync(deletingSportType.id);
      toast.success(`Đã xóa môn "${deletingSportType.name}" khỏi hệ thống!`);
      setDeletingSportType(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { detail?: string })?.detail ||
        (err as { message?: string })?.message ||
        'Không thể xóa môn thể thao';
      toast.error('Xóa môn thể thao thất bại', { description: errorMsg });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Page & Breadcrumb theo đúng chuẩn thiết kế Figma */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-extrabold tracking-widest text-emerald-400 uppercase mb-1">
            WORKSPACE / SPORTS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Danh mục môn thể thao
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý các môn thể thao được cung cấp trên nền tảng.
          </p>
        </div>

        {/* Nút Thêm môn thể thao mới chuẩn thiết kế Figma */}
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-[#141e18] hover:bg-[#1a2921] text-zinc-100 hover:text-white border border-[#23352a] font-bold h-10 px-4 rounded-xl transition-all cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="size-4 text-emerald-400" />
          <span>Thêm môn thể thao mới</span>
        </Button>
      </div>

      {/* 2. Chip đếm số lượng môn thể thao (ĐÃ BỎ TRẠNG THÁI HOẠT ĐỘNG THEO YÊU CẦU) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#111c16] text-zinc-300 border border-[#1b2b22]">
            {sportTypes.length} môn thể thao
          </span>
        </div>

        {/* Thanh tìm kiếm nhanh */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm môn thể thao..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 rounded-xl bg-[#111915] border border-[#1b2b22] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* 3. Lưới hiển thị danh thiếp môn thể thao (Card Grid Layout) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#19261f] bg-[#101813] overflow-hidden p-0"
            >
              <Skeleton className="aspect-[16/10] w-full bg-zinc-800/60 rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-28 bg-zinc-800" />
                <Skeleton className="h-4 w-20 bg-zinc-800/60" />
                <div className="pt-3 border-t border-[#16241c] flex justify-between">
                  <Skeleton className="h-3 w-16 bg-zinc-800/40" />
                  <Skeleton className="h-3 w-12 bg-zinc-800/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSportTypes.length === 0 ? (
        <div className="rounded-2xl border border-[#16241c] bg-[#0c1410] p-10">
          <EmptyState
            title="Không tìm thấy môn thể thao nào"
            description="Chưa có môn thể thao nào khớp với từ khóa tìm kiếm hoặc danh mục đang trống."
            actionLabel="Thêm môn thể thao mới"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSportTypes.map((item) => (
            <SportTypeCard
              key={item.id}
              sport={item}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* 4. Modal Thêm / Chỉnh sửa */}
      <SportTypeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingSportType}
        onSubmit={handleSubmitForm}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* 5. Dialog Xác nhận xóa */}
      <DeleteSportTypeDialog
        open={Boolean(deletingSportType)}
        onOpenChange={(open) => {
          if (!open) setDeletingSportType(null);
        }}
        sportType={deletingSportType}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
