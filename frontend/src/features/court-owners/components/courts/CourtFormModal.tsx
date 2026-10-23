import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { CourtStatus, type CourtDto } from '@/api/courts';
import type { CourtTypeDto } from '@/api/court-types';

interface CourtFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtToEdit: CourtDto | null;
  courtTypes: CourtTypeDto[];
  branchName?: string;
  onSubmit: (data: { courtTypeId: string; name: string; status?: CourtStatus }) => Promise<void>;
  isLoading?: boolean;
}

export function CourtFormModal({
  open,
  onOpenChange,
  courtToEdit,
  courtTypes,
  branchName,
  onSubmit,
  isLoading = false,
}: CourtFormModalProps) {
  const [name, setName] = useState('');
  const [courtTypeId, setCourtTypeId] = useState('');
  const [status, setStatus] = useState<CourtStatus>(CourtStatus.Available);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (courtToEdit) {
        setName(courtToEdit.name);
        setCourtTypeId(courtToEdit.courtTypeId);
        setStatus(courtToEdit.status ?? CourtStatus.Available);
      } else {
        setName('');
        setCourtTypeId(courtTypes[0]?.id || '');
        setStatus(CourtStatus.Available);
      }
      setError(null);
    }
  }, [open, courtToEdit, courtTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Vui lòng nhập tên / số hiệu sân');
      return;
    }

    if (!courtTypeId) {
      setError('Vui lòng chọn loại sân');
      return;
    }

  try {
      await onSubmit({
        courtTypeId,
        name: name.trim(),
        status,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { detail?: string; title?: string; message?: string };
      const msg = errorObj?.detail || errorObj?.title || errorObj?.message || 'Có lỗi xảy ra khi lưu thông tin sân';
      setError(msg);
    }
  };

  const isEditing = Boolean(courtToEdit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] rounded-2xl bg-card border border-border/80 text-foreground p-6 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
            {isEditing ? 'Cập nhật thông tin sân' : 'Thêm sân mới'}
          </DialogTitle>
        </DialogHeader>

        {/* Thông tin chi nhánh cơ sở đang áp dụng */}
        {branchName && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/40">
            <Building2 className="size-4 text-[#a3e635] shrink-0" />
            <span>
              Áp dụng cho chi nhánh: <strong className="text-foreground">{branchName}</strong>
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Tên / Số hiệu sân */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
              Tên / Số hiệu sân <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ví dụ: Sân 1, Sân VIP 2..."
              className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] transition-all"
            />
          </div>

          {/* 2. Loại sân */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
              Loại sân <span className="text-rose-500">*</span>
            </label>
            <Select
              value={courtTypeId}
              onValueChange={(val) => {
                setCourtTypeId(val);
                if (error) setError(null);
              }}
            >
              <SelectTrigger className="w-full h-11 rounded-xl bg-background px-3.5 text-sm text-foreground border border-border/70 focus:ring-1 focus:ring-[#a3e635] focus:border-[#a3e635] transition-all cursor-pointer">
                <SelectValue placeholder="Chọn loại sân" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50">
                {courtTypes.length === 0 ? (
                  <SelectItem value="none" disabled className="text-muted-foreground text-xs">
                    Chưa có loại sân nào
                  </SelectItem>
                ) : (
                  courtTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id} className="cursor-pointer text-xs">
                      {ct.name} ({ct.minutesConfig}p)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Trạng thái sân (Có đủ 3 trạng thái: Hoạt động, Bảo trì, Không hoạt động) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
              Trạng thái sân <span className="text-rose-500">*</span>
            </label>
            <Select
              value={status.toString()}
              onValueChange={(val) => {
                setStatus(Number(val) as CourtStatus);
                if (error) setError(null);
              }}
            >
              <SelectTrigger className="w-full h-11 rounded-xl bg-background px-3.5 text-sm text-foreground border border-border/70 focus:ring-1 focus:ring-[#a3e635] focus:border-[#a3e635] transition-all cursor-pointer">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50">
                <SelectItem value={CourtStatus.Available.toString()} className="cursor-pointer text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Hoạt động
                  </span>
                </SelectItem>
                <SelectItem value={CourtStatus.Maintenance.toString()} className="cursor-pointer text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Bảo trì
                  </span>
                </SelectItem>
                <SelectItem value={CourtStatus.Inactive.toString()} className="cursor-pointer text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Không hoạt động
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10.5 px-5 rounded-xl border border-border/70 bg-muted/40 hover:bg-accent text-foreground font-semibold text-sm transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || courtTypes.length === 0}
              className="h-10.5 px-6 rounded-xl bg-[#a3e635] hover:bg-[#8ece28] text-black font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
