export type UserStatusType = 'active' | 'inactive';

export interface UserItem {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  role: string;
  accountType?: number;
  status: UserStatusType;
  isDeleted: boolean;
  createdAt: string;
}

export interface UserSummaryBackendDto {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  accountType: number;
  role: string;
  status: number; // 0 = Active, 1 = Inactive
  isDeleted: boolean;
  createdAt: string;
}

export interface PagedUsersResponse {
  items: UserItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface GetUsersQueryParams {
  search?: string;
  accountType?: number;
  status?: number;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

