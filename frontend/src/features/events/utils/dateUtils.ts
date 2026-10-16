/**
 * Tiện ích định dạng ngày giờ và tiền tệ cho module Sự kiện (Events)
 */

export function formatEventPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function parseValidDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
    return null;
  }
  return d;
}

const dayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/**
 * Lấy số ngày (2 chữ số, ví dụ "09", "18")
 */
export function getDayNumber(dateStr?: string | null, fallback = '18'): string {
  const d = parseValidDate(dateStr);
  if (!d) return fallback;
  return d.getDate().toString().padStart(2, '0');
}

/**
 * Lấy tháng (ví dụ "THÁNG 10")
 */
export function getMonthText(dateStr?: string | null, fallback = 'THÁNG 10'): string {
  const d = parseValidDate(dateStr);
  if (!d) return fallback;
  return `THÁNG ${d.getMonth() + 1}`;
}

/**
 * Lấy tên thứ và ngày tháng: ví dụ "Thứ Bảy, 10/10/2026"
 */
export function getFullDateText(dateStr?: string | null, fallback = 'Thứ Bảy, 18/10/2026'): string {
  const d = parseValidDate(dateStr);
  if (!d) return fallback;
  const dayName = dayNamesVi[d.getDay()];
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

/**
 * Lấy khung giờ: ví dụ "08:00 - 12:00"
 */
export function getTimeRangeText(
  startStr?: string | null,
  endStr?: string | null,
  fallback = '08:00 - 12:00'
): string {
  const dStart = parseValidDate(startStr);
  const dEnd = parseValidDate(endStr);
  if (!dStart || !dEnd) return fallback;

  const startH = dStart.getHours().toString().padStart(2, '0');
  const startM = dStart.getMinutes().toString().padStart(2, '0');
  const endH = dEnd.getHours().toString().padStart(2, '0');
  const endM = dEnd.getMinutes().toString().padStart(2, '0');
  return `${startH}:${startM} - ${endH}:${endM}`;
}

/**
 * Lấy dòng hiển thị thời gian kết hợp trên Card:
 * ví dụ "18:30 · Thứ Sáu, 09/10/2026"
 */
export function getCardTimeText(
  startStr?: string | null,
  fallback = '08:00 · Thứ Bảy, 18/10/2026'
): string {
  const d = parseValidDate(startStr);
  if (!d) return fallback;
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const dayName = dayNamesVi[d.getDay()];
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${h}:${m} · ${dayName}, ${dd}/${mm}/${yyyy}`;
}
