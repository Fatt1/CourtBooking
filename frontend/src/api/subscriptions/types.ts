export type SubscriptionStatusType = 'ExpiringSoon' | 'Active' | 'Suspended' | 'Expired';

export interface SubscriptionHistoryItem {
  id: string;
  courtOwnerId: string;
  ownerName: string;
  businessName: string;
  packageName: string;
  pricePaid?: number;
  startDate: string; // e.g. "01/09/2026"
  endDate: string; // e.g. "30/09/2026"
  createdAt?: string;
  status: SubscriptionStatusType;
  statusLabel?: string;
  daysRemaining?: number;
}

export interface AdminSubscriptionHistoryResponse {
  items: SubscriptionHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  expiringSoonCount: number;
}

export interface GetSubscriptionsQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ServicePackageConfigItem {
  id: string;
  name: string;
  badge?: string;
  code: 'Basic' | 'Pro' | 'Ultra' | 'VIP' | string;
  price: number;
  durationMonths: number;
  description: string;
  features: string[];
  maxCourts: number;
  maxBranches: number;
  isActive: boolean;
  popular?: boolean;
}

export interface CreatePackagePayload {
  name: string;
  price: number;
  description: string;
  durationMonths: number;
  maxCourts?: number;
  maxBranches?: number;
  features?: string[];
  badge?: string;
  isActive?: boolean;
}

export interface UpdatePackagePayload {
  id: string;
  name: string;
  price: number;
  description: string;
  durationMonths: number;
  maxCourts?: number;
  maxBranches?: number;
  features?: string[];
  badge?: string;
  isActive?: boolean;
}

export interface ExtendSubscriptionPayload {
  courtOwnerId: string;
  durationMonths: number;
}

export interface ToggleSubscriptionStatusPayload {
  courtOwnerId: string;
  status: 0 | 1; // 0 = Active, 1 = Inactive (Locked)
}

export interface SubscriptionDto {
  id: string;
  servicePackageId: string;
  packageName: string;
  pricePaid: number;
  startDate: string;
  endDate: string;
}

export interface OwnerSubscriptionMeResponse {
  currentSubscription: SubscriptionDto | null;
  history: SubscriptionHistoryItem[];
}
