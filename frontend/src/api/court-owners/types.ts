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
  remainingDays?: number;
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
  remainingDays?: number;
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


export interface ServicePackageItem {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
}

