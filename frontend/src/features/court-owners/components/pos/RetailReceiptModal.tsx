import { CheckCircle2 } from 'lucide-react';
import { OwnerModal } from '../shared';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatVND } from '@/lib/format';
import type { RetailOrderDto } from '@/api/retail-orders';
import { Link } from 'react-router-dom';

export function RetailReceiptModal({ receipt, onClose }: { receipt: RetailOrderDto | null; onClose: () => void }) {
  return <OwnerModal open={Boolean(receipt)} onOpenChange={(open) => { if (!open) onClose(); }} title="Đã tạo hóa đơn" hideFooter icon={<CheckCircle2 className="size-5" />}>
    {receipt && <div className="space-y-4">
      <div className="space-y-1 text-xs text-muted-foreground"><p className="font-semibold text-foreground">{receipt.branchName}</p>
        <p>Mã hóa đơn: {receipt.id}</p><p>{formatDateTime(receipt.createdAt)}</p>
      </div>
      <div className="divide-y divide-border">{receipt.items.map((item) => <div key={item.serviceId} className="flex justify-between gap-3 py-3 text-xs">
        <div><p className="font-semibold">{item.serviceName}</p><p className="mt-1 text-muted-foreground">{item.quantity} × {formatVND(item.unitPrice)}</p></div>
        <strong className="whitespace-nowrap">{formatVND(item.lineTotal)}</strong>
      </div>)}</div>
      <div className="space-y-2 border-t border-border pt-3 text-xs"><p className="flex justify-between"><span>Tạm tính</span><span>{formatVND(receipt.subtotal)}</span></p>
        <p className="flex justify-between"><span>Giảm giá</span><span>{formatVND(receipt.discountAmount)}</span></p>
        <p className="flex justify-between text-base font-bold text-brand-green dark:text-emerald-400"><span>Tổng thu</span><span>{formatVND(receipt.totalAmount)}</span></p>
      </div>
      <Button onClick={onClose} className="w-full bg-brand-green text-white hover:bg-brand-green-hover">Bán đơn tiếp theo</Button>
      <Button variant="outline" asChild className="w-full"><Link to={`/owner/pos/history?orderId=${receipt.id}`} onClick={onClose}>Xem trong lịch sử</Link></Button>
    </div>}
  </OwnerModal>;
}
