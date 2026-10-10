export type UserRole = 'Admin' | 'CourtOwner' | 'Player' | 'SystemAdmin' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  mustChangePwd?: boolean;
  branchId?: string; // If CourtOwner or Staff is linked to a branch
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}
