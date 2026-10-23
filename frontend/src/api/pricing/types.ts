import { CourtStatus } from '../courts/types';

export interface AppliedCourtDto {
  courtId: string;
  courtName: string;
  status?: CourtStatus;
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
  defaultWalkInPrice: number;
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

// ── Payloads cho Mutations ──

export interface CreatePriceTablePayload {
  branchId: string;
  courtTypeId: string;
  name: string;
  defaultPrice: number;
  defaultWalkInPrice: number;
  isActive?: boolean;
}

export interface UpdatePriceTablePayload {
  branchId: string;
  priceTableId: string;
  name: string;
  defaultPrice: number;
  defaultWalkInPrice: number;
  isActive: boolean;
}

export interface DeletePriceTablePayload {
  branchId: string;
  priceTableId: string;
}

export interface CreatePriceTableRulePayload {
  branchId: string;
  priceTableId: string;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeekFrom: number;
  dayOfWeekTo: number;
  startTime: string; // "06:00:00"
  endTime: string;   // "12:00:00"
  fixedCustomerPrice: number;
  walkInCustomerPrice: number;
}

export interface UpdatePriceTableRulePayload {
  branchId: string;
  priceTableId: string;
  ruleId: string;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeekFrom: number;
  dayOfWeekTo: number;
  startTime: string;
  endTime: string;
  fixedCustomerPrice: number;
  walkInCustomerPrice: number;
}

export interface DeletePriceTableRulePayload {
  branchId: string;
  priceTableId: string;
  ruleId: string;
}

export interface CreateFixedTimeBlockPayload {
  branchId: string;
  courtTypeId: string;
  startTime: string; // "17:00:00"
  endTime: string;   // "19:00:00"
  daysOfWeek: number[];
  courtIds: string[];
}

export interface UpdateFixedTimeBlockPayload {
  branchId: string;
  blockId: string;
  startTime: string; // "17:00:00"
  endTime: string;   // "19:00:00"
  daysOfWeek: number[];
  courtIds: string[];
}

export interface DeleteFixedTimeBlockPayload {
  branchId: string;
  blockId: string;
}
