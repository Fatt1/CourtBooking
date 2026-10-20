import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Plus, Trash2, Sparkles, Layers } from 'lucide-react';
import {
  servicePackageSchema,
  type ServicePackageFormValues,
} from '@/features/admin/schemas/servicePackageSchema';
import type { ServicePackageConfigItem, UpdatePackagePayload } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicePackage: ServicePackageConfigItem | null;
  onSubmit: (payload: UpdatePackagePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditServicePackageDialog({
  open,
  onOpenChange,
  servicePackage,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<ServicePackageFormValues>({
    resolver: zodResolver(servicePackageSchema),
    defaultValues: {
      name: '',
      badge: '',
      price: 0,
      durationMonths: 1,
      description: '',
      features: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (servicePackage) {
      form.reset({
        name: servicePackage.name || '',
        badge: servicePackage.badge || '',
        price: servicePackage.price || 0,
        durationMonths: servicePackage.durationMonths || 1,
        description: servicePackage.description || '',
        features: servicePackage.features || [],
        isActive: servicePackage.isActive ?? true,
      });
    }
  }, [servicePackage, form]);

  const handleSubmit = async (values: ServicePackageFormValues) => {
    if (!servicePackage) return;
    await onSubmit({
      id: servicePackage.id,
      name: values.name,
      badge: values.badge,
      price: values.price,
      durationMonths: values.durationMonths,
      description: values.description,
      features: values.features,
      isActive: values.isActive,
    });
    onOpenChange(false);
  };

  const currentFeatures = form.watch('features') || [];

  const handleAddFeature = () => {
    form.setValue('features', [...currentFeatures, '']);
  };

  const handleRemoveFeature = (idx: number) => {
    const updated = currentFeatures.filter((_, i) => i !== idx);
    form.setValue('features', updated);
  };

  const handleFeatureChange = (idx: number, val: string) => {
    const updated = [...currentFeatures];
    updated[idx] = val;
    form.setValue('features', updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0c1410] border border-[#1b2b22] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Chỉnh Sửa Gói Dịch Vụ {servicePackage?.name}
            </DialogTitle>
          </div>
          <p className="text-xs text-zinc-400">
            Cập nhật tên, mức phí, quyền lợi và trạng thái phân phối gói SaaS tới đối tác.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            {/* 1. Tên gói & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Tên gói <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        className="w-full h-10 rounded-xl bg-[#121c16] border border-[#1d2c23] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                        placeholder="Basic, Pro, Ultra..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="badge"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Huy hiệu (Badge)
                    </FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        className="w-full h-10 rounded-xl bg-[#121c16] border border-[#1d2c23] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 uppercase"
                        placeholder="KHỞI ĐẦU, PHỔ BIẾN NHẤT..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Giá & Chu kỳ tháng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Giá gói (VNĐ) <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        className="w-full h-10 rounded-xl bg-[#121c16] border border-[#1d2c23] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                        placeholder="499000, 1000000, 2000000..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Chu kỳ (tháng)
                    </FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        className="w-full h-10 rounded-xl bg-[#121c16] border border-[#1d2c23] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Danh sách tính năng (Features list) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Quyền lợi & Tính năng kèm theo
                </span>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>Thêm dòng</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {currentFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      className="flex-1 h-9 rounded-lg bg-[#121c16] border border-[#1d2c23] px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                      placeholder={`Tính năng ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="size-8 rounded-lg border border-[#1d2c23] bg-[#121c16] hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 flex items-center justify-center cursor-pointer transition-colors"
                      title="Xóa tính năng"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#1b2b22] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9.5 px-4 rounded-xl border-[#1d2c23] bg-[#121c16] text-zinc-300 hover:text-white hover:bg-[#18261e] text-xs cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9.5 px-5 rounded-xl bg-[#00875a] hover:bg-[#00754e] text-white font-bold text-xs gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
