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
  mapUrl?: string | null;
  ggMapUrl?: string;
  latitude: number;
  longitude: number;
  openTime: string;
  closeTime: string;
  policy?: string | null;
  description?: string | null;
  isActive: boolean;
  qrImage?: { key: string; id: string };
  accountNumber?: string;
  accountName?: string;
  bankName?: string | null;
  bankCode?: string | null;
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
  mapUrl?: string;
  ggMapUrl?: string;
  openTime: string;
  closeTime: string;
  qrImageId: string;
  accountNumber: string;
  accountName: string;
  bankName?: string | null;
  bankCode?: string | null;
  sportTypeIds: string[];
  policy?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
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
  fullAddress?: string;
  province?: string;
  district?: string;
  street?: string;
  latitude?: number | null;
  longitude?: number | null;
  coverImage?: {
    id?: string;
    url?: string;
    key?: string;
  } | null;
  sports: BranchSportDto[];
  openTime: string;
  closeTime: string;
  reviewAverage: number;
  distanceKm?: number | null;
  availableCourtCount?: number | null;
  minPrice: number;
  maxPrice: number;
  courtTypes?: string[];
  services?: string[];
}

/**
 * Chi tiết chi nhánh công khai (Public)
 */
export interface PublicBranchDetailDto {
  id: string;
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  ggMapUrl?: string | null;
  distanceKm?: number | null;
  openTime: string;
  closeTime: string;
  policy?: string | null;
  description?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  reviewAverage: number;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: Array<{ key: string; id: string }>;
  sports: BranchSportDto[];
}

/**
 * Tham số tìm kiếm chi nhánh công khai
 */
export interface SearchBranchesParams {
  search?: string;
  province?: string;
  district?: string;
  sportTypeIds?: string[];
  courtTypeName?: string;
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

