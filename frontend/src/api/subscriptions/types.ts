export type SubscriptionStatusType = 'ExpiringSoon' | 'Active' | 'Suspended' | 'Expired';

export type SubscriptionActionType = 'Register' | 'ChangePackage' | 'Cancel' | 'Extend';

export interface SubscriptionHistoryItem {
  id: string;
  courtOwnerId: string;
  ownerName: string;
  businessName: string;
  avatarInitial: string;
  packageName: 'Basic' | 'Pro' | 'Ultra' | 'VIP' | string;
  previousPackageName?: string;
  actionType?: SubscriptionActionType;
  actionNote?: string;
  pricePaid?: number;
  startDate: string; // e.g. "01/09/2026"
  endDate: string; // e.g. "30/09/2026"
  createdAt?: string;
  transactionCode: string; // e.g. "PAY-260901-081"
  status: SubscriptionStatusType; // "Sắp hết hạn", "Hoạt động", "Tạm dừng"
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
  status?: string;
  actionType?: string;
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

/**
 * Dữ liệu lịch sử biến động gói cước: Lưu lại Đăng ký mới, Đổi gói, Hủy gói, Gia hạn
 */
export const MOCK_SUBSCRIPTION_HISTORY: SubscriptionHistoryItem[] = [
  {
    id: 'sub-001',
    courtOwnerId: 'owner-001',
    ownerName: 'Nguyễn Minh Tuấn',
    businessName: 'Sân cầu lông Bình Minh',
    avatarInitial: 'MT',
    packageName: 'Pro',
    previousPackageName: 'Basic',
    actionType: 'ChangePackage',
    actionNote: 'Đổi gói từ Basic sang Pro (1.000.000 đ / 3 tháng)',
    startDate: '01/09/2026',
    endDate: '01/12/2026',
    transactionCode: 'PAY-260901-081',
    status: 'Active',
    statusLabel: 'Hoạt động',
    daysRemaining: 43,
    pricePaid: 1000000,
  },
  {
    id: 'sub-002',
    courtOwnerId: 'owner-002',
    ownerName: 'Trần Hoàng Nam',
    businessName: 'Thảo Điền Sports',
    avatarInitial: 'HN',
    packageName: 'Ultra',
    actionType: 'Register',
    actionNote: 'Đăng ký mới gói Ultra (2.000.000 đ / 6 tháng)',
    startDate: '01/09/2026',
    endDate: '01/03/2027',
    transactionCode: 'PAY-260901-072',
    status: 'Active',
    statusLabel: 'Hoạt động',
    daysRemaining: 133,
    pricePaid: 2000000,
  },
  {
    id: 'sub-003',
    courtOwnerId: 'owner-004',
    ownerName: 'Vũ Đức Huy',
    businessName: 'DT Pickleball Club',
    avatarInitial: 'ĐH',
    packageName: 'Pro',
    actionType: 'Extend',
    actionNote: 'Gia hạn thêm 3 tháng gói Pro',
    startDate: '28/08/2026',
    endDate: '28/09/2026',
    transactionCode: 'PAY-260828-065',
    status: 'ExpiringSoon',
    statusLabel: 'Sắp hết hạn',
    daysRemaining: 4,
    pricePaid: 1000000,
  },
  {
    id: 'sub-004',
    courtOwnerId: 'owner-005',
    ownerName: 'Lê Thanh Tùng',
    businessName: 'Sân bóng Phú Nhuận',
    avatarInitial: 'TT',
    packageName: 'Basic',
    actionType: 'Register',
    actionNote: 'Đăng ký mới gói Basic (499.000 đ / 1 tháng)',
    startDate: '10/09/2026',
    endDate: '10/10/2026',
    transactionCode: 'PAY-260910-091',
    status: 'Active',
    statusLabel: 'Hoạt động',
    daysRemaining: 16,
    pricePaid: 499000,
  },
  {
    id: 'sub-005',
    courtOwnerId: 'owner-003',
    ownerName: 'Phạm Quốc Bảo',
    businessName: 'Green Court',
    avatarInitial: 'QB',
    packageName: 'Basic',
    actionType: 'Cancel',
    actionNote: 'Hủy gói / Tạm dừng dịch vụ cụm sân',
    startDate: '20/08/2026',
    endDate: '20/09/2026',
    transactionCode: 'PAY-260820-002',
    status: 'Suspended',
    statusLabel: 'Đã hủy / Tạm dừng',
    daysRemaining: 0,
    pricePaid: 499000,
  },
];

export const MOCK_SERVICE_PACKAGES_CONFIG: ServicePackageConfigItem[] = [
  {
    id: 'pkg-basic',
    code: 'Basic',
    name: 'Basic',
    badge: 'KHỞI ĐẦU',
    price: 499000,
    durationMonths: 1,
    maxCourts: 5,
    maxBranches: 1,
    isActive: true,
    description: '',
    features: [],
  },
  {
    id: 'pkg-pro',
    code: 'Pro',
    name: 'Pro',
    badge: 'PHỔ BIẾN NHẤT',
    popular: true,
    price: 1000000,
    durationMonths: 3,
    maxCourts: 20,
    maxBranches: 3,
    isActive: true,
    description: '',
    features: [],
  },
  {
    id: 'pkg-ultra',
    code: 'Ultra',
    name: 'Ultra',
    badge: 'TOÀN DIỆN',
    price: 2000000,
    durationMonths: 6,
    maxCourts: 999,
    maxBranches: 999,
    isActive: true,
    description: '',
    features: [],
  },
];
