import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { OwnerModal, OwnerPageHeader } from '../components/shared';
import { PosProductGrid } from '../components/pos/PosProductGrid';
import { PosCart } from '../components/pos/PosCart';
import { RetailReceiptModal } from '../components/pos/RetailReceiptModal';
import { usePosDraft, emptyPosDraft } from '../hooks/usePosDraft';
import { retailOrderSchema } from '../schemas/retailOrderSchema';
import { useBranchStore } from '@/stores/useBranchStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useServiceCategoriesQuery } from '@/api/service-categories';
import { usePosProductsQuery, useCreateRetailOrderMutation, type RetailOrderDto } from '@/api/retail-orders';
import { getImageUrl } from '@/api/storage';
import { getApiErrorMessage } from '@/types/api';
import type { PosProduct } from '../types/pos';

export function PosPage() {
  const branchId = useBranchStore((state) => state.selectedBranchId);
  const userId = useAuthStore((state) => state.user?.id ?? '');
  if (!branchId || !userId) return <div className="space-y-6">
    <OwnerPageHeader category="Bán hàng tại quầy" title="POS - Bán lẻ" />
    <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Vui lòng chọn hoặc tạo chi nhánh để bắt đầu bán hàng.</p>
  </div>;
  return <BranchPos key={`${userId}:${branchId}`} branchId={branchId} userId={userId} />;
}

