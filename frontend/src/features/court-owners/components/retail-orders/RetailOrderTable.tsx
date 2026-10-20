import { CommonTable, type ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
import { retailOrderCode, type RetailOrderListItemDto } from '@/api/retail-orders';
import { formatDateTime, formatVND } from '@/lib/format';
import { Clock3, Eye, FileText } from 'lucide-react';

export function RetailOrderTable({ items, loading, selectedId, onSelect }: {
  items: RetailOrderListItemDto[]; loading: boolean; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const columns: ColumnDef<RetailOrderListItemDto>[] = [
    { header: 'MÃ HÓA ĐƠN', cell: (item) => <span title={item.id} data-selected={selectedId === item.id} className="flex items-center gap-3 whitespace-nowrap font-bold"><span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><FileText className="size-5" /></span>{retailOrderCode(item.id)}</span> },
    { header: 'THỜI GIAN', cell: (item) => <span className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground"><Clock3 className="size-4" />{formatDateTime(item.createdAt)}</span> },
    { header: 'SỐ LƯỢNG', cell: (item) => <span className="font-medium">{item.totalQuantity}</span> },
    { header: 'TIỀN HÀNG', cell: (item) => <span className="whitespace-nowrap">{formatVND(item.subtotal)}</span> },
    { header: 'GIẢM GIÁ', cell: (item) => <span className="whitespace-nowrap">{formatVND(item.discountAmount)}</span> },
    { header: 'TỔNG THU', cell: (item) => <strong className="inline-block min-w-28 rounded-xl bg-emerald-50 px-3 py-2 text-center whitespace-nowrap text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{formatVND(item.totalAmount)}</strong> },
    { header: '', cell: (item) => <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-card shadow-sm" onClick={(e) => { e.stopPropagation(); onSelect(item.id); }} aria-label={`Xem ${retailOrderCode(item.id)}`}><Eye className="size-4" />Xem</Button> },
  ];
  return <div className="overflow-x-auto"><CommonTable columns={columns} data={items} isLoading={loading}
    onRowClick={(item) => onSelect(item.id)} containerClassName="min-w-[780px] border-0 bg-transparent shadow-none [&_thead_tr]:bg-emerald-50/70 dark:[&_thead_tr]:bg-emerald-950/30 [&_tbody_tr]:h-[76px] [&_tbody_tr:has([data-selected=true])]:bg-brand-green/5"
    emptyTitle="Không tìm thấy hóa đơn" emptyDescription="Chưa có hóa đơn phù hợp với chi nhánh, khoảng ngày hoặc mã đã chọn." /></div>;
}
