import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ShoppingBag, Tag, List, Box, ImagePlus, Save, Loader2 } from 'lucide-react';
import { OwnerModal } from '../shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useOwnerServiceDetailQuery, type CreateServicePayload } from '@/api/services';
import { useBranchStore } from '@/stores/useBranchStore';
import { useServiceCategoriesQuery } from '@/api/service-categories';
import { getImageUrl, uploadImageApi } from '@/api/storage';
import { getApiErrorMessage } from '@/types/api';
import { productSchema, type ProductFormValues } from '../../schemas/productSchema';
import { BranchPricingList } from './BranchPricingList';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  branchId: string;
  branchName: string;
  isSubmitting: boolean;
  onSubmit: (payload: CreateServicePayload) => Promise<void>;
}

export function ProductFormModal({ open, onOpenChange, productId, branchId, branchName, isSubmitting, onSubmit }: Props) {
  const detail = useOwnerServiceDetailQuery(open ? productId : null);
  const categories = useServiceCategoriesQuery();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadVersion = useRef(0);
  const initialized = useRef(false);
  const branchList = useBranchStore((state) => state.branches);
  const allBranches = branchList.length ? branchList : [{ id: branchId, name: branchName }];
  const existingIds = new Set(detail.data?.branches.map((item) => item.branchId) ?? []);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', unit: '', categoryId: '', branches: [], imageId: null },
  });

  useEffect(() => {
    initialized.current = false;
    uploadVersion.current += 1;
    setUploading(false);
    if (!productId) {
      form.reset({ name: '', unit: '', categoryId: '', imageId: null,
        branches: allBranches.map((branch) => ({ branchId: branch.id, selected: branch.id === branchId, price: 0, isActive: true })) });
      setImageUrl('');
    }
  }, [open, productId, branchId, branchList, form]);

  useEffect(() => {
    if (!open || !productId || !detail.data || detail.isFetching || initialized.current) return;
    const product = detail.data;
    form.reset({ name: product.name, unit: product.unit, categoryId: product.categoryId,
      imageId: product.image?.id ?? null,
      branches: [...allBranches, ...product.branches.filter((item) => !allBranches.some((branch) => branch.id === item.branchId))
        .map((item) => ({ id: item.branchId, name: item.branchName }))].map((branch) => {
        const current = product.branches.find((item) => item.branchId === branch.id);
        return { branchId: branch.id, selected: Boolean(current), price: current?.price ?? 0, isActive: current?.isActive ?? true };
      }) });
    setImageUrl(getImageUrl(product.image?.key || product.image?.url));
    initialized.current = true;
  }, [open, productId, branchId, branchList, detail.data, detail.isFetching, form]);

  useEffect(() => () => { uploadVersion.current += 1; }, []);

  const busy = isSubmitting || uploading;
  const ready = !productId || (!detail.isPending && !detail.isFetching && !detail.isError && Boolean(detail.data));

  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB');
      return;
    }
    const version = ++uploadVersion.current;
    setUploading(true);
    try {
      const image = await uploadImageApi(file);
      if (version !== uploadVersion.current) return;
      form.setValue('imageId', image.id, { shouldDirty: true });
      setImageUrl(getImageUrl(image.url));
    } catch (err) {
      if (version === uploadVersion.current) toast.error(getApiErrorMessage(err, 'Không thể tải ảnh'));
    } finally {
      if (version === uploadVersion.current) setUploading(false);
    }
  };

  const save = async (values: ProductFormValues) => {
    if (busy || !ready) return;
    await onSubmit({ name: values.name, unit: values.unit, categoryId: values.categoryId, imageId: values.imageId,
      branches: values.branches.filter((branch) => branch.selected)
        .map(({ branchId: id, price, isActive }) => ({ branchId: id, price, isActive })) });
  };

  const onInvalid: Parameters<typeof form.handleSubmit>[1] = (errors) => {
    const index = form.getValues('branches').findIndex((_, i) => errors.branches?.[i]?.price);
    if (index >= 0) {
      const row = document.querySelector(`[data-branch-index="${index}"]`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row?.querySelector<HTMLInputElement>('input[type="number"]')?.focus();
    }
  };

  return (
    <OwnerModal open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}
      maxWidth="max-w-none sm:max-w-3xl" hideFooter bodyClassName="p-4 sm:p-6"
      className="h-dvh max-h-dvh w-screen gap-0 overflow-x-hidden rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:w-[95vw] sm:rounded-2xl sm:p-0 [&>div:first-child]:border-0 [&>div:first-child]:p-0 [&>div:first-child>div]:w-full [&>div:first-child>div>div]:w-full [&>button]:z-10"
      title={
        <span className="relative flex min-h-[120px] items-center gap-4 overflow-hidden bg-gradient-to-br from-emerald-50 via-[#f5faf4] to-amber-50 px-6 py-6 pr-28 font-sans dark:from-emerald-950/60 dark:via-card dark:to-amber-950/20">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-brand-green shadow-sm dark:bg-emerald-900/40">
            <ShoppingBag className="size-7" strokeWidth={1.8} />
          </span>
          <span className="relative z-10 block">
            <span className="block text-lg font-extrabold tracking-tight text-[#173e26] dark:text-emerald-100">{productId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</span>
            <span className="mt-1.5 block text-xs font-normal leading-relaxed tracking-normal text-[#4d7b60] dark:text-emerald-200/80">
              Chi nhánh đang chọn: <strong className="font-semibold">{branchName}</strong>.
              <span className="mt-1 block">Chọn nơi bán và giá riêng ở phần B.</span>
            </span>
          </span>
          <svg aria-hidden="true" viewBox="0 0 120 110" className="absolute bottom-1 right-2 w-[112px]">
            <ellipse cx="65" cy="91" rx="46" ry="9" fill="#e9dba9" opacity=".3" />
            <path d="M33 49 65 34 98 49 66 66Z" fill="#e6ad56" />
            <path d="M33 49 66 66 66 94 33 76Z" fill="#e6af65" />
            <path d="M66 66 98 49 98 77 66 94Z" fill="#d3923d" />
            <path d="M33 49 21 65 54 79 66 66Z" fill="#f5d398" />
            <path d="M66 66 81 78 111 61 98 49Z" fill="#ffe3ad" />
            <path d="M33 49 45 31 76 40 65 54Z" fill="#ffdf9e" />
            <path d="M65 34 79 21 105 33 98 49Z" fill="#f8d28b" />
            <circle cx="96" cy="85" r="15" fill="#fff" />
            <circle cx="96" cy="85" r="13" fill="#32984f" />
            <path d="M96 78v14m-7-7h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="m107 22 2-5 2 5 5 2-5 2-2 5-2-5-5-2ZM17 76l1-4 2 4 4 1-4 2-2 4-1-4-4-2Z" fill="#f3ce55" />
          </svg>
        </span>
      }>
      {productId && <p className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Thay đổi tên, danh mục, đơn vị hoặc ảnh sẽ ảnh hưởng mọi chi nhánh đang bán sản phẩm này.</p>}
      {productId && detail.isError ? (
        <div role="alert" className="space-y-2 text-destructive">
          <p>{getApiErrorMessage(detail.error, 'Không thể tải sản phẩm')}</p>
          <Button variant="outline" onClick={() => void detail.refetch()}>Thử lại</Button>
        </div>
      ) : !ready ? <p role="status">Đang tải sản phẩm...</p> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
              <div><h3 className="font-bold">A. Thông tin chung</h3><p className="mt-1 text-xs text-muted-foreground">Áp dụng cho mọi chi nhánh đã gắn sản phẩm.</p></div>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="space-y-1.5"><FormLabel className="text-xs font-semibold">Tên sản phẩm *</FormLabel>
                  <div className="relative"><Tag className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                    <FormControl><Input {...field} maxLength={255} autoFocus placeholder="Nhập tên sản phẩm..." className="rounded-lg pl-10" /></FormControl>
                  </div><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem className="space-y-1.5"><FormLabel className="text-xs font-semibold">Danh mục *</FormLabel><div className="relative">
                  <List className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><FormControl>
                  <select {...field} disabled={categories.isPending || categories.isError} className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Chọn danh mục</option>
                    {(categories.data ?? []).filter((item) => item.isActive || item.id === detail.data?.categoryId).map((item) => (
                      <option key={item.id} value={item.id} disabled={!item.isActive}>{item.name}{!item.isActive ? ' (đã tạm ngưng - cần chọn danh mục khác)' : ''}</option>
                    ))}
                  </select>
                </FormControl></div><FormMessage /></FormItem>
              )} />
              {categories.isError && <p role="alert" className="text-destructive">{getApiErrorMessage(categories.error)}</p>}
              {!categories.isPending && !categories.isError && !categories.data?.some((item) => item.isActive) &&
                <p className="text-muted-foreground">Hãy tạo hoặc kích hoạt danh mục dịch vụ trước khi thêm sản phẩm.</p>}
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem className="space-y-1.5"><FormLabel className="text-xs font-semibold">Đơn vị tính *</FormLabel><div className="relative">
                  <Box className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                  <FormControl><Input {...field} maxLength={50} placeholder="Chai, Lon, Ca..." className="rounded-lg pl-10 text-xs" /></FormControl>
                </div><FormMessage /></FormItem>
              )} />
              <div className="space-y-2">
                <label htmlFor="product-image" className="text-xs font-semibold">Hình ảnh</label>
                <input ref={fileInput} id="product-image" type="file" className="sr-only" tabIndex={-1} accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
                <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) void upload(e.dataTransfer.files[0]); }}
                  className={`flex min-h-20 w-full items-center justify-center gap-3 rounded-xl border border-dashed px-3 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragging ? 'border-brand-green bg-emerald-50 dark:bg-emerald-950/40' : 'border-border bg-muted/30 hover:border-brand-green/50 hover:bg-muted/50'}`}>
                  {uploading ? <Loader2 className="size-6 animate-spin text-brand-green" /> : imageUrl
                    ? <img src={imageUrl} alt="Ảnh sản phẩm" className="size-12 rounded-lg object-cover" />
                    : <ImagePlus className="size-6 shrink-0 text-muted-foreground" />}
                  <span><span className="block text-[11px] font-medium text-muted-foreground">{uploading ? 'Đang tải ảnh...' : imageUrl ? 'Nhấp để thay ảnh hoặc kéo thả vào đây' : 'Nhấp để chọn ảnh hoặc kéo thả vào đây'}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/80">JPG, PNG, WebP; tối đa 5 MB.</span></span>
                </button>
                {imageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => { form.setValue('imageId', null); setImageUrl(''); }}>Bỏ ảnh</Button>}
              </div>
              <BranchPricingList branches={[...allBranches, ...(detail.data?.branches ?? []).filter((item) => !allBranches.some((branch) => branch.id === item.branchId))
                .map((item) => ({ id: item.branchId, name: item.branchName }))]} currentBranchId={branchId} existingIds={existingIds} />
            </fieldset>
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-border bg-card py-3">
              <Button type="button" variant="outline" className="h-10 rounded-xl px-6 text-xs" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={busy || categories.isPending || categories.isError}
                className="h-10 gap-2 rounded-xl bg-brand-green px-5 text-xs font-bold text-white shadow-sm hover:bg-brand-green-hover">
                <Save className="size-4" />
                {uploading ? 'Đang tải ảnh...' : isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </OwnerModal>
  );
}
