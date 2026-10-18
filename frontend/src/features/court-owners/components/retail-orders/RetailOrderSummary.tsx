import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/format';
import type { RetailOrderSummaryDto } from '@/api/retail-orders';
import { Coins, ReceiptText, Tag, Wallet } from 'lucide-react';

export function RetailOrderSummary({ data, loading }: { data?: RetailOrderSummaryDto; loading: boolean }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan hóa đơn đã lọc">
    {[{ label: 'Số hóa đơn', value: data?.totalOrders?.toLocaleString('vi-VN'), icon: ReceiptText, tone: 'emerald' },
      { label: 'Tiền hàng', value: formatVND(data?.grossRevenue), icon: Coins, tone: 'mint' },
      { label: 'Giảm giá', value: formatVND(data?.totalDiscount), icon: Tag, tone: 'amber' },
      { label: 'Tổng thu', value: formatVND(data?.netRevenue), icon: Wallet, tone: 'emerald' }].map((item) => <div key={item.label} className={`relative flex min-h-28 items-center gap-4 overflow-hidden rounded-[20px] border border-border/60 bg-card p-4 shadow-[0_12px_28px_rgba(32,73,48,0.05)] dark:shadow-none ${item.tone === 'amber' ? 'bg-amber-50/40 dark:bg-amber-950/10' : 'bg-emerald-50/40 dark:bg-emerald-950/10'}`}>
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${item.tone === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}><item.icon className="size-7" /></div>
      <div className="min-w-0"><p className="text-sm text-muted-foreground">{item.label}</p>
      {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 truncate text-xl font-extrabold text-foreground">{item.value ?? '—'}</p>}</div>
    </div>)}
  </div>;
}
