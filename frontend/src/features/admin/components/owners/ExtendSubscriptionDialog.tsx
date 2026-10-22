import { useEffect } from 'react';
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
import { CalendarCheck, Loader2, Clock } from 'lucide-react';
import {
  extendSubscriptionSchema,
  type ExtendSubscriptionValues,
} from '@/features/admin/schemas/courtOwnerSchema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: CourtOwnerItem | null;
  onSubmit: (ownerId: string, durationMonths: number) => Promise<void>;
  isSubmitting?: boolean;
}

export function ExtendSubscriptionDialog({
  open,
  onOpenChange,
  owner,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<ExtendSubscriptionValues>({
    resolver: zodResolver(extendSubscriptionSchema),
    defaultValues: {
      durationMonths: 3,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        durationMonths: 3,
      });
    }
  }, [open, form]);

  if (!owner) return null;

  const handleFormSubmit = async (values: ExtendSubscriptionValues) => {
    await onSubmit(owner.id, values.durationMonths);
    onOpenChange(false);
  };

  const durationOptions = [
    { value: 1, label: '1 tháng (Gia hạn ngắn hạn)' },
    { value: 3, label: '3 tháng (1 quý)' },
    { value: 6, label: '6 tháng (Nửa năm)' },
    { value: 12, label: '12 tháng (1 năm - Ưu đãi)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] border-[#1b2b22] bg-[#0c1410] text-zinc-100 p-6 rounded-2xl shadow-2xl">
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
            Kéo dài thời hạn hoạt động gói cước dịch vụ cho đối tác chủ sân.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            {/* Thông tin chủ sân */}
            <div className="rounded-xl bg-[#111915] border border-[#1b2b22] p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Chủ sân:</span>
                <span className="font-bold text-white">{owner.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Gói đang dùng:</span>
                <span className="font-semibold text-emerald-400">
                  {owner.currentPackageName || 'Gói Cơ bản'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Hạn hiện tại:</span>
                <span>{owner.packageEndDate || 'Chưa thiết lập'}</span>
              </div>
            </div>

            {/* Chọn thời gian gia hạn */}
            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-zinc-300">
                    Chọn thời gian gia hạn thêm:
                  </FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-xl bg-[#111915] border-[#1b2b22] text-xs text-white">
                        <SelectValue placeholder="Chọn thời gian gia hạn" />
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

            {/* Lưu ý */}
            <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-300">
              <Clock className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Thời gian sẽ được cộng nối tiếp từ ngày hết hạn hiện tại (hoặc tính từ hôm nay nếu gói đã hết hạn trước đó).
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
                <span>{isSubmitting ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
