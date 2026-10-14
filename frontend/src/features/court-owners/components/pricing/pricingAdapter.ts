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
      const isHSSV =
        tbl.name.toLowerCase().includes('hssv') ||
        tbl.name.toLowerCase().includes('sinh viên');

      // Gom nhóm quy tắc
      const groupsMap = new Map<string, PriceRuleGroup>();

      (tbl.rules || []).forEach((rule) => {
        let dateRange = 'Mặc định';
        if (rule.startDate && rule.endDate) {
          dateRange = `${formatDateDisplay(rule.startDate)} - ${formatDateDisplay(rule.endDate)}`;
        }

        const dayOfWeekText =
          rule.dayOfWeekRangeText ||
          (rule.dayOfWeekFrom === rule.dayOfWeekTo
            ? `Thứ ${rule.dayOfWeekFrom + 1}`
            : `T${rule.dayOfWeekFrom + 1} - T${rule.dayOfWeekTo + 1}`);

        const groupKey = `${dateRange}|${dayOfWeekText}`;

        const ruleItem: PriceRuleItem = {
          id: rule.id,
          timeRange: `${formatTimeDisplay(rule.startTime)} - ${formatTimeDisplay(rule.endTime)}`,
          fixedPrice: rule.fixedCustomerPrice,
          walkInPrice: rule.walkInCustomerPrice,
          singlePrice: isHSSV ? rule.fixedCustomerPrice : undefined,
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
