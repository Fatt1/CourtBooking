import { useState } from 'react';
import { Plus, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [categoryId, setCategoryId] = useState('ALL');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const categories = useServiceCategoriesQuery();
  const products = useOwnerServicesQuery({
    branchId,
    search: debouncedSearch.trim() || undefined,
    categoryId: categoryId === 'ALL' ? undefined : categoryId,
    isActive: status === 'all' ? undefined : status === 'active',
    page,
    pageSize,
  });
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

  const hasFilter = Boolean(search.trim()) || categoryId !== 'ALL' || status !== 'all';
  const isSearching = products.isFetching || search !== debouncedSearch;
  const hasError = products.isError || categories.isError;

  return (
    <div className="min-w-0 space-y-6">
      <OwnerPageHeader category="Quản lý dịch vụ" title="Sản phẩm đi kèm" actions={
        <Button className="h-9.5 gap-1.5 rounded-xl bg-[#a3e635] font-bold text-black hover:bg-[#8ece28]"
          onClick={() => { setProductId(null); setOpen(true); }}>
          <Plus className="size-4" /> Thêm sản phẩm
        </Button>
      } />
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Store className="mt-0.5 size-5 shrink-0 text-brand-green" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Đang quản lý sản phẩm tại: {branchName}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">Danh sách đang lọc theo chi nhánh này. Khi thêm hoặc sửa, bạn có thể chọn nhiều chi nhánh và đặt giá riêng cho từng nơi.</p>
        </div>
      </div>
      <div className="space-y-3">
        <OwnerFilterBar
          className="[&>div:last-child]:lg:justify-start"
          searchPlaceholder="Tìm tên sản phẩm..."
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
        >
          {/* Lọc danh mục với component Select chuẩn UI */}
          <Select
            value={categoryId}
            onValueChange={(val) => {
              setCategoryId(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9.5 w-[180px] shrink-0 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL" className="text-xs">
                Tất cả danh mục
              </SelectItem>
              {(categories.data ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs">
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lọc trạng thái với component Select chuẩn UI */}
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9.5 w-[140px] shrink-0 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground">
              <SelectValue placeholder="Mọi trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs">
                Mọi trạng thái
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                Đang bán
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                Tạm ngưng
              </SelectItem>
            </SelectContent>
          </Select>
        </OwnerFilterBar>

        {/* Thanh đếm kết quả tìm kiếm & Nút xóa bộ lọc */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <span>
            {isSearching
              ? 'Đang tìm kiếm...'
              : `Tìm thấy ${products.data?.totalCount ?? 0} sản phẩm`}
          </span>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryId('ALL');
                setStatus('all');
                setPage(1);
              }}
              className="font-medium text-brand-green hover:underline dark:text-emerald-400 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {hasError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p>{getApiErrorMessage(products.error || categories.error, 'Không thể tải dữ liệu sản phẩm')}</p>
          <Button variant="outline" disabled={products.isFetching || categories.isFetching}
            onClick={() => { void products.refetch(); void categories.refetch(); }}>Thử lại</Button>
        </div>
      ) : <>
        <ProductTable items={products.data?.items ?? []} categories={categories.data ?? []} branchId={branchId}
          isLoading={products.isPending || categories.isPending || isSearching} onEdit={(id) => { setProductId(id); setOpen(true); }}
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
