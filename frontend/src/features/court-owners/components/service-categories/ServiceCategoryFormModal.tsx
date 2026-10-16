import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Folder, Tag, Save, Loader2 } from 'lucide-react';
import { OwnerModal } from '../shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ServiceCategoryDto } from '@/api/service-categories';
import { serviceCategorySchema, type ServiceCategoryFormValues } from '../../schemas/serviceCategorySchema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ServiceCategoryDto | null;
  onSubmit: (values: ServiceCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ServiceCategoryFormModal({ open, onOpenChange, category, onSubmit, isSubmitting }: Props) {
  const form = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: { name: '', description: '', isActive: true },
  });

  useEffect(() => {
    if (open) form.reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
      isActive: category?.isActive ?? true,
    });
  }, [open, category, form]);

  const changeOpen = (next: boolean) => {
    if (!isSubmitting) onOpenChange(next);
  };

  return (
    <OwnerModal open={open} onOpenChange={changeOpen}
      maxWidth="max-w-[420px]" hideFooter bodyClassName="px-6 pb-5 pt-2"
      className="gap-0 overflow-x-hidden rounded-2xl p-0 sm:p-0 [&>div:first-child]:border-0 [&>div:first-child]:p-0 [&>div:first-child>div]:w-full [&>div:first-child>div>div]:w-full [&>button]:z-10"
      title={
        <span className="relative flex items-center gap-4 overflow-hidden px-6 pb-6 pt-7 pr-10 font-sans">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-36 rounded-full bg-emerald-50/70 dark:bg-emerald-950/30" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-3 bottom-0 size-12 rounded-full bg-emerald-50/70 dark:bg-emerald-950/30" />
          <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7e9] text-[#173e26] dark:bg-emerald-950/60 dark:text-emerald-200">
            <Folder className="size-8" strokeWidth={1.8} />
          </span>
          <span className="relative block">
            <span className="block text-xl font-extrabold tracking-tight text-foreground">Thông tin danh mục</span>
            <span className="mt-1 block text-[11px] font-normal leading-relaxed tracking-normal text-muted-foreground">Thêm mới hoặc cập nhật thông tin danh mục</span>
          </span>
        </span>
      }>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold">Tên danh mục <span className="text-destructive">*</span></FormLabel>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                  <FormControl><Input {...field} maxLength={150} autoFocus placeholder="Nhập tên danh mục..."
                    className="h-10 rounded-lg pl-10 text-xs focus-visible:ring-brand-green/40" /></FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold">Mô tả</FormLabel>
                <FormControl>
                  <textarea {...field} maxLength={300} rows={3} placeholder="Nhập mô tả danh mục (nếu có)..."
                    className="min-h-[88px] w-full resize-y rounded-lg border border-input bg-muted/15 p-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0 pt-1">
                <FormControl><input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur} ref={field.ref} name={field.name} className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#238542]" /></FormControl>
                <div>
                  <FormLabel className="cursor-pointer text-xs font-semibold">Hoạt động</FormLabel>
                  <p className="mt-1 text-[11px] text-muted-foreground">Danh mục sẽ hiển thị trên hệ thống</p>
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </fieldset>
          <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" className="h-10 rounded-lg px-6 text-xs" disabled={isSubmitting} onClick={() => changeOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 gap-2 rounded-lg bg-[#238542] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#1c6d35]">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSubmitting ? 'Đang lưu...' : 'Lưu danh mục'}
            </Button>
          </div>
        </form>
      </Form>
    </OwnerModal>
  );
}
