import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackagePlus, Loader2, Sparkles } from 'lucide-react';
import type { CreatePackagePayload } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreatePackagePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateServicePackageDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('999000');
  const [durationMonths, setDurationMonths] = useState('3');
  const [description, setDescription] = useState('');
  const [maxCourts, setMaxCourts] = useState('8');
  const [maxBranches, setMaxBranches] = useState('2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      price: Number(price) || 0,
      durationMonths: Number(durationMonths) || 1,
      description: description.trim(),
      maxCourts: Number(maxCourts) || 1,
      maxBranches: Number(maxBranches) || 1,
    });

    onOpenChange(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-[#1b2d22] bg-[#0c1410] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-[#1b2d22]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <PackagePlus className="size-4 text-emerald-400" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Tạo gói dịch vụ SaaS mới
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Cấu hình gói cước và quyền lợi áp dụng cho các đối tác chủ sân trên toàn hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          {/* Tên gói */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">
              Tên gói dịch vụ <span className="text-rose-400">*</span>
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Gói Pro Max / Giải đấu..."
              className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Giá gói */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Giá cước (VNĐ) <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="499000"
                className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
              />
            </div>

            {/* Chu kỳ */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Chu kỳ thanh toán</label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#1b2d22] bg-[#0c1410] text-zinc-200">
                  <SelectItem value="1" className="text-xs cursor-pointer">1 tháng</SelectItem>
                  <SelectItem value="3" className="text-xs cursor-pointer">3 tháng (1 quý)</SelectItem>
                  <SelectItem value="6" className="text-xs cursor-pointer">6 tháng (Nửa năm)</SelectItem>
                  <SelectItem value="12" className="text-xs cursor-pointer">12 tháng (1 năm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Giới hạn sân */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Số sân tối đa</label>
              <Input
                type="number"
                min="1"
                value={maxCourts}
                onChange={(e) => setMaxCourts(e.target.value)}
                placeholder="8"
                className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
              />
            </div>

            {/* Giới hạn chi nhánh */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Số chi nhánh tối đa</label>
              <Input
                type="number"
                min="1"
                value={maxBranches}
                onChange={(e) => setMaxBranches(e.target.value)}
                placeholder="2"
                className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Mô tả & quyền lợi</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Quyền lợi của gói dịch vụ, đối tượng sử dụng..."
              className="w-full p-2.5 rounded-xl bg-[#111915] border border-[#1b2d22] text-xs text-white resize-none outline-none focus:border-emerald-500/50"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-[#1b2d22]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border-[#1b2d22] bg-[#111915] text-zinc-300 hover:text-white hover:bg-[#16241c] text-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin text-slate-950" />}
              <span>{isSubmitting ? 'Đang tạo...' : 'Lưu gói dịch vụ'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
