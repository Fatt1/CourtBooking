/**
 * Tiện ích định dạng dữ liệu dùng chung toàn hệ thống (Format Utilities)
 */

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam Đồng (VND).
 * Ví dụ: 150000 -> "150.000đ"
 */
export function formatVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0đ';
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (isNaN(numericAmount)) return '0đ';
  return `${numericAmount.toLocaleString('vi-VN')}đ`;
}

/**
 * Định dạng ngày sang chuẩn Việt Nam (DD/MM/YYYY).
 * Ví dụ: "2026-10-12T00:00:00" -> "12/10/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (HH:mm - DD/MM/YYYY).
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} - ${day}`;
  } catch {
    return String(date);
  }
}

/**
 * Định dạng số điện thoại Việt Nam chuẩn gọn.
 * Ví dụ: "0901234567" -> "0901 234 567"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
