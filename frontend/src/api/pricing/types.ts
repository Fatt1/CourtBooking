export interface AppliedCourtDto {
  courtId: string;
  courtName: string;
}

export interface FixedTimeBlockDto {
  id: string;
  courtTypeId: string;
  startTime: string; // "17:00:00"
  endTime: string;   // "19:00:00"
  daysOfWeekMask: number;
  daysOfWeek: number[]; // [1, 2, 3, 4, 5, 6, 0]
  dayNames: string[];
  appliedCourts: AppliedCourtDto[];
}

export interface PriceTableRuleDto {
  id: string;
  priceTableId: string;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeekFrom: number;
  dayOfWeekTo: number;
  dayOfWeekRangeText?: string;
  startTime: string; // "06:00:00"
  endTime: string;   // "17:00:00"
  fixedCustomerPrice: number;
  walkInCustomerPrice: number;
}

export interface PriceTableDto {
  id: string;
  courtTypeId: string;
  name: string;
  isActive: boolean;
  defaultPrice: number;
  rules: PriceTableRuleDto[];
}

export interface CourtTypePricingConfigDto {
  courtTypeId: string;
  branchId: string;
  courtTypeName: string;
  minutesConfig: number; // 30 hoặc 60 phút
  availableCourts: AppliedCourtDto[];
  fixedTimeBlocks: FixedTimeBlockDto[];
  priceTables: PriceTableDto[];
}
