import { Minus, Plus, ShoppingBasket, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVND } from '@/lib/format';
import type { PosCartLine } from '../../types/pos';

interface Props {
  lines: PosCartLine[];
  subtotal: number;
  discount: string;
  discountAmount: number;
  locked: boolean;
  paying: boolean;
  canPay: boolean;
  error: string;
  unavailable: Set<string>;
  onQuantity: (id: string, quantity: number) => void;
  onDiscount: (value: string) => void;
  onClear: () => void;
  onPay: () => void;
}

export function PosCart(props: Props) {
  const quantity = props.lines.reduce((sum, line) => sum + line.quantity, 0);
  return <aside className="flex min-h-[540px] flex-col rounded-2xl border border-border bg-card lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)]" aria-label="Giỏ hàng bán lẻ">
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h2 className="text-sm font-bold">Hóa đơn mới</h2>
      <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs text-destructive" disabled={!props.lines.length || props.locked}
        onClick={props.onClear}><Trash2 className="size-3.5" /> Hủy</Button>
    </div>
    <div className="min-h-40 flex-1 overflow-y-auto px-5">
      {!props.lines.length ? <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-muted-foreground">
        <ShoppingBasket className="size-9 opacity-50" /><p className="text-xs">Chọn sản phẩm để bắt đầu bán hàng</p>
      </div> : props.lines.map((line) => <div key={line.serviceId} className="border-b border-border/60 py-4 last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold leading-relaxed">{line.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{formatVND(line.unitPrice)} / {line.unit}</p>
            {props.unavailable.has(line.serviceId) && <p className="mt-1 text-xs text-destructive">Sản phẩm không còn được bán. Hãy xóa khỏi giỏ.</p>}
          </div>
          <p className="whitespace-nowrap text-xs font-bold">{formatVND(Math.round(line.unitPrice * 100) * line.quantity / 100)}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center rounded-md border border-border">
            <button type="button" disabled={props.locked} aria-label={`Giảm ${line.name}`} onClick={() => props.onQuantity(line.serviceId, line.quantity - 1)} className="p-1.5 hover:bg-muted disabled:opacity-40"><Minus className="size-3" /></button>
            <span className="min-w-7 text-center text-xs font-semibold">{line.quantity}</span>
            <button type="button" disabled={props.locked || props.unavailable.has(line.serviceId) || line.quantity >= 9999} aria-label={`Tăng ${line.name}`} onClick={() => props.onQuantity(line.serviceId, line.quantity + 1)} className="p-1.5 hover:bg-muted disabled:opacity-40"><Plus className="size-3" /></button>
          </div>
          <button type="button" disabled={props.locked} aria-label={`Xóa ${line.name}`} onClick={() => props.onQuantity(line.serviceId, 0)} className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40"><Trash2 className="size-3.5" /></button>
        </div>
      </div>)}
    </div>
    <div className="space-y-3 border-t border-border p-5">
      <div className="flex justify-between text-xs"><span>Tạm tính ({quantity} món)</span><strong>{formatVND(props.subtotal)}</strong></div>
      <div className="flex items-center justify-between gap-3 text-xs"><label htmlFor="pos-discount">Giảm giá (VNĐ)</label>
        <Input id="pos-discount" type="number" min={0} max={props.subtotal} step="0.01" value={props.discount}
          disabled={props.locked || !props.lines.length} onChange={(e) => props.onDiscount(e.target.value)} className="h-8 w-28 text-right text-xs" />
      </div>
      <div className="flex items-center justify-between py-1 font-bold text-brand-green dark:text-emerald-400"><span>Tổng thu</span><span>{formatVND(Math.max(0, props.subtotal - props.discountAmount))}</span></div>
      {props.error && <p role="alert" className="text-xs leading-relaxed text-destructive">{props.error}</p>}
      <Button className="h-11 w-full gap-2 rounded-lg bg-brand-green text-xs font-bold text-white hover:bg-brand-green-hover" disabled={!props.canPay || props.paying} onClick={props.onPay}>
        {props.paying && <Loader2 className="size-4 animate-spin" />}
        {props.paying ? 'Đang thanh toán...' : 'Thanh toán & Đóng Bill'}
      </Button>
    </div>
  </aside>;
}
