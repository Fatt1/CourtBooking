import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from '../../schemas/productSchema';

interface BranchOption { id: string; name: string }

export function BranchPricingList({ branches, currentBranchId, existingIds }: {
  branches: BranchOption[]; currentBranchId: string; existingIds: Set<string>;
}) {
  const form = useFormContext<ProductFormValues>();
  const values = useWatch({ control: form.control, name: 'branches' }) ?? [];
  const [commonPrice, setCommonPrice] = useState('');
  const [query, setQuery] = useState('');
  const selectedCount = values.filter((branch) => branch.selected).length;
  const visible = branches.map((branch, index) => ({ ...branch, index }))
    .filter((branch) => branch.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const allSelected = values.length > 0 && values.every((branch) => branch.selected);
  const setSelected = (index: number, selected: boolean) => {
    form.setValue(`branches.${index}.selected`, selected, { shouldDirty: true, shouldValidate: true });
    if (selected && !Number.isFinite(values[index]?.price)) {
      form.setValue(`branches.${index}.price`, commonPrice.trim() === '' ? 0 : Number(commonPrice), { shouldDirty: true });
    }
  };
  return <section aria-labelledby="branch-pricing-title" className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 id="branch-pricing-title" className="font-bold">B. Bán tại chi nhánh</h3>
        <p className="mt-1 text-xs text-muted-foreground">Giá và trạng thái bán áp dụng riêng cho từng chi nhánh.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => branches.forEach((branch, index) => {
        if (!existingIds.has(branch.id)) setSelected(index, !allSelected);
      })}>{allSelected ? 'Bỏ chọn chi nhánh mới' : 'Chọn tất cả'}</Button>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs font-semibold">Giá chung (VNĐ)
        <Input type="number" min="0" step="0.01" value={commonPrice} onChange={(event) => setCommonPrice(event.target.value)}
          placeholder="Ví dụ: 10000" className="mt-1 bg-card" /></label>
      <Button type="button" variant="outline" disabled={commonPrice.trim() === '' || !Number.isFinite(Number(commonPrice))
        || Number(commonPrice) < 0 || selectedCount === 0} onClick={() => {
          values.forEach((branch, index) => {
            if (branch.selected) form.setValue(`branches.${index}.price`, Number(commonPrice), { shouldDirty: true, shouldValidate: true });
          });
        }}>Áp dụng cho chi nhánh đã chọn</Button>
    </div>
    {branches.length > 8 && <Input aria-label="Tìm chi nhánh" placeholder="Tìm chi nhánh..." value={query}
      onChange={(event) => setQuery(event.target.value)} className="bg-card" />}
    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {visible.map((branch) => {
        const row = values[branch.index];
        if (!row) return null;
        const priceError = form.formState.errors.branches?.[branch.index]?.price?.message;
        return <div key={branch.id} data-branch-index={branch.index} className="rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input type="checkbox" id={`product-branch-${branch.id}`} checked={row.selected} disabled={existingIds.has(branch.id)}
              onChange={(event) => setSelected(branch.index, event.target.checked)} className="size-4 accent-green-700" />
            <label htmlFor={`product-branch-${branch.id}`} className="min-w-0 flex-1 text-sm font-semibold">{branch.name}</label>
            {branch.id === currentBranchId && <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Đang chọn</span>}
            {existingIds.has(branch.id) && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Đã áp dụng</span>}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="text-xs font-medium">Giá bán (VNĐ)
              <Input type="number" min="0" step="0.01" disabled={!row.selected} aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `product-price-error-${branch.index}` : undefined}
                value={Number.isFinite(row.price) ? row.price : ''}
                onChange={(event) => form.setValue(`branches.${branch.index}.price`, event.target.value === '' ? Number.NaN : event.target.valueAsNumber,
                  { shouldDirty: true, shouldValidate: true })} className="mt-1 bg-background" />
            </label>
            <label className="flex items-center justify-between gap-3 pb-2 text-xs font-medium sm:justify-start">
              <span className={`inline-block w-20 shrink-0 whitespace-nowrap text-right ${row.isActive ? 'text-brand-green dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {row.isActive ? 'Đang bán' : 'Ngừng bán'}
              </span>
              <Switch checked={row.isActive} disabled={!row.selected}
                aria-label={`${row.isActive ? 'Đang bán' : 'Ngừng bán'} tại ${branch.name}`}
                onCheckedChange={(checked) => form.setValue(`branches.${branch.index}.isActive`, checked, { shouldDirty: true })} />
            </label>
          </div>
          {row.selected && commonPrice.trim() !== '' && Number.isFinite(row.price) && row.price !== Number(commonPrice)
            && <p className="mt-1 text-xs text-muted-foreground">Giá riêng, khác giá chung.</p>}
          {priceError && <p id={`product-price-error-${branch.index}`} role="alert" className="mt-1 text-xs text-destructive">{priceError}</p>}
          {existingIds.has(branch.id) && <p className="mt-1 text-xs text-muted-foreground">Đã áp dụng; có thể ngừng bán bằng công tắc.</p>}
        </div>;
      })}
      {visible.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy chi nhánh.</p>}
    </div>
    {form.formState.errors.branches?.message && <p role="alert" className="text-xs text-destructive">{form.formState.errors.branches.message}</p>}
    <p role="status" className="text-xs font-semibold">{existingIds.size ? 'Sẽ áp dụng tại' : 'Sẽ thêm vào'} {selectedCount}/{branches.length} chi nhánh</p>
  </section>;
}
