/**
 * Tiện ích định dạng dữ liệu dùng chung toàn hệ thống (Format Utilities)
 * Hỗ trợ chuyển đổi múi giờ UTC từ server sang múi giờ chuẩn Việt Nam (Asia/Ho_Chi_Minh / UTC+7) ở Frontend.
 */

/**
 * Múi giờ chuẩn Việt Nam (UTC+7)
 */
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

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
 * Chuyển đổi an toàn chuỗi ngày giờ từ server (UTC) sang Date object.
 * Xử lý mọi định dạng:
 * - Chuẩn ISO có 'Z': "2026-10-23T17:04:13.123Z"
 * - Chuẩn ISO không 'Z' từ C# / SQL Server: "2026-10-23T17:04:13" hoặc "2026-10-23T17:04:13.1234567"
 * - Chuỗi có khoảng trắng: "2026-10-23 17:04:13"
 * Mọi chuỗi ngày giờ không gắn múi giờ rõ ràng đều được chuẩn hóa là UTC ('Z')
 * để JavaScript luôn diễn giải đúng thời điểm gốc UTC trước khi chuyển đổi sang múi giờ Việt Nam.
 */
export function toUtcDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  if (typeof date === 'string') {
    let s = date.trim();
    if (!s) return null;

    // Chuẩn hóa YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T');
    }

    const tIndex = s.indexOf('T');
    if (tIndex !== -1) {
      // Cắt bớt phần phân đoạn giây nếu nhiều hơn 3 chữ số để tương thích mọi trình duyệt (Safari/Mobile)
      s = s.replace(/\.(\d{3})\d+/, '.$1');

      const timePart = s.slice(tIndex);
      const hasTz = timePart.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(timePart);
      if (!hasTz) {
        s += 'Z';
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Định dạng ngày sang chuẩn Việt Nam (DD/MM/YYYY).
 * Tự động chuyển đổi UTC sang múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 * Ví dụ: "2026-10-23T17:04:13Z" -> "24/10/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = toUtcDate(date);
    if (!d) return String(date);
    return d.toLocaleDateString('vi-VN', {
      timeZone: VN_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
}

/**
 * Định dạng giờ sang chuẩn Việt Nam (HH:mm).
 * Tự động chuyển đổi UTC sang múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 * Ví dụ: "2026-10-23T17:04:13Z" -> "00:04"
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = toUtcDate(date);
    if (!d) return String(date);
    return d.toLocaleTimeString('vi-VN', {
      timeZone: VN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return String(date);
  }
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (HH:mm - DD/MM/YYYY).
 * Tự động chuyển đổi UTC sang múi giờ Việt Nam (Asia/Ho_Chi_Minh / UTC+7).
 * Ví dụ: "2026-10-23T17:04:13Z" -> "00:04 - 24/10/2026"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = toUtcDate(date);
    if (!d) return String(date);
    const time = d.toLocaleTimeString('vi-VN', {
      timeZone: VN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const day = d.toLocaleDateString('vi-VN', {
      timeZone: VN_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${time} - ${day}`;
  } catch {
    return String(date);
  }
}

/**
 * Định dạng ngày giờ chi tiết bao gồm giây (HH:mm:ss DD/MM/YYYY).
 */
export function formatDateTimeFull(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = toUtcDate(date);
    if (!d) return String(date);
    const time = d.toLocaleTimeString('vi-VN', {
      timeZone: VN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const day = d.toLocaleDateString('vi-VN', {
      timeZone: VN_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${time} ${day}`;
  } catch {
    return String(date);
  }
}

/**
 * Tính số giây còn lại từ hiện tại tới mốc hết hạn UTC (dùng cho countdown timer).
 */
export function getRemainingSeconds(expiresAt?: string | Date | null): number {
  if (!expiresAt) return 0;
  const d = toUtcDate(expiresAt);
  if (!d) return 0;
  return Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
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
