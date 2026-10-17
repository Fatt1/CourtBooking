import type { RetailOrderDto, RetailOrderListItemDto } from '@/api/retail-orders';
import { retailOrderCode } from '@/api/retail-orders';
import { formatDateTime, formatVND } from '@/lib/format';

export function exportRetailOrders(items: RetailOrderListItemDto[], from: string, to: string) {
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  const rows = [['Mã hiển thị', 'ID đầy đủ', 'Chi nhánh', 'Thời gian', 'Số lượng', 'Tiền hàng', 'Giảm giá', 'Tổng thu'],
    ...items.map((item) => [retailOrderCode(item.id), item.id, item.branchName, formatDateTime(item.createdAt), item.totalQuantity, item.subtotal, item.discountAmount, item.totalAmount])];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `hoa-don-ban-le-${from}-${to}.csv`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printRetailReceipt(receipt: RetailOrderDto) {
  const popup = window.open('', '_blank', 'width=600,height=800');
  if (!popup) throw new Error('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup để in hóa đơn.');
  popup.opener = null;
  const doc = popup.document;
  doc.title = retailOrderCode(receipt.id);
  const style = doc.createElement('style');
  style.textContent = 'body{font:14px Arial,sans-serif;color:#18231c;max-width:650px;margin:32px auto;padding:16px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #ddd}p{line-height:1.5}h1{font-size:22px}@media print{body{margin:0}}';
  doc.head.appendChild(style);
  const add = (tag: string, text: string, parent: HTMLElement = doc.body) => { const node = doc.createElement(tag); node.textContent = text; parent.appendChild(node); return node; };
  add('h1', 'HÓA ĐƠN BÁN LẺ'); add('p', receipt.branchName); add('p', `Mã: ${receipt.id}`); add('p', formatDateTime(receipt.createdAt));
  const table = add('table', ''); const head = add('tr', '', table);
  ['Sản phẩm', 'Đơn giá', 'SL', 'Thành tiền'].forEach((text) => add('th', text, head));
  receipt.items.forEach((item) => { const row = add('tr', '', table); [item.serviceName, formatVND(item.unitPrice), String(item.quantity), formatVND(item.lineTotal)].forEach((text) => add('td', text, row)); });
  add('p', `Tiền hàng: ${formatVND(receipt.subtotal)}`); add('p', `Giảm giá: ${formatVND(receipt.discountAmount)}`); add('h2', `Tổng thu: ${formatVND(receipt.totalAmount)}`);
  popup.focus(); popup.print();
}
