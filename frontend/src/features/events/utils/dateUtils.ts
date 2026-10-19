/**
 * Tiện ích định dạng ngày giờ và tiền tệ cho module Sự kiện (Events)
 */

export function formatEventPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

const dayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/**
 * Phân tích chuỗi ngày (YYYY-MM-DD hoặc ISO string)
 */
export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // Format YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 2000) {
      return new Date(y, m, d);
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
    return null;
  }
  return d;
}

/**
 * Lấy số ngày (2 chữ số, ví dụ "10", "25")
 */
export function getDayNumber(dateStr?: string | null, fallback = '25'): string {
  const d = parseDateOnly(dateStr);
  if (!d) return fallback;
  return d.getDate().toString().padStart(2, '0');
}

/**
 * Lấy tháng (ví dụ "THÁNG 10")
 */
export function getMonthText(dateStr?: string | null, fallback = 'THÁNG 10'): string {
  const d = parseDateOnly(dateStr);
  if (!d) return fallback;
  return `THÁNG ${d.getMonth() + 1}`;
}

/**
 * Lấy tên thứ và ngày tháng: ví dụ "Thứ Bảy, 25/10/2026"
 */
export function getFullDateText(dateStr?: string | null, fallback = 'Thứ Bảy, 25/10/2026'): string {
  const d = parseDateOnly(dateStr);
  if (!d) return fallback;
  const dayName = dayNamesVi[d.getDay()];
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

/**
 * Rút gọn chuỗi giờ (08:00:00 -> 08:00)
 */
export function formatTimeStr(timeStr?: string | null, fallback = '08:00'): string {
  if (!timeStr) return fallback;
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

/**
 * Hiển thị khung giờ trận đấu: "08:00 - 12:00"
 */
export function getTimeRangeText(
  startStr?: string | null,
  endStr?: string | null,
  fallback = '08:00 - 12:00'
): string {
  if (!startStr && !endStr) return fallback;
  const s = formatTimeStr(startStr, '08:00');
  const e = formatTimeStr(endStr, '12:00');
  return `${s} - ${e}`;
}

/**
 * Dòng hiển thị thời gian kết hợp trên Card:
 * ví dụ "08:00 - 12:00 · Thứ Bảy, 25/10/2026"
 */
export function getCardTimeText(
  dateStr?: string | null,
  startStr?: string | null,
  endStr?: string | null,
  fallback = '08:00 - 12:00 · Thứ Bảy, 25/10/2026'
): string {
  const timeRange = getTimeRangeText(startStr, endStr, '08:00 - 12:00');
  const dateText = getFullDateText(dateStr, 'Thứ Bảy, 25/10/2026');
  return `${timeRange} · ${dateText}`;
}

/**
 * Kiểm tra xem thời gian mua vé đã hết hạn chưa.
 * Điều kiện: Chỉ có thể mua vé khi thời gian hiện tại bé hơn thời gian giờ bắt đầu trận đấu.
 */
export function isEventBookingExpired(dateStr?: string | null, startTimeStr?: string | null): boolean {
  if (!dateStr || !startTimeStr) return false;
  const parts = dateStr.split('T')[0].split('-');
  const timeParts = startTimeStr.split(':');
  if (parts.length === 3 && timeParts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const h = parseInt(timeParts[0], 10);
    const min = parseInt(timeParts[1], 10);
    const eventStartDate = new Date(y, m, d, h, min, 0);
    return Date.now() >= eventStartDate.getTime();
  }
  return false;
}

/**
 * Định dạng trình độ người tham gia (Skill Level):
 * Ví dụ: "Yếu - Trung bình", "Cơ bản", hoặc "Mọi trình độ"
 */
export function formatSkillLevel(from?: string | null, to?: string | null): string {
  const f = from?.trim();
  const t = to?.trim();
  if (f && t) {
    if (f.toLowerCase() === t.toLowerCase()) return f;
    return `${f} - ${t}`;
  }
  if (f) return f;
  if (t) return t;
  return 'Mọi trình độ';
}
