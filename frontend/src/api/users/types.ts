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

/**
 * Danh sách người dùng mẫu chuẩn thiết kế khớp với cơ sở dữ liệu
 */
export const MOCK_USERS_DATA: UserItem[] = [
  {
    id: '168de866-9665-42f6-bb19-4d1d23ea9d6d',
    name: 'Lê Thảo Vy',
    fullName: 'Lê Thảo Vy',
    email: 'thaovy@gmail.com',
    phoneNumber: '0923456789',
    role: 'Player',
    accountType: 0,
    status: 'active',
    isDeleted: false,
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'e992dd5f-4d2d-4bd1-b543-c8b41aba996f',
    name: 'Nguyễn Ngọc Anh',
    fullName: 'Nguyễn Ngọc Anh',
    email: 'ngocanh@gmail.com',
    phoneNumber: '0945678901',
    role: 'Player',
    accountType: 0,
    status: 'active',
    isDeleted: false,
    createdAt: '2026-09-14T09:30:00Z',
  },
  {
    id: 'a0cf93ac-c9d7-4067-b132-1a85529f92f9',
    name: 'Đặng Thu Hà',
    fullName: 'Đặng Thu Hà',
    email: 'thuha@gmail.com',
    phoneNumber: '0967890123',
    role: 'Player',
    accountType: 0,
    status: 'active',
    isDeleted: true,
    createdAt: '2026-09-12T14:20:00Z',
  },
  {
    id: '10808788-d260-4475-a22b-78cb954e4007',
    name: 'Bùi Gia Khánh',
    fullName: 'Bùi Gia Khánh',
    email: 'giakhanh@gmail.com',
    phoneNumber: '0978901234',
    role: 'Player',
    accountType: 0,
    status: 'active',
    isDeleted: false,
    createdAt: '2026-09-10T16:45:00Z',
  },
];
