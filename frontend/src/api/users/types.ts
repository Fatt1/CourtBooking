import type { UserRole } from '@/types/user';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  mustChangePwd?: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status?: 'active' | 'inactive';
}
