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
}

export interface PriceRuleItem {
  id: string;
  timeRange: string;      // ví dụ: "06:00 - 17:30" hoặc "7h - 18h"
  fixedPrice?: number;    // Giá cố định (₫)
  walkInPrice?: number;   // Giá vãng lai (₫)
  singlePrice?: number;   // Giá đơn (áp dụng cho bảng HSSV hoặc đơn giá chung)
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
  groups: PriceRuleGroup[];
}

export interface CourtTypePricingData {
  courtTypeId: string;
  tabName: string;
  fixedBlocks: FixedTimeBlock[];
  priceTables: PriceTableGroup[];
}
