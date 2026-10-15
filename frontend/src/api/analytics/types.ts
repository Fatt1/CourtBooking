/**
 * Analytics & Statistics Types & DTOs
 * Khớp chuẩn cấu trúc trả về từ Backend ASP.NET Core API
 */

export type TimeGrouping = 'Day' | 'Week' | 'Month' | 'Year';

export interface BranchRevenueItemDto {
  branchId: string;
  branchName: string;
  courtRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
  totalBookings: number;
  TotalBookings?: number;
}

export interface CourtOwnerTimelineItemDto {
  period: string;
  date: string;
  courtRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
  bookingsCount: number;
}

export interface CourtOwnerRevenueDto {
  // ── KPI Tổng Doanh Thu ─────────────────────────────────────
  totalNetRevenue: number;
  courtRevenue: number;
  serviceRevenue: number;
  eventRevenue: number;
  totalDiscount: number;

  // ── Chỉ Số Vận Hành ───────────────────────────────────────
  totalBookings: number;
  onlineBookings: number;
  posBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  totalCancelledAmount: number;

  // ── Phân Bổ Chi Nhánh & Biểu Đồ Chuỗi Thời Gian ────────────
  byBranch: BranchRevenueItemDto[];
  timeline: CourtOwnerTimelineItemDto[];
}

export interface CourtOwnerRevenueParams {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  groupBy?: TimeGrouping;
}
