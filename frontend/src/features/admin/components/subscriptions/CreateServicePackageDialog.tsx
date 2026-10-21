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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackagePlus, Loader2 } from 'lucide-react';
import type { CreatePackagePayload } from '@/api/subscriptions';
import {
  createServicePackageSchema,
  type CreateServicePackageFormValues,
} from '@/features/admin/schemas/servicePackageSchema';

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
  const form = useForm<CreateServicePackageFormValues>({
    resolver: zodResolver(createServicePackageSchema),
    defaultValues: {
      name: '',
      price: 999000,
      durationMonths: 3,
      maxCourts: 8,
      maxBranches: 2,
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        price: 999000,
        durationMonths: 3,
        maxCourts: 8,
        maxBranches: 2,
        description: '',
      });
    }
  }, [open, form]);

  const handleFormSubmit = async (values: CreateServicePackageFormValues) => {
    await onSubmit({
      name: values.name,
      price: values.price,
      durationMonths: values.durationMonths,
      description: values.description || '',
      maxCourts: values.maxCourts,
      maxBranches: values.maxBranches,
    });

    form.reset();
    onOpenChange(false);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3.5 py-2">
            {/* Tên gói */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-zinc-300">
                    Tên gói dịch vụ <span className="text-rose-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ví dụ: Gói Pro Max / Giải đấu..."
                      className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Giá gói */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Giá cước (VNĐ) <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="10000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || Number(e.target.value) || 0)}
                        placeholder="499000"
                        className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Chu kỳ */}
              <FormField
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Chu kỳ thanh toán <span className="text-rose-400">*</span>
                    </FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-[#1b2d22] bg-[#0c1410] text-zinc-200">
                        <SelectItem value="1" className="text-xs cursor-pointer">1 tháng</SelectItem>
                        <SelectItem value="3" className="text-xs cursor-pointer">3 tháng (1 quý)</SelectItem>
                        <SelectItem value="6" className="text-xs cursor-pointer">6 tháng (Nửa năm)</SelectItem>
                        <SelectItem value="12" className="text-xs cursor-pointer">12 tháng (1 năm)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Giới hạn sân */}
              <FormField
                control={form.control}
                name="maxCourts"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">Số sân tối đa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || Number(e.target.value) || 1)}
                        placeholder="8"
                        className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Giới hạn chi nhánh */}
              <FormField
                control={form.control}
                name="maxBranches"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">Số chi nhánh tối đa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || Number(e.target.value) || 1)}
                        placeholder="2"
                        className="h-10 rounded-xl bg-[#111915] border-[#1b2d22] text-xs text-white"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-zinc-300">Mô tả & quyền lợi</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Quyền lợi của gói dịch vụ, đối tượng sử dụng..."
                      className="w-full p-2.5 rounded-xl bg-[#111915] border border-[#1b2d22] text-xs text-white resize-none outline-none focus:border-emerald-500/50"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

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
                disabled={isSubmitting}
                className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin text-slate-950" />}
                <span>{isSubmitting ? 'Đang tạo...' : 'Lưu gói dịch vụ'}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
