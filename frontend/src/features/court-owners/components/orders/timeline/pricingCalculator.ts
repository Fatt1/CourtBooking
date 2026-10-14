import type { PriceTableDto } from '@/api/pricing';

export interface SelectedCourtSlot {
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courtTypeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss hoặc HH:mm
  endTime: string; // HH:mm:ss hoặc HH:mm
  priceTableId: string;
  priceTableName: string;
  price: number; // Tính theo VNĐ
  fixedBlockId?: string; // Nếu thuộc blocktime
}

/**
 * Chuyển đổi "HH:mm:ss" hoặc "HH:mm" thành số phút từ 0h
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Chuyển số phút từ 0h thành chuỗi "HH:mm"
 */
export function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Tính giá tiền cho 1 slot sân dựa trên Bảng giá (PriceTable) và thời gian
 */
export function calculateSlotPrice(
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string,
  priceTable?: PriceTableDto
): number {
  if (!priceTable) return 0;

  const startMin = timeToMinutes(startTimeStr);
  const endMin = timeToMinutes(endTimeStr);
  const durationHours = Math.max(0, (endMin - startMin) / 60);

  if (durationHours <= 0) return 0;

  // Lấy thứ trong tuần từ Date (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
  const parts = dateStr.split('-').map(Number);
  const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  const dayOfWeek = dateObj.getDay();

  // Tìm trong danh sách rules của bảng giá
  if (priceTable.rules && priceTable.rules.length > 0) {
    for (const rule of priceTable.rules) {
      // 1. Kiểm tra ngày nếu rule có giới hạn startDate / endDate
      if (rule.startDate && dateStr < rule.startDate) continue;
      if (rule.endDate && dateStr > rule.endDate) continue;

      // 2. Kiểm tra thứ trong tuần (DayOfWeekFrom <= dayOfWeek <= DayOfWeekTo)
      // Lưu ý: nếu DayOfWeekFrom > DayOfWeekTo (ví dụ qua tuần), cần xử lý wrap
      let matchDay = false;
      if (rule.dayOfWeekFrom <= rule.dayOfWeekTo) {
        matchDay = dayOfWeek >= rule.dayOfWeekFrom && dayOfWeek <= rule.dayOfWeekTo;
      } else {
        matchDay = dayOfWeek >= rule.dayOfWeekFrom || dayOfWeek <= rule.dayOfWeekTo;
      }
      if (!matchDay) continue;

      // 3. Kiểm tra khung giờ rule.startTime và rule.endTime
      const ruleStartMin = timeToMinutes(rule.startTime);
      const ruleEndMin = timeToMinutes(rule.endTime);

      // Nếu slot nằm trong khoảng giờ của rule
      if (startMin >= ruleStartMin && endMin <= ruleEndMin) {
        const hourlyRate = rule.walkInCustomerPrice || rule.fixedCustomerPrice || priceTable.defaultPrice;
        return Math.round(hourlyRate * durationHours);
      }
    }
  }

  // Fallback về defaultPrice của bảng giá
  return Math.round((priceTable.defaultPrice || 0) * durationHours);
}

/**
 * Gom các slot đặt sân liền kề (cùng sân, cùng ngày, cùng bảng giá, thời gian nối tiếp nhau)
 * thành 1 slot duy nhất (tương ứng 1 OrderDetail).
 * Nếu khác sân, hoặc cùng sân nhưng cách quãng thời gian -> Tách thành các slot / OrderDetail riêng biệt.
 */
export function mergeAdjacentSlots(slots: SelectedCourtSlot[]): SelectedCourtSlot[] {
  if (!slots || slots.length <= 1) return slots || [];

  // Gom nhóm theo (courtId + date + courtTypeId + priceTableId)
  const groups: Record<string, SelectedCourtSlot[]> = {};

  slots.forEach((slot) => {
    const key = `${slot.courtId}__${slot.date}__${slot.courtTypeId}__${slot.priceTableId}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(slot);
  });

  const mergedResults: SelectedCourtSlot[] = [];

  Object.values(groups).forEach((groupSlots) => {
    // Sắp xếp các slot trong cùng sân/ngày theo giờ bắt đầu tăng dần
    const sorted = [...groupSlots].sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    let currentMerged: SelectedCourtSlot | null = null;

    sorted.forEach((slot) => {
      if (!currentMerged) {
        currentMerged = { ...slot };
        return;
      }

      const currentEndMin = timeToMinutes(currentMerged.endTime);
      const slotStartMin = timeToMinutes(slot.startTime);

      // Nếu slot sau bắt đầu ngay khi slot trước kết thúc (liền kề thời gian)
      if (currentEndMin === slotStartMin) {
        currentMerged.endTime = slot.endTime;
        currentMerged.price += slot.price;
        if (slot.fixedBlockId) {
          currentMerged.fixedBlockId = slot.fixedBlockId;
        }
      } else {
        // Cách quãng thời gian -> Lưu slot trước và bắt đầu slot mới
        mergedResults.push(currentMerged);
        currentMerged = { ...slot };
      }
    });

    if (currentMerged) {
      mergedResults.push(currentMerged);
    }
  });

  // Sắp xếp tổng thể kết quả theo ngày, tên sân, giờ bắt đầu
  return mergedResults.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.courtName !== b.courtName) return a.courtName.localeCompare(b.courtName);
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

/**
 * Tách 1 slot đã được gộp thành các slot con theo bước nhảy (bước nhảy 30p hoặc 60p)
 */
export function decomposeSlotToSteps(
  slot: SelectedCourtSlot,
  stepMinutes: number = 30
): SelectedCourtSlot[] {
  const startMin = timeToMinutes(slot.startTime);
  const endMin = timeToMinutes(slot.endTime);
  const duration = endMin - startMin;

  if (duration <= stepMinutes) {
    return [slot];
  }

  const numSteps = Math.round(duration / stepMinutes);
  const unitPrice = numSteps > 0 ? Math.round(slot.price / numSteps) : slot.price;
  const steps: SelectedCourtSlot[] = [];

  for (let m = startMin; m + stepMinutes <= endMin; m += stepMinutes) {
    steps.push({
      ...slot,
      startTime: `${minutesToTimeString(m)}:00`,
      endTime: `${minutesToTimeString(m + stepMinutes)}:00`,
      price: unitPrice,
    });
  }

  return steps;
}

