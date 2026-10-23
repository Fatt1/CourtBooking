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

// ── Admin SaaS Subscription Revenue & Analytics Types ─────────
export interface RevenueByPackageItemDto {
  packageId: string;
  packageName: string;
  revenue: number;
  totalSold: number;
  percentage: number;
}

export interface RevenueTimelineItemDto {
  period: string;
  startDate: string;
  revenue: number;
  subscriptionCount: number;
  previousRevenue?: number;
}

export interface SaaSSubscriptionRevenueDto {
  totalRevenue: number;
  totalSubscriptionsSold: number;
  averageRevenuePerSubscription: number;
  previousPeriodRevenue: number;
  growthPercentage: number;
  activeOwnersCount?: number;
  activeOwnersGrowth?: number;
  renewalRate?: number;
  renewalRateGrowth?: number;
  byPackage: RevenueByPackageItemDto[];
  timeline: RevenueTimelineItemDto[];
}

export interface SubscriptionHistoryItemDto {
  id: string;
  courtOwnerId: string;
  ownerName: string;
  businessName: string;
  avatarInitial?: string;
  packageName: string;
  pricePaid: number;
  startDate: string;
  endDate: string;
  transactionCode?: string;
  status: string;
  daysRemaining: number;
}

export interface SubscriptionHistoryResponse {
  subscriptions: {
    items: SubscriptionHistoryItemDto[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | SubscriptionHistoryItemDto[];
  expiringSoonCount: number;
}
