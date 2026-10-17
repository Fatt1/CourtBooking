import { useState } from 'react';
import { Plus, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OwnerFilterBar, OwnerPageHeader, OwnerPagination } from '../components/shared';
import { ProductTable } from '../components/products/ProductTable';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { useBranchStore } from '@/stores/useBranchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useServiceCategoriesQuery } from '@/api/service-categories';
import { useOwnerServicesQuery, useCreateServiceMutation, useUpdateServiceMutation,
  useUpdateServiceStatusMutation, type CreateServicePayload, type OwnerServiceDto } from '@/api/services';
import { getApiErrorMessage } from '@/types/api';

export function ProductsPage() {
  const { selectedBranchId, selectedBranch } = useBranchStore();
  if (!selectedBranchId) return (
    <div className="space-y-6">
      <OwnerPageHeader category="Quản lý dịch vụ" title="Sản phẩm đi kèm" />
      <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Vui lòng chọn hoặc tạo chi nhánh để quản lý sản phẩm.</p>
    </div>
  );
  return <BranchProducts key={selectedBranchId} branchId={selectedBranchId} branchName={selectedBranch?.name ?? 'chi nhánh đang chọn'} />;
}

function BranchProducts({ branchId, branchName }: { branchId: string; branchName: string }) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search.trim());
  const categories = useServiceCategoriesQuery();
  const products = useOwnerServicesQuery({ branchId, search: debouncedSearch || undefined,
    categoryId: categoryId || undefined, isActive: status === 'all' ? undefined : status === 'active', page, pageSize });
  const create = useCreateServiceMutation();
  const update = useUpdateServiceMutation();
  const toggle = useUpdateServiceStatusMutation();

  const save = async (payload: CreateServicePayload) => {
    try {
      if (productId) await update.mutateAsync({ id: productId, ...payload });
      else await create.mutateAsync(payload);
      toast.success(productId ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      setOpen(false);
      setPage(1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu sản phẩm'));
    }
  };

  const toggleStatus = async (item: OwnerServiceDto, isActive: boolean) => {
    try {
      await toggle.mutateAsync({ id: item.id, branchId, isActive });
      toast.success(isActive ? 'Đã bật bán sản phẩm' : 'Đã tạm ngưng bán sản phẩm');
      if (products.data?.items.length === 1 && page > 1 && status !== 'all') setPage(page - 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đổi trạng thái bán'));
    }
  };

  const selectClass = 'h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground';
  const hasError = products.isError || categories.isError;
  return (
    <div className="min-w-0 space-y-6">
      <OwnerPageHeader category="Quản lý dịch vụ" title="Sản phẩm đi kèm" actions={
        <Button className="gap-1.5 rounded-xl bg-brand-green font-bold text-white hover:bg-brand-green-hover"
          onClick={() => { setProductId(null); setOpen(true); }}>
          <Plus className="size-4" /> Thêm sản phẩm
        </Button>
      } />
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Store className="mt-0.5 size-5 shrink-0 text-brand-green" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Đang quản lý sản phẩm tại: {branchName}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">Sản phẩm thêm mới, giá và trạng thái bán áp dụng tại chi nhánh này. Chọn chi nhánh khác trên thanh đầu trang để chuyển danh sách.</p>
        </div>
      </div>
      <OwnerFilterBar className="[&>div:last-child]:lg:justify-start" searchPlaceholder="Tìm tên sản phẩm..." searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}>
        <select aria-label="Lọc danh mục" className={selectClass} value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
          <option value="">Tất cả danh mục</option>
          {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select aria-label="Lọc trạng thái" className={selectClass} value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">Mọi trạng thái</option><option value="active">Đang bán</option><option value="inactive">Tạm ngưng</option>
        </select>
      </OwnerFilterBar>
      {hasError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p>{getApiErrorMessage(products.error || categories.error, 'Không thể tải dữ liệu sản phẩm')}</p>
          <Button variant="outline" disabled={products.isFetching || categories.isFetching}
            onClick={() => { void products.refetch(); void categories.refetch(); }}>Thử lại</Button>
        </div>
      ) : <>
        <ProductTable items={products.data?.items ?? []} categories={categories.data ?? []} branchId={branchId}
          isLoading={products.isPending || categories.isPending} onEdit={(id) => { setProductId(id); setOpen(true); }}
          isUpdating={toggle.isPending} onToggle={(item, value) => void toggleStatus(item, value)} />
        {Boolean(products.data?.totalCount) && <OwnerPagination currentPage={page} pageSize={pageSize}
          totalItems={products.data?.totalCount ?? 0} onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />}
      </>}
      <ProductFormModal open={open} onOpenChange={setOpen} productId={productId} branchId={branchId} branchName={branchName}
        isSubmitting={create.isPending || update.isPending} onSubmit={save} />
    </div>
  );
}
