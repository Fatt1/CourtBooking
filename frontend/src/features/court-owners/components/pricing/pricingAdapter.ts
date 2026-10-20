import type {
  CourtTypePricingConfigDto,
  FixedTimeBlockDto,
  PriceTableDto,
} from '@/api/pricing';
import type {
  FixedTimeBlock,
  PriceTableGroup,
  PriceRuleGroup,
  PriceRuleItem,
  CourtTypePricingData,
} from './types';

/**
 * Format thời gian từ "06:00:00" -> "06:00"
 */
export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

/**
 * Format khoảng ngày "2026-01-01" -> "01/01"
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

/**
 * Chuyển đổi danh sách thứ đã chọn (1=T2..6=T7, 0=CN) sang dải ngày (from, to) chuẩn backend
 */
export function convertSelectedDaysToRange(selectedDays: number[]): { from: number; to: number } {
  if (!selectedDays || selectedDays.length === 0) {
    return { from: 1, to: 5 };
  }

  // Nếu chọn đủ cả 7 ngày trong tuần
  if (selectedDays.length === 7) {
    return { from: 1, to: 0 }; // 1 (T2) -> 0 (CN)
  }

  // Quy ước thứ tự theo tuần Việt Nam: T2(1) -> T7(6) -> CN(7)
  const vnOrder = (d: number) => (d === 0 ? 7 : d);
  const toDay = (order: number) => (order === 7 ? 0 : order);

  const sorted = [...selectedDays].sort((a, b) => vnOrder(a) - vnOrder(b));
  const minOrder = vnOrder(sorted[0]);
  const maxOrder = vnOrder(sorted[sorted.length - 1]);

  return {
    from: toDay(minOrder),
    to: toDay(maxOrder),
  };
}

/**
 * Chuyển đổi dải ngày (from, to) từ backend sang danh sách các ngày trong tuần (1..6, 0)
 */
export function convertRangeToSelectedDays(from: number, to: number): number[] {
  // Nếu chọn cả tuần (1..0 hoặc 0..6)
  if ((from === 1 && to === 0) || (from === 0 && to === 6)) {
    return [1, 2, 3, 4, 5, 6, 0];
  }

  const isMatching = (day: number) => {
    return from <= to
      ? day >= from && day <= to
      : day >= from || day <= to;
  };

  const weekDays = [1, 2, 3, 4, 5, 6, 0];
  return weekDays.filter((d) => isMatching(d));
}

/**
 * Chuyển đổi DTO Backend sang format giao diện `CourtTypePricingData`
 */
export function mapBackendDtoToUiData(
  dto: CourtTypePricingConfigDto
): CourtTypePricingData {
  // 1. Chuyển đổi Khung giờ bắt buộc
  const fixedBlocks: FixedTimeBlock[] = (dto.fixedTimeBlocks || []).map(
    (b: FixedTimeBlockDto) => {
      const daysText =
        b.dayNames && b.dayNames.length > 0
          ? b.dayNames.join(', ')
          : 'Tất cả các ngày';

      return {
        id: b.id,
        timeRange: `${formatTimeDisplay(b.startTime)} - ${formatTimeDisplay(b.endTime)}`,
        daysText,
        appliedCourtsText:
          b.appliedCourts && b.appliedCourts.length > 0
            ? b.appliedCourts.map((c) => c.courtName).join(', ')
            : 'Tất cả các sân',
      };
    }
  );

  // 2. Chuyển đổi Bảng giá & Gom nhóm quy tắc theo Khoảng ngày & Thứ
  const priceTables: PriceTableGroup[] = (dto.priceTables || []).map(
    (tbl: PriceTableDto) => {
      // Chỉ xem là bảng đơn giá duy nhất (HSSV) nếu tất cả các rules không có giá vãng lai riêng hoặc giá vãng lai bằng 0
      const hasWalkInPrice = (tbl.rules || []).some(
        (r) => r.walkInCustomerPrice && r.walkInCustomerPrice > 0 && r.walkInCustomerPrice !== r.fixedCustomerPrice
      );
      const isHSSV =
        !hasWalkInPrice &&
        (tbl.name.toLowerCase().includes('hssv') ||
          tbl.name.toLowerCase().includes('sinh viên'));

      // Gom nhóm quy tắc
      const groupsMap = new Map<string, PriceRuleGroup>();

      (tbl.rules || []).forEach((rule) => {
        let dateRange = 'Mặc định';
        if (rule.startDate && rule.endDate) {
          dateRange = `${formatDateDisplay(rule.startDate)} - ${formatDateDisplay(rule.endDate)}`;
        } else if (rule.startDate) {
          dateRange = `Từ ${formatDateDisplay(rule.startDate)}`;
        } else if (rule.endDate) {
          dateRange = `Đến ${formatDateDisplay(rule.endDate)}`;
        }

        let dayOfWeekText = rule.dayOfWeekRangeText;
        if (!dayOfWeekText || dayOfWeekText === 'CN - T7') {
          if (
            (rule.dayOfWeekFrom === 0 && rule.dayOfWeekTo === 6) ||
            (rule.dayOfWeekFrom === 1 && rule.dayOfWeekTo === 0)
          ) {
            dayOfWeekText = 'T2 - CN';
          } else if (rule.dayOfWeekFrom === rule.dayOfWeekTo) {
            dayOfWeekText = rule.dayOfWeekFrom === 0 ? 'CN' : `T${rule.dayOfWeekFrom + 1}`;
          } else {
            const fromName = rule.dayOfWeekFrom === 0 ? 'CN' : `T${rule.dayOfWeekFrom + 1}`;
            const toName = rule.dayOfWeekTo === 0 ? 'CN' : `T${rule.dayOfWeekTo + 1}`;
            dayOfWeekText = `${fromName} - ${toName}`;
          }
        }

        const groupKey = `${dateRange}|${dayOfWeekText}`;

        const ruleItem: PriceRuleItem = {
          id: rule.id,
          timeRange: `${formatTimeDisplay(rule.startTime)} - ${formatTimeDisplay(rule.endTime)}`,
          fixedPrice: rule.fixedCustomerPrice,
          walkInPrice: rule.walkInCustomerPrice,
          singlePrice: isHSSV ? rule.fixedCustomerPrice : undefined,
          dayOfWeekFrom: rule.dayOfWeekFrom,
          dayOfWeekTo: rule.dayOfWeekTo,
          startDate: rule.startDate,
          endDate: rule.endDate,
          rawStartTime: rule.startTime,
          rawEndTime: rule.endTime,
        };

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: `grp-${rule.id}`,
            dateRange,
            dayOfWeekText,
            items: [ruleItem],
          });
        } else {
          groupsMap.get(groupKey)!.items.push(ruleItem);
        }
      });

      return {
        id: tbl.id,
        name: tbl.name,
        isHSSV,
        defaultPrice: tbl.defaultPrice,
        defaultWalkInPrice: tbl.defaultWalkInPrice,
        groups: Array.from(groupsMap.values()),
      };
    }
  );

  return {
    courtTypeId: dto.courtTypeId,
    tabName: 'Bảng giá tiêu chuẩn',
    fixedBlocks,
    priceTables,
  };
}
