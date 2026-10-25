import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type CourtOwnerItem } from '@/api/court-owners';
import { CalendarCheck, Loader2, Clock, CalendarDays, Sparkles } from 'lucide-react';
import {
  extendSubscriptionSchema,
  type ExtendSubscriptionValues,
} from '@/features/admin/schemas/courtOwnerSchema';
import { useServicePackagesConfigQuery } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: CourtOwnerItem | null;
  onSubmit: (ownerId: string, durationMonths: number) => Promise<void>;
  isSubmitting?: boolean;
}

function calculateProjectedEndDate(endDateStr?: string, monthsToAdd: number = 1): string {
  let baseDate = new Date();
  if (endDateStr) {
    if (endDateStr.includes('/')) {
      const parts = endDateStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime()) && parsed > baseDate) {
          baseDate = parsed;
        }
      }
    } else {
      const parsed = new Date(endDateStr);
      if (!isNaN(parsed.getTime()) && parsed > baseDate) {
        baseDate = parsed;
      }
    }
  }

  const projected = new Date(baseDate);
  projected.setMonth(projected.getMonth() + monthsToAdd);

  const day = String(projected.getDate()).padStart(2, '0');
  const month = String(projected.getMonth() + 1).padStart(2, '0');
  const year = projected.getFullYear();
  return `${day}/${month}/${year}`;
}

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  owner,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: dbPackages = [] } = useServicePackagesConfigQuery();

  // Tìm gói dịch vụ mà chủ sân đang sử dụng để lấy thời hạn chu kỳ gốc của gói đó
  const matchedPackage = useMemo(() => {
    if (!owner?.currentPackageName) return null;
    const lower = owner.currentPackageName.toLowerCase();
    return (
      dbPackages.find(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          lower.includes(p.name.toLowerCase()) ||
          p.code.toLowerCase().includes(lower)
      ) || null
    );
  }, [owner?.currentPackageName, dbPackages]);

  // Thời gian chuẩn theo gói đó (ví dụ: Pro = 3 tháng, Ultra = 6 tháng, Basic = 1 tháng)
  const baseDurationMonths = useMemo(() => {
    if (matchedPackage && matchedPackage.durationMonths > 0) {
      return matchedPackage.durationMonths;
    }
    // Fallback theo tên nếu dbPackages chưa load kịp
    const pkgName = (owner?.currentPackageName || '').toLowerCase();
    if (pkgName.includes('ultra') || pkgName.includes('vip')) return 6;
    if (pkgName.includes('pro')) return 3;
    return 1;
  }, [matchedPackage, owner?.currentPackageName]);

  const form = useForm<ExtendSubscriptionValues>({
    resolver: zodResolver(extendSubscriptionSchema),
    defaultValues: {
      durationMonths: baseDurationMonths,
    },
  });

  const selectedMonths = form.watch('durationMonths') || baseDurationMonths;

  // Khi mở dialog hoặc đổi owner, reset về 1 chu kỳ của gói đó
  useEffect(() => {
    if (open) {
      form.reset({
        durationMonths: baseDurationMonths,
      });
    }
  }, [open, baseDurationMonths, form]);

  if (!owner) return null;

  const handleFormSubmit = async (values: ExtendSubscriptionValues) => {
    await onSubmit(owner.id, values.durationMonths);
    onOpenChange(false);
  };

  // Tạo các tùy chọn gia hạn dựa trên chu kỳ thời gian của gói đó
  const durationOptions = [
    {
      cycles: 1,
      value: baseDurationMonths * 1,
      label: `1 chu kỳ (+${baseDurationMonths} tháng - Chu kỳ tiêu chuẩn của gói)`,
    },
    {
      cycles: 2,
      value: baseDurationMonths * 2,
      label: `2 chu kỳ (+${baseDurationMonths * 2} tháng)`,
    },
    {
      cycles: 3,
      value: baseDurationMonths * 3,
      label: `3 chu kỳ (+${baseDurationMonths * 3} tháng)`,
    },
    {
      cycles: 4,
      value: baseDurationMonths * 4,
      label: `4 chu kỳ (+${baseDurationMonths * 4} tháng - Ưu đãi dài hạn)`,
    },
  ];

  const projectedEndDate = calculateProjectedEndDate(owner.packageEndDate, selectedMonths);
  const selectedCycles = Math.round(selectedMonths / baseDurationMonths) || 1;
  const estimatedPrice = matchedPackage ? matchedPackage.price * selectedCycles : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-[#1b2b22] bg-[#0c1410] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#1b2b22]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CalendarCheck className="size-4 text-emerald-400" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Gia hạn gói dịch vụ SaaS
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Kéo dài thời hạn hoạt động gói cước dựa trên chu kỳ thời gian của gói hiện tại.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            {/* Thông tin chủ sân & gói hiện tại */}
            <div className="rounded-xl bg-[#111915] border border-[#1b2b22] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Chủ sân:</span>
                <span className="font-bold text-white">{owner.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Gói đang dùng:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">
                    {owner.currentPackageName || matchedPackage?.name || 'Gói Cơ bản'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                    {baseDurationMonths} tháng / kỳ
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Hạn hiện tại:</span>
                <span className="text-zinc-300 font-medium">{owner.packageEndDate || 'Chưa thiết lập'}</span>
              </div>
            </div>

            {/* Chọn số chu kỳ gia hạn dựa trên gói */}
            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Gia hạn theo chu kỳ gói ({baseDurationMonths} tháng/kỳ):
                    </FormLabel>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      +{field.value} tháng
                    </span>
                  </div>
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-xl bg-[#111915] border-[#1b2b22] text-xs text-white">
                        <SelectValue placeholder="Chọn chu kỳ gia hạn" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-[#1b2b22] bg-[#0c1410] text-zinc-200">
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)} className="text-xs cursor-pointer">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            {/* Xem trước kết quả gia hạn */}
            <div className="rounded-xl bg-[#12241a] border border-emerald-500/30 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <Sparkles className="size-3.5" />
                <span>Xem trước thời hạn sau khi gia hạn:</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-zinc-400 flex items-center gap-1">
                  <CalendarDays className="size-3 text-emerald-400" />
                  Hạn mới dự kiến:
                </span>
                <span className="font-bold text-white text-xs bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                  {projectedEndDate}
                </span>
              </div>
              {estimatedPrice !== null && (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                  <span>Chi phí gia hạn ({selectedCycles} chu kỳ):</span>
                  <span className="font-semibold text-emerald-300">
                    {estimatedPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
            </div>

            {/* Lưu ý */}
            <div className="flex items-start gap-2 rounded-xl bg-zinc-900/60 border border-zinc-800 p-2.5 text-[11px] text-zinc-400">
              <Clock className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Thời gian gia hạn được tính nối tiếp từ ngày hết hạn hiện tại (hoặc từ hôm nay nếu gói đã quá hạn).
              </span>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-[#1b2b22]">
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
                disabled={isSubmitting}
                className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin text-slate-950" />}
                <span>{isSubmitting ? 'Đang gia hạn...' : `Xác nhận gia hạn (+${selectedMonths} tháng)`}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
