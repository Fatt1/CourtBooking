import { useState, useEffect } from 'react';
import { Tag, DollarSign } from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared';

export interface PriceTableFormValues {
  name: string;
  defaultPrice: number;
  isActive: boolean;
}

export interface PriceTableToEdit {
  id: string;
  name: string;
  defaultPrice?: number;
  isActive?: boolean;
}

interface AddPriceTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableToEdit?: PriceTableToEdit | null;
  onSubmit: (values: PriceTableFormValues, tableId?: string) => void;
}

const PRESET_NAMES = [
  'Bảng giá tiêu chuẩn',
  'Đặc quyền HSSV',
  'Bảng giá cuối tuần',
  'Bảng giá ngày lễ',
  'Bảng giá giờ vàng',
];

export function AddPriceTableModal({
  open,
  onOpenChange,
  tableToEdit,
  onSubmit,
}: AddPriceTableModalProps) {
  const isEditing = Boolean(tableToEdit);

  const [name, setName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number>(80000);
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      if (tableToEdit) {
        setName(tableToEdit.name || '');
        setDefaultPrice(tableToEdit.defaultPrice ?? 80000);
        setIsActive(tableToEdit.isActive ?? true);
      } else {
        setName('');
        setDefaultPrice(80000);
        setIsActive(true);
      }
    }
  }, [open, tableToEdit]);

  const handleFormSubmit = () => {
    if (!name.trim()) return;

    onSubmit(
      {
        name: name.trim(),
        defaultPrice,
        isActive,
      },
      tableToEdit?.id
    );
    onOpenChange(false);
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Chỉnh sửa loại bảng giá' : 'Thêm loại bảng giá mới'}
      submitText={isEditing ? 'Lưu thay đổi' : 'Tạo bảng giá'}
      cancelText="Hủy"
      onSubmit={handleFormSubmit}
      maxWidth="max-w-md"
    >
      <div className="space-y-4.5 pt-1 text-sm">
        {/* 1. Tên loại bảng giá */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            <span>Tên loại bảng giá</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Bảng giá tiêu chuẩn, Đặc quyền HSSV..."
            className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
          />

          {/* Gợi ý chọn nhanh */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_NAMES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setName(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                  name === preset
                    ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]'
                    : 'bg-muted/50 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Giá mặc định cơ sở (VNĐ/giờ) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <DollarSign className="size-3.5 text-muted-foreground" />
            <span>Giá cơ sở mặc định (VNĐ/giờ)</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            required
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(Math.max(0, Number(e.target.value)))}
            placeholder="80000"
            className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
          />
          <p className="text-[11px] text-muted-foreground">
            Mức giá này sẽ làm giá tham chiếu khi chưa áp dụng quy tắc khung giờ riêng.
          </p>
        </div>

        {/* 3. Trạng thái kích hoạt */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border/80 accent-[#a3e635] bg-[#080E1C] cursor-pointer"
            />
            <span className="text-xs font-semibold text-foreground">
              Kích hoạt áp dụng bảng giá này ngay
            </span>
          </label>
        </div>
      </div>
    </OwnerModal>
  );
}
