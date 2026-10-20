export type CourtOwnerStatusType = 'active' | 'inactive';

export interface CourtOwnerItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  businessName?: string;
  status: CourtOwnerStatusType;
  mustChangePwd?: boolean;
  createdAt?: string;
  currentPackageName?: string;
  packageStartDate?: string;
  packageEndDate?: string;
  isPackageActive?: boolean;
}

export interface CourtOwnerBackendDto {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  businessName: string;
  status: number; // 0 = Active, 1 = Inactive
  mustChangePwd: boolean;
  createdAt: string;
  currentPackageName?: string;
  packageStartDate?: string;
  packageEndDate?: string;
  isPackageActive: boolean;
}

export interface PagedCourtOwnersResponse {
  items: CourtOwnerItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface GetCourtOwnersQueryParams {
  search?: string;
  status?: number; // 0 = Active, 1 = Inactive
  page?: number;
  pageSize?: number;
}

export interface CreateCourtOwnerPayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  businessName?: string;
  mustChangePwd?: boolean;
  packageId?: string;
}

export interface ChangeCourtOwnerPackagePayload {
  courtOwnerId: string;
  newPackageId: string;
  packageName?: string;
  ownerName?: string;
  businessName?: string;
  price?: number;
}

export interface ExtendCourtOwnerSubscriptionPayload {
  courtOwnerId: string;
  durationMonths: number;
}

/**
 * 4 Chủ sân mẫu chuẩn thiết kế khớp đúng từng chi tiết trong ảnh
 */
export const MOCK_COURT_OWNERS_DATA: CourtOwnerItem[] = [
  {
    id: 'owner-001',
    fullName: 'Nguyễn Minh Tuấn',
    email: 'minhtuan@gmail.com',
    phoneNumber: '0901234567',
    businessName: 'CLB Cầu Lông Minh Tuấn',
    status: 'active',
    currentPackageName: 'Pro',
    packageStartDate: '2026-06-01',
    packageEndDate: '2026-12-01',
    isPackageActive: true,
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'owner-002',
    fullName: 'Trần Hoàng Nam',
    email: 'hoangnam@gmail.com',
    phoneNumber: '0912345678',
    businessName: 'Sân Pickleball Hoàng Nam',
    status: 'active',
    currentPackageName: 'Basic',
    packageStartDate: '2026-07-15',
    packageEndDate: '2026-10-15',
    isPackageActive: true,
    createdAt: '2026-07-15T09:30:00Z',
  },
  {
    id: 'owner-003',
    fullName: 'Phạm Quốc Bảo',
    email: 'quocbao@gmail.com',
    phoneNumber: '0934567890',
    businessName: 'Cụm Sân Tennis Quốc Bảo',
    status: 'inactive',
    currentPackageName: 'Basic',
    packageStartDate: '2026-05-01',
    packageEndDate: '2026-08-01',
    isPackageActive: false,
    createdAt: '2026-05-01T14:20:00Z',
  },
  {
    id: 'owner-004',
    fullName: 'Vũ Đức Huy',
    email: 'duchuy@gmail.com',
    phoneNumber: '0956789012',
    businessName: 'Trung Tâm Thể Thao Huy Vũ',
    status: 'active',
    currentPackageName: 'VIP',
    packageStartDate: '2026-08-01',
    packageEndDate: '2027-02-01',
    isPackageActive: true,
    createdAt: '2026-08-01T16:45:00Z',
  },
];

export interface ServicePackageItem {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
}

export const MOCK_AVAILABLE_PACKAGES: ServicePackageItem[] = [
  {
    id: 'pkg-basic',
    name: 'Basic',
    price: 499000,
    durationMonths: 1,
    description: '',
  },
  {
    id: 'pkg-pro',
    name: 'Pro',
    price: 1000000,
    durationMonths: 3,
    description: '',
  },
  {
    id: 'pkg-ultra',
    name: 'Ultra',
    price: 2000000,
    durationMonths: 6,
    description: '',
  },
];
