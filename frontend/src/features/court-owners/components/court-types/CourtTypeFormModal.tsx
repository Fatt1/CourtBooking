import { useState, useEffect } from 'react';
import { Layers, Clock, Building2 } from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared';
import type { CourtTypeDto } from '@/api/court-types';

interface CourtTypeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtTypeToEdit: CourtTypeDto | null;
  branchName?: string;
  onSubmit: (data: { name: string; minutesConfig: number }) => Promise<void>;
  isLoading?: boolean;
}

const COMMON_SLOT_MINUTES = [30, 60, 90, 120, 150, 180];

export function CourtTypeFormModal({
  open,
  onOpenChange,
  courtTypeToEdit,
  branchName,
  onSubmit,
  isLoading = false,
}: CourtTypeFormModalProps) {
  const [name, setName] = useState('');
  const [minutesConfig, setMinutesConfig] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (courtTypeToEdit) {
        setName(courtTypeToEdit.name);
        setMinutesConfig(courtTypeToEdit.minutesConfig || 60);
      } else {
        setName('');
        setMinutesConfig(60);
      }
      setError(null);
    }
  }, [open, courtTypeToEdit]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên loại sân');
      return;
    }

    if (!minutesConfig || minutesConfig <= 0) {
      setError('Thời lượng slot đặt sân phải lớn hơn 0 phút');
      return;
    }

    if (minutesConfig % 30 !== 0) {
      setError('Thời lượng đặt sân phải là bội số của 30 phút (30, 60, 90, 120, 150...)');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        minutesConfig: Number(minutesConfig),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const msg = errorObj?.detail || errorObj?.title || errorObj?.message || 'Có lỗi xảy ra khi lưu loại sân';
      setError(msg);
    }
  };

  const isEditing = Boolean(courtTypeToEdit);

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Cập nhật loại sân' : 'Thêm loại sân mới'}
      onSubmit={handleSubmit}
      submitText={isLoading ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo loại sân'}
      cancelText="Hủy"
    >
      <div className="space-y-5">
        {/* Thông tin chi nhánh áp dụng */}
        {branchName && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/40">
            <Building2 className="size-4 text-[#a3e635] shrink-0" />
            <span>
              Áp dụng cho cơ sở: <strong className="text-foreground">{branchName}</strong>
            </span>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Tên loại sân */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-[#a3e635]" />
            <span>Tên loại sân</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ví dụ: Sân Cầu Lông Tiêu Chuẩn, Sân Pickleball Đôi..."
            className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/60 border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all"
          />
          <p className="text-[11px] text-muted-foreground">
            Tên loại sân giúp phân loại các sân có cùng quy chuẩn, kích thước và bảng giá.
          </p>
        </div>

        {/* Thời lượng cấu hình slot đặt */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-[#a3e635]" />
            <span>Thời lượng mỗi slot đặt sân</span>
            <span className="text-rose-500">*</span>
          </label>

          {/* Các nút chọn nhanh */}
          <div className="flex flex-wrap gap-2">
            {COMMON_SLOT_MINUTES.map((mins) => {
              const isSelected = minutesConfig === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setMinutesConfig(mins);
                    if (error) setError(null);
                  }}
                  className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#a3e635] text-black border-[#a3e635] shadow-xs'
                      : 'bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {mins} phút
                </button>
              );
            })}
          </div>

          {/* Ô nhập tùy chỉnh số phút */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min="30"
              max="480"
              step="30"
              value={minutesConfig}
              onChange={(e) => {
                setMinutesConfig(Number(e.target.value));
                if (error) setError(null);
              }}
              className="w-28 h-9 rounded-lg bg-background px-3 text-xs text-foreground border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
            <span className="text-xs text-muted-foreground">phút / lượt (bội số của 30)</span>
          </div>
        </div>
      </div>
    </OwnerModal>
  );
}
