import type { AppliedCourtDto } from '@/api/pricing';

export interface CourtTypeOption {
  id: string;
  name: string;
  sport: string;
  totalCourts?: number;
}

export interface FixedTimeBlock {
  id: string;
  timeRange: string; // ví dụ: "17h30 - 19h30"
  daysText: string;  // ví dụ: "T7, CN"
  appliedCourtsText?: string; // ví dụ: "Áp dụng: Sân 1, Sân 2"
  rawStartTime?: string;      // ví dụ: "17:00"
  rawEndTime?: string;        // ví dụ: "19:00"
  daysOfWeek?: number[];      // [1, 2, ..., 0]
  courtIds?: string[];        // ["id1", "id2"]
  appliedCourts?: AppliedCourtDto[];
}

export interface FixedBlockToEdit {
  id: string;
  startTime: string; // "17:00"
  endTime: string;   // "19:00"
  selectedDays: number[];
  courtIds: string[];
}

export interface PriceRuleItem {
  id: string;
  timeRange: string;      // ví dụ: "06:00 - 17:30" hoặc "7h - 18h"
  fixedPrice?: number;    // Giá cố định (₫)
  walkInPrice?: number;   // Giá vãng lai (₫)
  singlePrice?: number;   // Giá đơn (áp dụng cho bảng HSSV hoặc đơn giá chung)
  dayOfWeekFrom?: number; // Thứ bắt đầu (0 = CN, 1 = T2, ..., 6 = T7)
  dayOfWeekTo?: number;   // Thứ kết thúc (0 = CN, 1 = T2, ..., 6 = T7)
  startDate?: string | null;
  endDate?: string | null;
  rawStartTime?: string;
  rawEndTime?: string;
}

export interface PriceRuleGroup {
  id: string;
  dateRange: string;      // ví dụ: "Mặc định" hoặc "01/01 - 31/12"
  dayOfWeekText: string;  // ví dụ: "T2 - T6" hoặc "T7 - CN"
  items: PriceRuleItem[];
}

export interface PriceTableGroup {
  id: string;
  name: string;           // ví dụ: "Bảng giá", "Đặc quyền HSSV"
  isHSSV?: boolean;       // nếu true -> hiển thị cột "GIÁ" duy nhất thay vì 2 cột cố định/vãng lai
  defaultPrice?: number;
  defaultWalkInPrice?: number;
  groups: PriceRuleGroup[];
}

export interface CourtTypePricingData {
  courtTypeId: string;
  tabName: string;
  fixedBlocks: FixedTimeBlock[];
  priceTables: PriceTableGroup[];
}
