import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OwnerPageHeader, OwnerPagination } from '../components/shared';
import { RetailOrderFilters, presetDates } from '../components/retail-orders/RetailOrderFilters';
import { RetailOrderTable } from '../components/retail-orders/RetailOrderTable';
import { RetailOrderSummary } from '../components/retail-orders/RetailOrderSummary';
import { RetailOrderDetailSheet } from '../components/retail-orders/RetailOrderDetailSheet';
import { exportRetailOrders } from '../components/retail-orders/receiptActions';
import { useBranchStore } from '@/stores/useBranchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { fetchAllRetailOrders, useRetailOrdersQuery, useRetailOrderSummaryQuery } from '@/api/retail-orders';
import { getApiErrorMessage } from '@/types/api';

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;
const validId = (value: string | null) => Boolean(value && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value));

export function RetailOrdersPage() {
  const branchId = useBranchStore((state) => state.selectedBranchId);
  const [params, setParams] = useSearchParams();
  const previousBranch = useRef(branchId);
  const [exporting, setExporting] = useState(false);
  const large = useMediaQuery('(min-width: 1600px)');
  const today = presetDates('today');
  const from = params.get('from') ?? today.from;
  const to = params.get('to') ?? today.to;
  const search = params.get('q') ?? '';
  const debouncedSearch = useDebounce(search.trim());
  const preset = params.get('preset') ?? (params.has('from') || params.has('to') ? 'custom' : 'today');
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = [10, 25, 50, 100].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const rawId = params.get('orderId');
  const selectedId = validId(rawId) ? rawId : null;
  const validRange = validDate(from) && validDate(to) && from <= to;
  const filters = { branchId: branchId ?? '', fromDate: from, toDate: to, search: debouncedSearch };
  const list = useRetailOrdersQuery(filters, page, pageSize, validRange);
  const summary = useRetailOrderSummaryQuery(filters, validRange && !debouncedSearch);

  const changeParams = (values: Record<string, string | null>, replace = true) => {
    // A second interaction may occur before React Router renders the previous URL update.
    const next = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([key, value]) => { if (value === null) next.delete(key); else next.set(key, value); });
    setParams(next, { replace, preventScrollReset: true });
  };

  useEffect(() => {
    if (previousBranch.current && previousBranch.current !== branchId) {
      setParams((current) => { const next = new URLSearchParams(current); next.delete('orderId'); next.delete('page'); return next; }, { replace: true, preventScrollReset: true });
    }
    previousBranch.current = branchId;
  }, [branchId, setParams]);

  useEffect(() => {
    if (list.data && page > Math.max(1, list.data.totalPages)) {
      setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(Math.max(1, list.data!.totalPages))); return next; }, { replace: true, preventScrollReset: true });
    }
  }, [list.data, page, setParams]);

  const exportFile = async () => {
    if (exporting || !validRange || !branchId) return;
    setExporting(true);
    try {
      const all = await fetchAllRetailOrders({ ...filters, search: search.trim() });
      if (!all.length) { toast.info('Không có hóa đơn để xuất'); return; }
      exportRetailOrders(all, from, to);
      toast.success(`Đã xuất ${all.length} hóa đơn theo bộ lọc`);
    } catch (err) { toast.error(getApiErrorMessage(err, 'Không thể xuất hóa đơn')); }
    finally { setExporting(false); }
  };

  if (!branchId) return <div className="space-y-5"><OwnerPageHeader title="Lịch sử hóa đơn" /><p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Vui lòng chọn chi nhánh để xem lịch sử bán lẻ.</p></div>;

  return <div className="space-y-5">
    <OwnerPageHeader category="Bán hàng tại quầy" title="Lịch sử hóa đơn" actions={<>
      <Button variant="outline" className="gap-2" disabled={exporting || !validRange || list.isPending || list.isError} onClick={() => void exportFile()}><Download className="size-4" />{exporting ? 'Đang xuất...' : 'Xuất CSV'}</Button>
      <Button asChild className="gap-2 bg-brand-green text-white hover:bg-brand-green-hover"><Link to="/owner/pos"><Plus className="size-4" />Bán hàng tại quầy</Link></Button>
    </>} />
    <div className={selectedId && large ? 'grid items-start gap-5 min-[1600px]:grid-cols-[minmax(0,1fr)_440px]' : ''}>
      <section className="min-w-0 space-y-5" aria-label="Danh sách hóa đơn">
        <RetailOrderFilters from={from} to={to} preset={preset} search={search}
          onDates={(start, end, value) => {
            const changes: Record<string, string | null> = { preset: value, page: null, orderId: null };
            if (start !== undefined) changes.from = start;
            if (end !== undefined) changes.to = end;
            changeParams(changes);
          }}
          onSearch={(value) => changeParams({ q: value || null, page: null, orderId: null })} />
        {!validRange ? <p role="alert" className="text-sm text-destructive">Chọn khoảng ngày hợp lệ: ngày bắt đầu không được sau ngày kết thúc.</p> : <>
          {list.isError ? <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"><p>{getApiErrorMessage(list.error, 'Không thể tải lịch sử hóa đơn')}</p><Button variant="outline" disabled={list.isFetching} onClick={() => void list.refetch()}>Thử lại</Button></div>
            : <RetailOrderTable items={list.data?.items ?? []} loading={list.isPending || search.trim() !== debouncedSearch} selectedId={selectedId} onSelect={(id) => changeParams({ orderId: id }, false)} />}
          {list.data && !list.isError && <OwnerPagination currentPage={page} pageSize={pageSize} totalItems={list.data.totalCount} onPageChange={(next) => changeParams({ page: String(next) })}
            onPageSizeChange={(size) => changeParams({ size: String(size), page: null })} />}
          <div className="space-y-3"><h2 className="text-sm font-semibold">Tổng quan {debouncedSearch ? 'kết quả tìm kiếm' : 'trong khoảng ngày đã chọn'}</h2>
            {(debouncedSearch ? list.isError : summary.isError) ? <div className="space-y-2 text-sm text-muted-foreground"><p>Không thể tải tổng quan.</p><Button variant="outline" size="sm" onClick={() => { void summary.refetch(); void list.refetch(); }}>Thử lại tổng quan</Button></div>
              : <RetailOrderSummary data={debouncedSearch ? list.data?.summary : summary.data} loading={debouncedSearch ? list.isPending : summary.isPending} />}
          </div>
        </>}
        {rawId && !selectedId && <p role="alert" className="text-sm text-destructive">ID hóa đơn trên đường dẫn không hợp lệ.</p>}
      </section>
      <RetailOrderDetailSheet id={selectedId} branchId={branchId} onClose={() => changeParams({ orderId: null })} />
    </div>
  </div>;
}
