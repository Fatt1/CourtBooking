import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { OwnerPageHeader, OwnerModal } from '@/features/court-owners/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ServiceCategory {
  id: string;
  orderNumber: number;
  name: string;
  productCount: number;
  createdAt: string;
  description?: string;
}

// Dữ liệu mẫu khớp 100% với ảnh Figma
const initialCategories: ServiceCategory[] = [
  {
    id: '1',
    orderNumber: 1,
    name: 'Nước giải khát',
    productCount: 12,
    createdAt: '16/09/2026',
    description: 'Các loại nước ngọt, nước khoáng, nước tăng lực phục vụ người chơi',
  },
  {
    id: '2',
    orderNumber: 2,
    name: 'Thuê dụng cụ',
    productCount: 4,
    createdAt: '16/09/2026',
    description: 'Vợt cầu lông, vợt pickleball, bóng và giày thi đấu',
  },
];

export function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);

  // States quản lý Modal Thêm / Sửa / Xóa
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  // Form states khớp 100% theo ảnh Figma
  const [formData, setFormData] = useState({
    name: '',
    orderNumber: 1,
    description: '',
  });

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      orderNumber: 1,
      description: '',
    });
    setIsCreateOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (item: ServiceCategory) => {
    setSelectedCategory(item);
    setFormData({
      name: item.name,
      orderNumber: item.orderNumber,
      description: item.description || '',
    });
    setIsEditOpen(true);
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (item: ServiceCategory) => {
    setSelectedCategory(item);
    setIsDeleteOpen(true);
  };

  // Xử lý tạo mới
  const handleSaveCreate = () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    const newCat: ServiceCategory = {
      id: String(Date.now()),
      orderNumber: Number(formData.orderNumber) || categories.length + 1,
      name: formData.name.trim(),
      productCount: 0,
      createdAt: '16/09/2026',
      description: formData.description,
    };

    setCategories((prev) => [...prev, newCat]);
    setIsCreateOpen(false);
  };

  // Xử lý lưu chỉnh sửa
  const handleSaveEdit = () => {
    if (!selectedCategory) return;
    if (!formData.name.trim()) {
      alert('Tên danh mục không được để trống');
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedCategory.id
          ? {
              ...c,
              name: formData.name.trim(),
              orderNumber: Number(formData.orderNumber) || c.orderNumber,
              description: formData.description,
            }
          : c
      )
    );
    setIsEditOpen(false);
  };

  // Xử lý xác nhận xóa
  const handleConfirmDelete = () => {
    if (!selectedCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id));
    setIsDeleteOpen(false);
  };

  // Cấu hình Cột bảng (Columns) chuẩn theo ảnh Figma
  const columns: ColumnDef<ServiceCategory>[] = [
    {
      header: 'THỨ TỰ',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground w-[120px]',
      cell: (item) => (
        <span className="text-sm font-medium text-muted-foreground pl-2">
          {item.orderNumber}
        </span>
      ),
    },
    {
      header: 'TÊN DANH MỤC',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[220px]',
      cell: (item) => (
        <span className="text-sm font-bold tracking-tight text-foreground">
          {item.name}
        </span>
      ),
    },
    {
      header: 'SỐ LƯỢNG SP',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[160px]',
      cell: (item) => (
        <span className="text-sm text-muted-foreground font-medium">
          {item.productCount} sản phẩm
        </span>
      ),
    },
    {
      header: 'NGÀY TẠO',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground min-w-[160px]',
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.createdAt}
        </span>
      ),
    },
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold tracking-wider text-muted-foreground text-right w-[120px] pr-4',
      className: 'text-right pr-4',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          {/* Nút sửa (Pencil) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(item);
            }}
            title="Chỉnh sửa danh mục"
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </button>

          {/* Nút xóa (Trash) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDelete(item);
            }}
            title="Xóa danh mục"
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header chuẩn: Category + Tiêu đề H1 + Nút "+ Tạo mới danh mục" */}
      <OwnerPageHeader
        category="Quản lý dịch vụ"
        title="Danh mục dịch vụ"
        actions={
          <Button
            className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold text-xs md:text-sm h-9.5 rounded-xl shadow-xs transition-colors"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Tạo mới danh mục</span>
          </Button>
        }
      />

      {/* 2. Bảng Dữ Liệu Dùng Chung (CommonTable) */}
      <CommonTable
        columns={columns}
        data={categories}
        emptyTitle="Chưa có danh mục dịch vụ nào"
        emptyDescription="Bấm nút '+ Tạo mới danh mục' phía trên để thêm danh mục đầu tiên."
      />

      {/* MODAL 1: Thông tin danh mục (Tạo mới) chuẩn 100% Figma */}
      <OwnerModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Thông tin danh mục"
        onCancel={() => setIsCreateOpen(false)}
        onSubmit={handleSaveCreate}
        submitText="Lưu danh mục"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          {/* Tên danh mục * */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên danh mục..."
              autoFocus
              className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white placeholder:text-muted-foreground/60 border border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635] transition-all"
            />
          </div>

          {/* Thứ tự hiển thị (POS) * */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-1">
              Thứ tự hiển thị (POS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData({ ...formData, orderNumber: Number(e.target.value) || 1 })
              }
              className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all"
            />
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Quyết định thứ tự xuất hiện của Tab danh mục trên màn hình Bán lẻ POS.
            </p>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">
              Mô tả
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-[#080E1C] p-3 text-sm text-white border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all resize-y min-h-[100px]"
            />
          </div>
        </div>
      </OwnerModal>

      {/* MODAL 2: Thông tin danh mục (Chỉnh sửa) chuẩn 100% Figma */}
      <OwnerModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Thông tin danh mục"
        onCancel={() => setIsEditOpen(false)}
        onSubmit={handleSaveEdit}
        submitText="Lưu danh mục"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          {/* Tên danh mục * */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên danh mục..."
              className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white placeholder:text-muted-foreground/60 border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all"
            />
          </div>

          {/* Thứ tự hiển thị (POS) * */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-1">
              Thứ tự hiển thị (POS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData({ ...formData, orderNumber: Number(e.target.value) || 1 })
              }
              className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all"
            />
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Quyết định thứ tự xuất hiện của Tab danh mục trên màn hình Bán lẻ POS.
            </p>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">
              Mô tả
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-[#080E1C] p-3 text-sm text-white border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all resize-y min-h-[100px]"
            />
          </div>
        </div>
      </OwnerModal>

      {/* MODAL 3: Xác nhận xóa danh mục */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-[#0B1324] border-border/70 rounded-2xl p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 text-lg font-bold">
              <Trash2 className="size-5" /> Xác nhận xóa danh mục
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 text-sm">
              Bạn có chắc chắn muốn xóa danh mục{' '}
              <span className="font-bold text-white">"{selectedCategory?.name}"</span>? Các
              sản phẩm thuộc danh mục này sẽ cần được phân loại lại.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="h-10 rounded-xl bg-[#131d31] border-border/60 text-white hover:bg-[#1a2742]"
            >
              Không, giữ lại
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-10 rounded-xl"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
