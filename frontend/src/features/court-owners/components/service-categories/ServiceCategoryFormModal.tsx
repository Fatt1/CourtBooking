import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
      title={category ? 'Cập nhật danh mục' : 'Thông tin danh mục'} hideFooter>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tên danh mục <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input {...field} maxLength={150} autoFocus placeholder="Nhập tên danh mục..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <textarea {...field} maxLength={300} rows={4}
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur} ref={field.ref} name={field.name} className="size-5 accent-[#a3e635]" /></FormControl>
                <FormLabel>Hoạt động</FormLabel>
                <FormMessage />
              </FormItem>
            )} />
          </fieldset>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => changeOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#a3e635] font-bold text-black hover:bg-[#8ece28]">
              {isSubmitting ? 'Đang lưu...' : 'Lưu danh mục'}
            </Button>
          </div>
        </form>
      </Form>
    </OwnerModal>
  );
}
