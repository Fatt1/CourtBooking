import { CommonTable, type ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
import { retailOrderCode, type RetailOrderListItemDto } from '@/api/retail-orders';
import { formatDateTime, formatVND } from '@/lib/format';

export function RetailOrderTable({ items, loading, selectedId, onSelect }: {
  items: RetailOrderListItemDto[]; loading: boolean; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const columns: ColumnDef<RetailOrderListItemDto>[] = [
    { header: 'MÃ HÓA ĐƠN', cell: (item) => <span title={item.id} data-selected={selectedId === item.id} className={`whitespace-nowrap font-semibold ${selectedId === item.id ? 'text-brand-green' : ''}`}>{retailOrderCode(item.id)}</span> },
    { header: 'THỜI GIAN', cell: (item) => <span className="whitespace-nowrap text-xs">{formatDateTime(item.createdAt)}</span> },
    { header: 'SỐ LƯỢNG', cell: (item) => item.totalQuantity },
    { header: 'TIỀN HÀNG', cell: (item) => formatVND(item.subtotal) },
    { header: 'GIẢM GIÁ', cell: (item) => formatVND(item.discountAmount) },
    { header: 'TỔNG THU', cell: (item) => <strong className="whitespace-nowrap text-brand-green dark:text-emerald-400">{formatVND(item.totalAmount)}</strong> },
    { header: '', cell: (item) => <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(item.id); }} aria-label={`Xem ${retailOrderCode(item.id)}`}>Xem</Button> },
  ];
  return <div className="overflow-x-auto"><CommonTable columns={columns} data={items} isLoading={loading}
    onRowClick={(item) => onSelect(item.id)} containerClassName="min-w-[780px] [&_tbody_tr:has([data-selected=true])]:bg-brand-green/5"
    emptyTitle="Không tìm thấy hóa đơn" emptyDescription="Chưa có hóa đơn phù hợp với chi nhánh, khoảng ngày hoặc mã đã chọn." /></div>;
}
