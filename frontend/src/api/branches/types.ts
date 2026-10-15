export type { PagedList } from '@/types/api';

/**
 * Kiểu dữ liệu danh sách chi nhánh phía Chủ sân (Court Owner)
 */
export interface OwnerBranchListItem {
  id: string;
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  averageRating: number | null;
}

// Alias tương thích với useBranchStore
export type OwnerBranchItem = OwnerBranchListItem;

/**
 * Chi tiết chi nhánh phía Chủ sân (Court Owner)
 */
export interface OwnerBranchDetail {
  id: string;
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  ggMapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  openTime: string;
  closeTime: string;
  policy?: string | null;
  isActive: boolean;
  qrImage?: { key: string; id: string };
  accountNumber?: string;
  accountName?: string;
  sports?: Array<{ id: string; name: string }>;
  images?: Array<{ key: string; id: string }>;
  averageRating?: number | null;
}

/**
 * Payload tạo chi nhánh mới
 */
export interface CreateBranchPayload {
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  ggMapUrl: string;
  openTime: string;
  closeTime: string;
  qrImageId: string;
  accountNumber: string;
  accountName: string;
  sportTypeIds: string[];
  policy?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageIds: string[];
}

/**
 * Payload cập nhật chi nhánh
 */
export interface UpdateBranchPayload extends CreateBranchPayload {
  id: string;
}

/**
 * Payload cập nhật trạng thái hoạt động (bật/tắt) của chi nhánh
 */
export interface UpdateBranchStatusPayload {
  id: string;
  isActive: boolean;
}

/**
 * Môn thể thao thuộc chi nhánh
 */
export interface BranchSportDto {
  id: string;
  name: string;
}

/**
 * Dữ liệu chi nhánh tìm kiếm phía người dùng công khai (Public)
 */
export interface PublicBranchListItemDto {
  id: string;
  name: string;
  province: string;
  district: string;
  street: string;
  latitude?: number | null;
  longitude?: number | null;
  coverImage?: {
    id: string;
    url: string;
  } | null;
  sports: BranchSportDto[];
  openTime: string;
  closeTime: string;
  reviewAverage: number;
  distanceKm?: number | null;
  availableCourtCount?: number | null;
  minPrice: number;
  maxPrice: number;
}

/**
 * Tham số tìm kiếm chi nhánh công khai
 */
export interface SearchBranchesParams {
  search?: string;
  province?: string;
  district?: string;
  sportTypeIds?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  latitude?: number;
  longitude?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Trạng thái slot trên timeline đặt sân
 */
export enum TimelineSlotStatus {
  Available = 0,
  Booked = 1,
  Locked = 2,
  Event = 3,
}

export interface OccupiedSlotDto {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  status: TimelineSlotStatus;
  orderCode?: string | null;
  customerName?: string | null;
  title?: string | null;
}

export interface CourtTimelineItemDto {
  courtId: string;
  courtTypeId: string;
  courtTypeName: string;
  courtName: string;
  isMaintenance: boolean;
}

export interface OneTimeBookingScheduleDto {
  branchId: string;
  branchName: string;
  date: string;
  openTime: string;
  closeTime: string;
  courts: CourtTimelineItemDto[];
  occupiedSlots: OccupiedSlotDto[];
}

export interface OccupiedSlotDetailDto {
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  status: TimelineSlotStatus;
  orderCode?: string | null;
  customerName?: string | null;
  title?: string | null;
}

export interface CourtTypeScheduleItemDto {
  courtTypeId: string;
  courtTypeName: string;
  courts: CourtTimelineItemDto[];
  occupiedSlots: OccupiedSlotDetailDto[];
}

export interface DayOfWeekScheduleDto {
  dayOfWeek: number;
  dayOfWeekNumber: number; // 2 -> 8 (CN)
  dayOfWeekName: string; // "Thứ 2", "Thứ 3", ..., "Chủ nhật"
  courtTypes: CourtTypeScheduleItemDto[];
}

export interface TimeBookingScheduleDto {
  branchId: string;
  branchName: string;
  fromDate: string;
  toDate: string;
  openTime: string;
  closeTime: string;
  schedules: DayOfWeekScheduleDto[];
}