function BranchPos({ branchId, userId }: { branchId: string; userId: string }) {
  const catalog = usePosProductsQuery(branchId);
  const categories = useServiceCategoriesQuery();
  const checkout = useCreateRetailOrderMutation();
  const { draft, updateDraft } = usePosDraft(userId, branchId);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  useEffect(() => {
    if (categoryId && categories.isSuccess && !categories.data.some((item) => item.id === categoryId && item.isActive)) setCategoryId('');
  }, [categoryId, categories.isSuccess, categories.data]);
  const [error, setError] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [receipt, setReceipt] = useState<RetailOrderDto | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const checkoutLock = useRef(false);

  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => { if (e.key === 'F3') { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const products = useMemo<PosProduct[]>(() => {
    const activeCategories = new Set(categories.data?.filter((item) => item.isActive).map((item) => item.id));
    return (catalog.data ?? []).flatMap((product) => {
      const branch = product.branches.find((item) => item.branchId === branchId);
      return branch ? [{ id: product.id, name: product.name, unit: product.unit, categoryId: product.categoryId,
        imageUrl: getImageUrl(product.image?.key || product.image?.url), price: branch.price,
        available: branch.isActive && activeCategories.has(product.categoryId) }] : [];
    });
  }, [catalog.data, categories.data, branchId]);
  const productMap = new Map(products.map((item) => [item.id, item]));
  const lines = draft.lines.map((line) => {
    const current = productMap.get(line.serviceId);
    return current ? { ...line, name: current.name, unit: current.unit, unitPrice: current.price } : line;
  });
  const unavailable = new Set(lines.filter((line) => !productMap.get(line.serviceId)?.available).map((line) => line.serviceId));
  const subtotal = lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0) / 100;
  const discount = draft.discount.trim() === '' ? 0 : Number(draft.discount);
  const validDiscount = Number.isFinite(discount) && discount >= 0 && discount <= subtotal
    && Math.abs(Math.round(discount * 100) - discount * 100) < 0.00001;
  const ready = !catalog.isPending && !categories.isPending && !catalog.isError && !categories.isError;
  const filtered = products.filter((product) => (!categoryId || product.categoryId === categoryId)
    && product.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));

  const add = (product: PosProduct) => {
    if (checkoutLock.current || !product.available) return;
    const existing = lines.find((line) => line.serviceId === product.id);
    if (existing && existing.quantity >= 9999) return;
    updateDraft({ ...draft, lines: existing ? lines.map((line) => line.serviceId === product.id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...lines, { serviceId: product.id, name: product.name, unit: product.unit, unitPrice: product.price, quantity: 1 }] });
    setError('');
  };
  const changeQuantity = (id: string, quantity: number) => {
    if (checkoutLock.current) return;
    updateDraft({ ...draft, lines: lines.map((line) => line.serviceId === id ? { ...line, quantity } : line).filter((line) => line.quantity > 0) });
    setError('');
  };

  const pay = async () => {
    if (checkoutLock.current || !ready || !validDiscount || !lines.length || unavailable.size) return;
    checkoutLock.current = true;
    setError('');
    try {
      // Recheck availability and price before using the existing checkout API.
      const fresh = await catalog.refetch();
      if (fresh.isError) throw fresh.error;
      const freshCategories = await categories.refetch();
      if (freshCategories.isError) throw freshCategories.error;
      const activeIds = new Set(freshCategories.data?.filter((item) => item.isActive).map((item) => item.id));
      const changed = lines.some((line) => {
        const product = fresh.data?.find((item) => item.id === line.serviceId);
        const branch = product?.branches.find((item) => item.branchId === branchId);
        return !product || !branch?.isActive || !activeIds.has(product.categoryId) || branch.price !== line.unitPrice;
      });
      if (changed) { setError('Giá hoặc trạng thái sản phẩm vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.'); return; }
      const payload = retailOrderSchema.parse({ branchId, discountAmount: discount,
        items: lines.map((line) => ({ serviceId: line.serviceId, quantity: line.quantity })) });
      const result = await checkout.mutateAsync(payload);
      updateDraft(emptyPosDraft());
      setReceipt(result);
      toast.success('Đã lưu hóa đơn bán lẻ');
    } catch (err) {
      const status = typeof err === 'object' && err ? (err as { status?: number }).status : undefined;
      setError(getApiErrorMessage(err, 'Không thể lưu hóa đơn')
        + (!status || status >= 500 ? ' Kiểm tra hóa đơn đã tạo trước khi thanh toán lại.' : ''));
    } finally { checkoutLock.current = false; }
  };

  const [checking, setChecking] = useState(false);
  const onPay = async () => { if (checking) return; setChecking(true); try { await pay(); } finally { setChecking(false); } };
  const busy = checking || checkout.isPending;
  const hasError = catalog.isError || categories.isError;
  return <div className="space-y-5">
    <OwnerPageHeader title="POS - Bán lẻ" className="[&_h1]:text-lg" actions={
      <Button variant="ghost" size="sm" disabled={busy || catalog.isFetching || categories.isFetching} onClick={() => { void catalog.refetch(); void categories.refetch(); }} className="gap-2 text-xs"><RefreshCw className="size-3.5" /> Làm mới</Button>
    } />
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-5" aria-label="Sản phẩm bán lẻ">
        <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm sản phẩm nhanh (F3)..." aria-label="Tìm kiếm sản phẩm"
            className="h-10 rounded-lg bg-card pl-10 text-xs" />
        </div>
        <SearchableSelect className="sm:w-56 sm:shrink-0" triggerClassName="h-10 rounded-lg bg-card text-xs"
          contentClassName="bg-popover text-popover-foreground [&>div:first-child]:bg-muted/40 [&_input]:text-foreground [&_button]:text-foreground [&_button:hover]:bg-accent [&_button:hover]:text-foreground [&_svg]:text-brand-green"
          value={categoryId} onChange={(value) => setCategoryId(value)} disabled={categories.isPending}
          placeholder="Tất cả danh mục" searchPlaceholder="Tìm danh mục..." emptyText="Không tìm thấy danh mục"
          options={[{ value: '', label: 'Tất cả danh mục', subLabel: `${products.length} sản phẩm` },
            ...(categories.data ?? []).filter((item) => item.isActive).map((item) => ({ value: item.id, label: item.name,
              subLabel: `${products.filter((product) => product.categoryId === item.id).length} sản phẩm` }))]} />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{ready ? `${filtered.length} sản phẩm` : 'Đang tải sản phẩm...'}</span>
          {(categoryId || search) && <button type="button" onClick={() => { setCategoryId(''); setSearch(''); }} className="font-medium text-brand-green hover:underline dark:text-emerald-400">Xóa bộ lọc</button>}
        </div>
        {hasError ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p>{getApiErrorMessage(catalog.error || categories.error, 'Không thể tải sản phẩm')}</p>
          <Button variant="outline" className="mt-3" onClick={() => { void catalog.refetch(); void categories.refetch(); }}>Thử lại</Button>
        </div> : <PosProductGrid products={filtered} loading={!ready} disabled={busy} onAdd={add} />}
      </section>
      <PosCart lines={lines} subtotal={subtotal} discount={draft.discount} discountAmount={Number.isFinite(discount) ? discount : 0}
        locked={busy} paying={busy} canPay={ready && lines.length > 0 && validDiscount && !unavailable.size}
        error={error || (!validDiscount ? 'Giảm giá phải là số không âm, không vượt quá tiền hàng và tối đa 2 chữ số thập phân.' : '')}
        unavailable={ready ? unavailable : new Set()} onQuantity={changeQuantity}
        onDiscount={(value) => { updateDraft({ ...draft, discount: value }); setError(''); }}
        onClear={() => setClearOpen(true)} onPay={() => void onPay()} />
    </div>
    <OwnerModal open={clearOpen} onOpenChange={setClearOpen} title="Hủy giỏ hàng?" description="Các sản phẩm trong hóa đơn chưa lưu sẽ được bỏ khỏi giỏ."
      onSubmit={() => { updateDraft(emptyPosDraft()); setError(''); setClearOpen(false); }} submitText="Hủy giỏ hàng" cancelText="Giữ lại"><p className="text-sm text-muted-foreground">Giỏ hàng của các chi nhánh khác được giữ nguyên.</p></OwnerModal>
    <RetailReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
  </div>;
}
