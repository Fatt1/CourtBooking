import type { UserRole } from '@/types/user';

export interface CourtOwnerLoginRequest {
  email: string;
  password: string;
}

export interface CourtOwnerLoginResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  roleName: UserRole;
  mustChangePassword?: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
