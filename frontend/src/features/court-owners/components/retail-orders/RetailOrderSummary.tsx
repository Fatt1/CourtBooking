import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/format';
import type { RetailOrderSummaryDto } from '@/api/retail-orders';

export function RetailOrderSummary({ data, loading }: { data?: RetailOrderSummaryDto; loading: boolean }) {
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Tổng quan hóa đơn đã lọc">
    {[{ label: 'Số hóa đơn', value: data?.totalOrders?.toLocaleString('vi-VN') },
      { label: 'Tiền hàng', value: formatVND(data?.grossRevenue) },
      { label: 'Giảm giá', value: formatVND(data?.totalDiscount) },
      { label: 'Tổng thu', value: formatVND(data?.netRevenue) }].map((item) => <div key={item.label} className="space-y-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{item.label}</p>
      {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold text-foreground">{item.value ?? '—'}</p>}
    </div>)}
  </div>;
}
