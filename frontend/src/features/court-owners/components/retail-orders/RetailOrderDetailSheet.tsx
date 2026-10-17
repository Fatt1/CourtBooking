import { Copy, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRetailOrderDetailQuery, retailOrderCode, type RetailOrderDto } from '@/api/retail-orders';
import { formatDateTime, formatVND } from '@/lib/format';
import { getApiErrorMessage } from '@/types/api';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { printRetailReceipt } from './receiptActions';

function ReceiptContent({ receipt }: { receipt: RetailOrderDto }) {
  const copy = async () => { try { await navigator.clipboard.writeText(receipt.id); toast.success('Đã sao chép ID hóa đơn'); } catch { toast.error('Không thể sao chép. Bạn có thể chọn ID đầy đủ bên dưới.'); } };
  return <div className="space-y-5">
    <div><div className="flex items-center justify-between gap-2"><h3 className="text-2xl font-bold text-brand-green dark:text-emerald-400">{retailOrderCode(receipt.id)}</h3>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Đã ghi nhận</span></div>
      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(receipt.createdAt)}</p>
      <p className="mt-2 text-sm font-semibold">{receipt.branchName}</p>
      <div className="mt-2 flex items-start gap-2"><p className="break-all text-[10px] text-muted-foreground">ID: {receipt.id}</p><button onClick={() => void copy()} aria-label="Sao chép ID hóa đơn"><Copy className="size-3.5 shrink-0" /></button></div>
    </div>
    <div className="rounded-xl border border-border p-4"><h4 className="mb-2 text-sm font-semibold">Danh sách sản phẩm ({receipt.items.reduce((sum, item) => sum + item.quantity, 0)} món)</h4>
      <div className="divide-y divide-border">{receipt.items.map((item) => <div key={item.serviceId} className="flex justify-between gap-4 py-3 text-xs">
        <div><p className="font-semibold leading-relaxed">{item.serviceName}</p><p className="mt-1 text-muted-foreground">{formatVND(item.unitPrice)} / {item.unit} × {item.quantity}</p></div><strong className="whitespace-nowrap">{formatVND(item.lineTotal)}</strong>
      </div>)}</div>
    </div>
    <div className="space-y-3 rounded-xl border border-border p-4 text-sm"><p className="flex justify-between"><span>Tiền hàng</span><strong>{formatVND(receipt.subtotal)}</strong></p>
      <p className="flex justify-between"><span>Giảm giá</span><span>{formatVND(receipt.discountAmount)}</span></p>
      <p className="flex justify-between border-t border-dashed border-border pt-3 font-bold"><span>Tổng thu</span><span className="text-xl text-brand-green dark:text-emerald-400">{formatVND(receipt.totalAmount)}</span></p>
    </div>
    <Button variant="outline" className="w-full gap-2" onClick={() => { try { printRetailReceipt(receipt); } catch (err) { toast.error(getApiErrorMessage(err)); } }}><Printer className="size-4" />In hóa đơn</Button>
  </div>;
}

export function RetailOrderDetailSheet({ id, branchId, onClose }: { id: string | null; branchId: string; onClose: () => void }) {
  const large = useMediaQuery('(min-width: 1600px)');
  const detail = useRetailOrderDetailQuery(id, branchId);
  if (!id) return null;
  const body = detail.isPending ? <div className="space-y-4"><Skeleton className="h-12 w-40" /><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>
    : detail.isError ? <div role="alert" className="space-y-3 text-sm"><p>{getApiErrorMessage(detail.error, 'Không thể tải hóa đơn')}</p><Button variant="outline" disabled={detail.isFetching} onClick={() => void detail.refetch()}>Thử lại</Button></div>
      : detail.data ? <ReceiptContent receipt={detail.data} /> : null;
  if (large) return <aside aria-label="Chi tiết hóa đơn" className="sticky top-0 max-h-[calc(100vh-12rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">
    <div className="mb-5 flex items-center justify-between border-b border-border pb-4"><h2 className="text-lg font-bold">Chi tiết hóa đơn</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng chi tiết"><X className="size-4" /></Button></div>{body}
  </aside>;
  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}><SheetContent className="w-full overflow-y-auto bg-card sm:max-w-[500px]">
    <SheetHeader className="mb-5 border-b border-border pb-4 text-left"><SheetTitle>Chi tiết hóa đơn</SheetTitle><SheetDescription>Thông tin hóa đơn đã ghi nhận tại quầy.</SheetDescription></SheetHeader>{body}
  </SheetContent></Sheet>;
}
